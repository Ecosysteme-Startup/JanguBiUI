import type { Mystery, Prayer } from '@/hooks/use-rosary-today';

/** « fruit : la confiance » (maquette FID-Chapelet) ; rien si le mystère n'en a pas. */
export const fruitLabel = (m: Mystery) => (m.fruit ? `fruit : ${m.fruit.charAt(0).toLowerCase()}${m.fruit.slice(1)}` : null);

/** Titre sans le point final des données (« Les noces de Cana. » → « Les noces de Cana »). */
export const mysteryTitle = (m: Mystery) => m.title.replace(/\.\s*$/, '');

const byType = (prayers: Prayer[], type: string) => prayers.find((p) => p.type === type);

/**
 * Les grains d'une dizaine : ceux du mystère, dans l'ordre ; à défaut (données incomplètes),
 * une dizaine type reconstituée à partir des prières isolées (Notre Père, 10 Ave, Gloire).
 */
export const decadeOf = (mystery: Mystery, standalone: Prayer[]): Prayer[] => {
  const own = [...mystery.prayers].sort((a, b) => a.order - b.order).map((p) => p.prayer);
  if (own.length > 0) return own;
  const [of, hm, gb] = ['OUR_FATHER', 'HAIL_MARY', 'GLORY_BE'].map((t) => byType(standalone, t));
  if (!of || !hm || !gb) return [];
  return [of, ...Array.from({ length: 10 }, () => hm), gb];
};

export type Bead = { prayer: Prayer; label: string; hailMary: number | null };

/** Grains étiquetés : NP, 1…10, G, F. */
export const beadsOf = (decade: Prayer[]): Bead[] => {
  let count = 0;
  return decade.map((prayer) => {
    if (prayer.type === 'HAIL_MARY') {
      count += 1;
      return { prayer, label: String(count), hailMary: count };
    }
    const label = { OUR_FATHER: 'NP', GLORY_BE: 'G', FATIMA: 'F' }[prayer.type] ?? prayer.type_display.charAt(0);
    return { prayer, label, hailMary: null };
  });
};

const ORDINAL_WORDS = ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième'];

/** « Troisième mystère lumineux » (en-tête de la dizaine). */
export const mysteryHeading = (n: number, group: string) =>
  `${ORDINAL_WORDS[n - 1] ?? `${n}e`} mystère ${group.replace(/^myst[èe]res\s+/i, '').toLowerCase()}`;

/** Les mystères selon les jours (usage de l'Église) ; jours numérotés comme l'API : lundi = 0. */
export const MYSTERIES_BY_DAY: { days: string; group: string; weekdays: number[] }[] = [
  { days: 'Lundi et samedi', group: 'Joyeux', weekdays: [0, 5] },
  { days: 'Mardi et vendredi', group: 'Douloureux', weekdays: [1, 4] },
  { days: 'Mercredi et dimanche', group: 'Glorieux', weekdays: [2, 6] },
  { days: 'Jeudi', group: 'Lumineux', weekdays: [3] },
];

/** `?jour=N` de l'URL : un jour de 0 (lundi) à 6 (dimanche), sinon null. */
export const parseWeekday = (value: string | undefined | null): number | null => {
  if (!value || !/^[0-6]$/.test(value)) return null;
  return Number(value);
};
