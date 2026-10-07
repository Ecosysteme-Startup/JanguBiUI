import { AelfIntro, AelfResponses } from '@/components/liturgy/aelf-parts';
import { aelfField } from '@/utils/aelf';

import type { Reading } from '../api/get-liturgy-day';
import { readingAnchor, readingLabel, readingTitle } from '../utils/readings';

import { ReadingText } from './reading-text';

const closing = (reading: Reading) => {
  const label = readingLabel(reading.type);
  if (label === 'Évangile') return 'Acclamons la Parole de Dieu.';
  if (label === 'Psaume' || label === 'Cantique' || label === 'Séquence' || label === 'Acclamation de l’Évangile') return null;
  return 'Parole du Seigneur.';
};

/** Lectures d'un onglet de la Parole du jour : genre, livre, référence, texte et formule de conclusion. */
export const ReadingsList = ({ readings, offset = 0 }: { readings: Reading[]; offset?: number }) => (
  <>
    {readings.map((reading, index) => {
      const anchor = readingAnchor(reading, offset + index);
      const end = closing(reading);
      return (
        <section key={`${reading.type}-${index}`} id={anchor} aria-labelledby={`t-${anchor}`} className="scroll-mt-6">
          <p className="m-0 text-14 text-ink-3">{readingLabel(reading.type)}</p>
          <h2 id={`t-${anchor}`} className="m-0 mt-1 text-24 font-semibold text-ink">
            <span className="sr-only">{readingLabel(reading.type)} : </span>
            {readingTitle(reading)}
          </h2>
          {aelfField(reading.aelf, 'titre') && <p className="tnum m-0 mt-1 text-15 text-ink-2">{reading.citation}</p>}
          <AelfIntro aelf={reading.aelf} className="mt-6 text-16" />
          <AelfResponses aelf={reading.aelf} className="mt-6 font-serif text-20 leading-8 text-ink" />
          <div className="mt-8">
            <ReadingText reading={reading} />
            {end && <p className="m-0 mt-6 font-serif text-20 leading-8 text-ink-2">{end}</p>}
          </div>
        </section>
      );
    })}
  </>
);
