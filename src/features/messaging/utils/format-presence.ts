import type { Presence } from '@/stores/realtime-store';

// Affichage de la présence (spec ECRANS-V2-POUR-VOUS-PRESENCE §2) :
// « En ligne » (toujours avec texte), sinon « Vu aujourd'hui à 18:47 »,
// « Vu hier à 21:05 », « Vu le 22 sept. » ; au-delà de 7 jours, ou présence
// masquée : rien. Heure de Dakar (UTC, sans heure d'été).

export type LibellePresence =
  | { etat: 'en_ligne'; texte: 'En ligne' }
  | { etat: 'vu'; texte: string };

const MOIS_COURTS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

const JOUR_MS = 86_400_000;
const jourDakar = (d: Date) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const heure = (d: Date) =>
  `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

export const libellePresence = (
  presence: Presence | undefined,
  maintenant: Date = new Date(),
): LibellePresence | null => {
  if (!presence || !presence.visible) return null;
  if (presence.online) return { etat: 'en_ligne', texte: 'En ligne' };
  if (!presence.last_seen_at) return null;
  const vu = new Date(presence.last_seen_at);
  if (Number.isNaN(vu.getTime())) return null;
  const ecart = (jourDakar(maintenant) - jourDakar(vu)) / JOUR_MS;
  if (ecart < 0 || ecart > 7) return null;
  if (ecart === 0)
    return { etat: 'vu', texte: `Vu aujourd'hui à ${heure(vu)}` };
  if (ecart === 1) return { etat: 'vu', texte: `Vu hier à ${heure(vu)}` };
  return {
    etat: 'vu',
    texte: `Vu le ${vu.getUTCDate()}\u00A0${MOIS_COURTS[vu.getUTCMonth()]}`,
  };
};
