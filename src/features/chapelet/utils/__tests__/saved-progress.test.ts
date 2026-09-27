import { loadProgress, progressKey, saveProgress } from '@/features/chapelet/utils/saved-progress';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('avancée du chapelet gardée pour la journée', () => {
  const lengths = [12, 12, 12, 12, 12];

  it('relit l’avancée enregistrée pour le jour et les mystères', () => {
    const storage = memory();
    const key = progressKey('2026-09-24', 'lumineux');
    saveProgress(storage, key, { mystery: 2, step: 7, done: false });
    expect(loadProgress(storage, key, lengths)).toEqual({ mystery: 2, step: 7, done: false });
  });

  it('change de clé le lendemain ou pour d’autres mystères', () => {
    expect(progressKey('2026-09-24', 'lumineux')).not.toBe(progressKey('2026-09-25', 'lumineux'));
    expect(progressKey('2026-09-24', 'lumineux')).not.toBe(progressKey('2026-09-24', 'joyeux'));
    expect(loadProgress(memory(), progressKey('2026-09-25', 'lumineux'), lengths)).toBeNull();
  });

  it('ignore une valeur illisible ou hors des dizaines', () => {
    const storage = memory();
    storage.setItem('a', 'pas du json');
    storage.setItem('b', JSON.stringify({ mystery: 7, step: 0, done: false }));
    storage.setItem('c', JSON.stringify({ mystery: 0, step: 40, done: false }));
    storage.setItem('d', JSON.stringify({ mystery: '1', step: 0, done: false }));
    for (const key of ['a', 'b', 'c', 'd']) expect(loadProgress(storage, key, lengths)).toBeNull();
  });

  it('continue sans stockage (navigation privée)', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(loadProgress(broken, 'k', lengths)).toBeNull();
    expect(() => saveProgress(broken, 'k', { mystery: 0, step: 1, done: false })).not.toThrow();
    expect(loadProgress(null, 'k', lengths)).toBeNull();
  });
});
