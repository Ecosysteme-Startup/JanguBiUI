import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import type { Reading } from '@/features/parole/api/get-liturgy-day';
import { readingChapter, readingShortTitle } from '@/features/parole/utils/liturgy';
import { cn } from '@/utils/cn';

const cardClass = 'flex w-full items-center gap-3 rounded-16 border border-line px-5 py-4 text-left text-ink transition-colors hover:border-line-active hover:text-ink';

const Label = ({ kicker, title, className }: { kicker: string; title: ReactNode; className?: string }) => (
  <span className={cn('flex min-w-0 flex-1 flex-col', className)}>
    <span className="text-13 text-ink-3">{kicker}</span>
    <span className="text-16 font-semibold">{title}</span>
  </span>
);

/** Lecture précédente, et le chapitre entier dans la Bible (ou la lecture suivante). */
export const ReadingPager = ({ readings, active, onSelect }: { readings: Reading[]; active: number; onSelect: (index: number) => void }) => {
  const prev = readings[active - 1];
  const next = readings[active + 1];
  const chapter = readingChapter(readings[active]);
  if (!prev && !chapter && !next) return null;
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {prev ? (
        <button type="button" onClick={() => onSelect(active - 1)} className={cardClass}>
          <Icon name="chevron-gauche" size={18} className="shrink-0" />
          <Label kicker="Précédent" title={readingShortTitle(prev)} />
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      {chapter ? (
        <NextLink href={paths.app.bible.chapitre.getHref(chapter.book, chapter.chapter)} className={cardClass}>
          <Label kicker="Dans la Bible" title={`Lire tout le chapitre de ${chapter.book} ${chapter.chapter}`} />
          <Icon name="chevron-droite" size={18} className="shrink-0" />
        </NextLink>
      ) : (
        next && (
          <button type="button" onClick={() => onSelect(active + 1)} className={cardClass}>
            <Label kicker="Suivant" title={readingShortTitle(next)} />
            <Icon name="chevron-droite" size={18} className="shrink-0" />
          </button>
        )
      )}
    </div>
  );
};
