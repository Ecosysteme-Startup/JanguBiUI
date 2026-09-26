const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';

interface MailpitMessageSummary {
  ID: string;
  To: { Address: string }[];
  From: { Address: string };
  Subject: string;
  Created: string;
}

interface MailpitSearchResponse {
  messages: MailpitMessageSummary[];
}

interface MailpitFullMessage {
  Text: string;
  HTML: string;
  Subject: string;
}

/** Cherche le dernier e-mail reçu par une adresse (poll jusqu'à `timeoutMs`). */
export async function waitForLastEmail(
  toAddress: string,
  opts: { timeoutMs?: number; subjectContains?: string } = {},
): Promise<MailpitFullMessage> {
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const deadline = Date.now() + timeoutMs;
  const query = encodeURIComponent(`to:"${toAddress}"`);

  let lastCount = 0;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}&limit=5`);
    if (res.ok) {
      const data = (await res.json()) as MailpitSearchResponse;
      const candidates = opts.subjectContains
        ? data.messages.filter((m) => m.Subject.includes(opts.subjectContains as string))
        : data.messages;
      lastCount = data.messages.length;
      if (candidates.length > 0) {
        const newest = candidates[0]; // Mailpit search trie par date décroissante.
        const full = await fetch(`${MAILPIT_URL}/api/v1/message/${newest.ID}`);
        return (await full.json()) as MailpitFullMessage;
      }
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  throw new Error(
    `Aucun e-mail reçu pour ${toAddress}${opts.subjectContains ? ` (sujet contenant "${opts.subjectContains}")` : ''} après ${timeoutMs}ms (dernier total vu: ${lastCount}).`,
  );
}

/** Extrait le premier lien http(s) trouvé dans le corps texte/HTML d'un message. */
export function extractFirstLink(message: MailpitFullMessage, mustContain?: string): string {
  const body = message.Text || message.HTML;
  const links = body.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  const link = mustContain ? links.find((l) => l.includes(mustContain)) : links[0];
  if (!link) {
    throw new Error(`Aucun lien${mustContain ? ` contenant "${mustContain}"` : ''} trouvé dans l'e-mail "${message.Subject}".`);
  }
  return link.replace(/[).,]+$/, '');
}
