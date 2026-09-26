'use client';

import { useLiturgyDay } from '../api/get-liturgy-day';
import { findReading } from '../utils/readings';

const TABS = ['Lecture', 'Psaume', 'Évangile'];

/**
 * Aperçu de la Parole (WEB-Accueil, « Ce que vous pouvez faire ») : le psaume du jour, deux
 * versets, dans le cadre de la page des lectures. Illustration non interactive.
 */
export const PsalmPreview = () => {
  const { data } = useLiturgyDay();
  const psalm = data ? findReading(data.readings, 'psaume') : undefined;
  if (!psalm || psalm.verses.length === 0) return null;
  const verses = psalm.verses.slice(0, 2);

  return (
    <div className="rounded-16 border border-line bg-paper p-5 shadow-card md:p-6">
      <div aria-hidden="true" className="grid grid-cols-3 rounded-10 bg-surface-2 p-[3px]">
        {TABS.map((tab) => (
          <span
            key={tab}
            className={
              tab === 'Psaume'
                ? 'flex h-[34px] items-center justify-center rounded-8 bg-paper text-14 font-semibold text-ink shadow-card'
                : 'flex h-[34px] items-center justify-center text-14 font-medium text-ink-2'
            }
          >
            {tab}
          </span>
        ))}
      </div>
      <p className="tnum m-0 mt-5 text-13 text-ink-3">{psalm.citation.replace(/^Ps\b/, 'Psaume')}</p>
      {verses.map((verse) => (
        <p key={`${verse.chapter}-${verse.number}`} className="m-0 mt-3 font-serif text-20 leading-[30px] text-ink">
          <sup className="tnum mr-1 font-sans text-11 text-ink-3">{verse.number}</sup>
          {verse.text}
        </p>
      ))}
    </div>
  );
};
