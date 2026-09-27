'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useGospelOfDay } from '@/features/bible/api/get-gospel-of-day';
import { useTestaments } from '@/features/bible/api/get-testaments';
import { BibleShell } from '@/features/bible/components/bible-shell';
import { BookPanel } from '@/features/bible/components/book-panel';
import { ChapterReader } from '@/features/bible/components/chapter-reader';

/**
 * /app/bible (FID-Bible) : la Bible s'ouvre sur l'Évangile du jour (son passage d'abord, le chapitre
 * sur demande) ; sans Évangile disponible, on choisit un livre.
 */
export const BibleHome = () => {
  const gospel = useGospelOfDay();
  const testaments = useTestaments();

  if (gospel.data) {
    const { book, chapter, from, to } = gospel.data;
    const label = `Ouvert au passage de l’Évangile du jour, ${from === to ? `verset ${from}` : `versets ${from} à ${to}`}.`;
    return <ChapterReader livre={book} chapitre={chapter} passage={{ from, to, label }} />;
  }
  if (gospel.isPending) {
    return (
      <BibleShell panel={null}>
        <LoadingBlock label="Chargement de la Bible…" lines={6} />
      </BibleShell>
    );
  }
  // Pas d'Évangile du jour (ou service liturgique indisponible) : choix du livre.
  return testaments.data ? (
    <BibleShell panel={<BookPanel testaments={testaments.data} />}>
      <EmptyState icon="bible" title="Choisissez un livre">
        <p className="m-0">Ouvrez un livre dans la liste, ou cherchez un mot dans le texte.</p>
      </EmptyState>
    </BibleShell>
  ) : (
    <ChapterReader livre="" chapitre={0} />
  );
};
