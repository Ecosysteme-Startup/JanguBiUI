import type { Mystery, Prayer, RosaryToday } from '@/features/chapelet/api/get-rosary-today';

export const PRAYER_NAMES: Record<string, string> = {
  SIGN_OF_CROSS: 'Signe de croix',
  CREED: 'Je crois en Dieu',
  OUR_FATHER: 'Notre Père',
  HAIL_MARY: 'Je vous salue Marie',
  GLORY_BE: 'Gloire au Père',
  FATIMA: 'Prière de Fatima',
  HOLY_QUEEN: 'Salut, ô Reine',
  FINAL_PRAYER: 'Prière finale',
};
export const prayerName = (type: string) => PRAYER_NAMES[type] ?? 'Prière';

export const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** 1er, 2e… (masculin, pour « mystère ») */
export const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

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
    const label = { OUR_FATHER: 'NP', GLORY_BE: 'G', FATIMA: 'F' }[prayer.type] ?? prayerName(prayer.type).charAt(0);
    return { prayer, label, hailMary: null };
  });
};

// Environ 18 s par grain : une dizaine (13 grains) dure un peu moins de 4 minutes.
const SECONDS_PER_BEAD = 18;

export const remainingMinutes = (rosary: RosaryToday, mystery: number, step: number) => {
  const decades = rosary.day.group.mysteries.map((m) => decadeOf(m, rosary.standalone_prayers).length);
  const left = decades.slice(mystery).reduce((n, len) => n + len, 0) - step;
  return Math.max(1, Math.round((left * SECONDS_PER_BEAD) / 60));
};
