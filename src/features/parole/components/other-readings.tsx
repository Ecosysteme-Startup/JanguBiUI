import { Icon } from '@/components/ui/icon';
import type { Reading } from '@/features/parole/api/get-liturgy-day';
import { readingLabel } from '@/features/parole/utils/liturgy';
import { frenchTypo } from '@/utils/french-typo';

const excerpt = (reading: Reading) => {
  const first = reading.verses[0]?.text;
  if (first) return `« ${first} »`;
  return null;
};

/** « Les autres lectures du jour » (FID-Parole) : chacune ouvre son onglet. */
export const OtherReadings = ({ readings, active, onSelect }: { readings: Reading[]; active: number; onSelect: (index: number) => void }) => {
  const others = readings.map((reading, index) => ({ reading, index })).filter(({ index }) => index !== active);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="autres-titre" className="mt-12">
      <h2 id="autres-titre" className="m-0 text-20 font-semibold text-ink">
        Les autres lectures du jour
      </h2>
      <ul className="m-0 mt-4 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card">
        {others.map(({ reading, index }) => {
          const quote = excerpt(reading);
          return (
            <li key={`${reading.type}-${index}`} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left text-ink transition-colors hover:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="tnum block text-13 text-ink-3">
                    {readingLabel(reading.type)} · {reading.citation}
                  </span>
                  {quote && <span className="mt-1.5 line-clamp-2 block font-serif text-18 text-ink">{frenchTypo(quote)}</span>}
                </span>
                <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
