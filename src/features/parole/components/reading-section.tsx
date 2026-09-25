import DOMPurify from 'isomorphic-dompurify';

import type { Reading } from '@/features/parole/api/get-liturgy-day';
import { TEXT_SIZES, type TextSize } from '@/features/parole/components/text-size-control';
import { closingFormula, readingLabel, readingTitle } from '@/features/parole/utils/liturgy';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

export const readingAnchor = (index: number) => `lecture-${index + 1}`;
export const readingNumber = (index: number) => String(index + 1).padStart(2, '0');

/** Une lecture de la messe : légende numérotée, titre, versets numérotés, acclamation. */
export const ReadingSection = ({
  reading,
  index,
  size,
  hiddenOnMobile,
}: {
  reading: Reading;
  index: number;
  size: TextSize;
  hiddenOnMobile: boolean;
}) => {
  const titleId = `${readingAnchor(index)}-titre`;
  const closing = closingFormula(reading.type);
  const firstChapter = reading.verses[0]?.chapter;
  return (
    <section
      id={readingAnchor(index)}
      aria-labelledby={titleId}
      className={cn('scroll-mt-6', hiddenOnMobile && 'hidden lg:block')}
    >
      <p className="tnum m-0 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
        <span>
          <span className="text-primary">{readingNumber(index)}</span> — {readingLabel(reading.type)}
        </span>
        <span>{reading.citation}</span>
      </p>
      <h2 id={titleId} className="m-0 mt-4 font-serif text-[29px] font-normal leading-[1.1] tracking-[-0.01em] text-ink">
        {readingTitle(reading)}
      </h2>
      {reading.verses.length > 0 ? (
        <div className="mt-6 flex max-w-reading flex-col gap-2 font-serif text-ink">
          {reading.verses.map((v) => (
            <p key={`${v.chapter}-${v.number}`} className={cn('m-0 grid grid-cols-[40px_minmax(0,1fr)] gap-2', TEXT_SIZES[size].reading)}>
              <span className="tnum pt-1.5 font-sans text-meta text-primary">
                {v.chapter === firstChapter ? v.number : `${v.chapter}, ${v.number}`}
              </span>
              <span>{frenchTypo(v.text)}</span>
            </p>
          ))}
        </div>
      ) : reading.text ? (
        <div
          className={cn('mt-6 max-w-reading font-serif text-ink [&_p]:m-0 [&_p]:mb-3', TEXT_SIZES[size].reading)}
          // Texte AELF (source « aelf ») : HTML fourni par l'API, assaini avant affichage.
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reading.text) }}
        />
      ) : (
        <p className="m-0 mt-6 max-w-reading text-base text-ink-3">Le texte de cette lecture n’est pas encore disponible.</p>
      )}
      {closing && (reading.verses.length > 0 || reading.text) && (
        <p className="m-0 ml-12 mt-4 font-serif text-h4 italic leading-[1.3] text-ink-2">{closing}</p>
      )}
    </section>
  );
};
