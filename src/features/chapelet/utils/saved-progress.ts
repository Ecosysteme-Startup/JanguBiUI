import type { Progress } from '@/features/chapelet/utils/progress';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Clé du jour et des mystères priés : l'avancée est gardée jusqu'au soir (lendemain = nouvelle clé). */
export const progressKey = (date: string, group: string) => `jangubi:chapelet:${date}:${group}`;

const isProgress = (value: unknown): value is Progress =>
  typeof value === 'object' &&
  value !== null &&
  Number.isInteger((value as Progress).mystery) &&
  Number.isInteger((value as Progress).step) &&
  typeof (value as Progress).done === 'boolean' &&
  (value as Progress).mystery >= 0 &&
  (value as Progress).step >= 0;

/** Avancée enregistrée pour cette clé, si elle est lisible et cohérente avec les dizaines ; sinon null. */
export const loadProgress = (storage: StorageLike | null, key: string, lengths: number[]): Progress | null => {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isProgress(value) || value.mystery >= lengths.length || value.step >= (lengths[value.mystery] ?? 0)) return null;
    return { mystery: value.mystery, step: value.step, done: value.done };
  } catch {
    return null;
  }
};

/** Enregistre l'avancée (stockage indisponible : on continue sans). */
export const saveProgress = (storage: StorageLike | null, key: string, progress: Progress) => {
  try {
    storage?.setItem(key, JSON.stringify(progress));
  } catch {
    // Navigation privée ou stockage plein : l'avancée n'est simplement pas gardée.
  }
};

/** Le stockage local du navigateur, s'il est accessible. */
export const browserStorage = (): StorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};
