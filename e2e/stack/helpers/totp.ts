import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Fichier partagé entre agents de recette (voir 00-BRIEF-RECETTE.md).
 * Peut être surchargé par la variable d'env TOTP_SECRETS_FILE.
 */
const SECRETS_FILE =
  process.env.TOTP_SECRETS_FILE ??
  '/tmp/claude-1000/-home-sosza-PycharmProjects-Numerisen/15b0994d-7ed2-4a0a-9ec6-96e5f7bf90f7/scratchpad/totp-secrets.json';

function readSecrets(): Record<string, string> {
  if (!existsSync(SECRETS_FILE)) return {};
  const raw = readFileSync(SECRETS_FILE, 'utf-8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Lit le secret TOTP partagé pour un compte, ou undefined si jamais enrôlé. */
export function getTotpSecret(email: string): string | undefined {
  return readSecrets()[email];
}

/** Écrit un secret TOTP nouvellement enrôlé, sous verrou (flock) pour éviter les courses entre agents. */
export function saveTotpSecret(email: string, secret: string): void {
  const lockFile = `${SECRETS_FILE}.lock`;
  const script = `
import fcntl, json, sys, os
lock_path = ${JSON.stringify(lockFile)}
secrets_path = ${JSON.stringify(SECRETS_FILE)}
email = ${JSON.stringify(email)}
secret = ${JSON.stringify(secret)}
with open(lock_path, 'w') as lf:
    fcntl.flock(lf, fcntl.LOCK_EX)
    try:
        data = {}
        if os.path.exists(secrets_path):
            with open(secrets_path) as f:
                raw = f.read().strip()
                if raw:
                    data = json.loads(raw)
        data[email] = secret
        with open(secrets_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    finally:
        fcntl.flock(lf, fcntl.LOCK_UN)
`;
  execFileSync('python3', ['-c', script]);
}

// Keycloak refuse de réutiliser un code TOTP dans la même fenêtre de 30 s (anti-rejeu).
// Comme plusieurs connexions successives du même compte peuvent tomber dans la même fenêtre
// (tests rapides), on mémorise la dernière fenêtre utilisée par secret et on attend la
// suivante si besoin, plutôt que de risquer un verrouillage anti-force-brute.
const lastWindowUsed = new Map<string, number>();

/** Calcule le code TOTP courant (RFC 6238, SHA1, 6 chiffres, pas de 30s), en évitant de
 * réutiliser la même fenêtre de 30 s que le dernier appel pour ce secret. */
export async function computeFreshTotpCode(secret: string): Promise<string> {
  let currentWindow = Math.floor(Date.now() / 1000 / 30);
  while (lastWindowUsed.get(secret) === currentWindow) {
    const msUntilNextWindow = (currentWindow + 1) * 30_000 - Date.now() + 250;
    await new Promise((r) => setTimeout(r, Math.max(msUntilNextWindow, 250)));
    currentWindow = Math.floor(Date.now() / 1000 / 30);
  }
  lastWindowUsed.set(secret, currentWindow);
  return computeTotpCode(secret);
}

/** Calcule le code TOTP courant (RFC 6238, SHA1, 6 chiffres, pas de 30s). */
export function computeTotpCode(secret: string): string {
  const script = `
import hmac,hashlib,struct,time,base64,sys
secret = sys.argv[1]
k = base64.b32decode(secret.upper() + '=' * (-len(secret) % 8))
c = struct.pack('>Q', int(time.time()) // 30)
h = hmac.new(k, c, hashlib.sha1).digest()
o = h[-1] & 15
print('%06d' % ((struct.unpack('>I', h[o:o + 4])[0] & 0x7fffffff) % 1000000))
`;
  return execFileSync('python3', ['-c', script, secret]).toString().trim();
}

/** Extrait le secret base32 affiché par Keycloak sur l'écran d'enrôlement OTP ("Impossible de scanner ?"). */
export function extractSecretFromKeyUri(keyUriOrRaw: string): string {
  // Keycloak affiche soit l'URI otpauth://... soit directement le secret nu.
  const match = /secret=([A-Z2-7]+)/i.exec(keyUriOrRaw);
  if (match) return match[1];
  return keyUriOrRaw.replace(/\s+/g, '');
}
