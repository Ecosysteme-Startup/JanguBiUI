/** Utilitaires d'affichage du lecteur (français, chiffres tabulaires). */

/** 112 → « 1:52 » ; 3725 → « 1:02:05 ». */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = sec.toString().padStart(2, '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

/** Temps restant, avec le vrai signe moins : « −2:20 ». */
export function formatRemaining(position: number, duration: number): string {
  return `−${formatClock(Math.max(0, duration - position))}`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

/** 112 → « 1 minute 52 secondes » (lecteurs d'écran). */
export function spokenDuration(
  seconds: number,
  withSecondsWord = true,
): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(plural(h, 'heure'));
  if (m > 0) parts.push(plural(m, 'minute'));
  if (sec > 0 || parts.length === 0) {
    parts.push(withSecondsWord ? plural(sec, 'seconde') : `${sec}`);
  }
  return parts.join(' ');
}

/** aria-valuetext du curseur : « 1 minute 52 secondes sur 4 minutes 12 ». */
export function positionValueText(position: number, duration: number): string {
  return `${spokenDuration(position)} sur ${spokenDuration(duration, false)}`;
}

/** 1.25 → « 1,25× ». */
export function formatRate(rate: number): string {
  return `${rate.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}×`;
}

/**
 * Réduit les 200 pics du contrat à `count` barres (maximum de chaque tranche),
 * normalisées entre 0,12 et 1 pour que les silences restent visibles.
 */
export function downsamplePeaks(peaks: number[], count: number): number[] {
  if (count <= 0) return [];
  if (peaks.length === 0) return Array.from({ length: count }, () => 0.3);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * peaks.length) / count);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) * peaks.length) / count),
    );
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      const v = peaks[j];
      if (Number.isFinite(v) && v > max) max = v;
    }
    out.push(Math.min(1, Math.max(0.12, max)));
  }
  return out;
}

/** Libellé humain de l'appareil qui a écrit l'état de lecture. */
export function deviceLabel(deviceId: string): string {
  const id = deviceId.toLowerCase();
  if (id.startsWith('ios')) return 'votre iPhone';
  if (id.startsWith('android')) return 'votre téléphone Android';
  if (id.startsWith('web')) return 'un autre navigateur';
  return 'un autre appareil';
}

const SEASONS: Record<string, string> = {
  avent: 'Temps de l’Avent',
  noel: 'Temps de Noël',
  careme: 'Temps du Carême',
  triduum: 'Triduum pascal',
  paques: 'Temps pascal',
  ordinaire: 'Temps ordinaire',
};

export function seasonLabel(season?: string | null): string | null {
  if (!season) return null;
  return SEASONS[season] ?? null;
}

/** Heure « 12:34 » (fuseau de Dakar = UTC). */
export function formatHour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Dakar',
  });
}
