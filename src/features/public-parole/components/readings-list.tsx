import type { Reading } from '../api/get-liturgy-day';
import { readingAnchor, readingLabel } from '../utils/readings';

import { ReadingText } from './reading-text';

const number = (index: number) => String(index + 1).padStart(2, '0');

const closing = (reading: Reading) => {
  const label = readingLabel(reading.type);
  if (label === 'Évangile') return 'Acclamons la Parole de Dieu.';
  if (label === 'Psaume' || label === 'Cantique' || label === 'Séquence') return null;
  return 'Parole du Seigneur.';
};

/** Entrée du sommaire (lien vers l'ancre de la lecture). */
export const ReadingTocItem = ({ reading, index }: { reading: Reading; index: number }) => (
  <li>
    <a href={`#${readingAnchor(reading, index)}`} className="flex flex-col gap-0.5 border-b border-line py-3 text-ink-2 hover:text-primary">
      <span className="text-base font-semibold">{readingLabel(reading.type)}</span>
      <span className="tnum text-xs text-ink-3">{reading.citation}</span>
    </a>
  </li>
);

/** Les lectures de la messe, numérotées, avec leur formule de conclusion. */
export const ReadingsList = ({ readings }: { readings: Reading[] }) => (
  <>
    {readings.map((reading, index) => {
      const anchor = readingAnchor(reading, index);
      const end = closing(reading);
      return (
        <section key={`${reading.type}-${index}`} id={anchor} aria-labelledby={`t-${anchor}`} className="scroll-mt-6">
          <div className="tnum flex items-baseline justify-between gap-4 border-t border-ink pt-3 text-meta text-ink-2">
            <span>
              <span className="text-primary">{number(index)}</span> — {readingLabel(reading.type)}
            </span>
          </div>
          <h2 id={`t-${anchor}`} className="m-0 mt-6 font-serif text-h2 font-normal text-ink">
            <span className="sr-only">{readingLabel(reading.type)} : </span>
            {reading.citation}
          </h2>
          <div className="mt-6">
            <ReadingText reading={reading} />
          </div>
          {end && <p className="m-0 mt-6 font-serif text-h4 italic text-ink-2">{end}</p>}
        </section>
      );
    })}
  </>
);
