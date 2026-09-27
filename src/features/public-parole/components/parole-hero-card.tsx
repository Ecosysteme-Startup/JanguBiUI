'use client';

import { Ordinals } from '@/components/signature/liturgical-banner';
import { longDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useLiturgyDay } from '../api/get-liturgy-day';
import { findReading, firstVerseReference, readingExcerpt, readingTitle, shortCitation } from '../utils/readings';

import { ColorTag } from './color-tag';

const CITATIONS = [
  { kind: 'lecture', label: 'Lecture' },
  { kind: 'psaume', label: 'Psaume' },
  { kind: 'evangile', label: 'Évangile' },
] as const;

/**
 * Carte « Parole du jour » de l'ouverture de l'accueil (WEB-Accueil) : jour, couleur,
 * célébration, premier verset de la première lecture et les trois références du jour.
 */
export const ParoleHeroCard = ({ className }: { className?: string }) => {
  const { data } = useLiturgyDay();
  if (!data) return null;
  const first = findReading(data.readings, 'lecture');
  const excerpt = first ? readingExcerpt(first, 110) : null;
  const citations = CITATIONS.map((c) => ({ ...c, reading: findReading(data.readings, c.kind) })).filter((c) => c.reading);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-13 text-ink-3">{longDate(data.date)}</span>
        <ColorTag color={data.calendar.color} />
      </div>
      <p className="m-0 mt-2 text-17 font-semibold text-ink">
        <Ordinals text={data.calendar.celebration} />
      </p>
      {excerpt && first && (
        <>
          <p className="m-0 mt-4 font-serif text-20 leading-[30px] text-ink">« {frenchTypo(excerpt.text)} »</p>
          <p className="m-0 mt-2 text-13 text-ink-3">{firstVerseReference(first) ?? readingTitle(first)}</p>
        </>
      )}
      {citations.length > 0 && (
        <dl className="tnum m-0 mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          {citations.map(({ label, reading }) => (
            <div key={label} className="min-w-0">
              <dt className="text-12 text-ink-3">{label}</dt>
              <dd className="m-0 truncate text-14 font-semibold text-ink">{shortCitation(reading?.citation ?? '')}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
