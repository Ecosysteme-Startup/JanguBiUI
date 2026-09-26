'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useTestaments } from '@/features/bible/api/get-testaments';
import { BibleSearch } from '@/features/bible/components/bible-search';
import { BookNav } from '@/features/bible/components/book-nav';
import { ApiError } from '@/lib/api-client';

/** Choix du livre (FID-Bible, sans chapitre ouvert) et recherche. */
export const BibleHome = () => {
  const testaments = useTestaments();
  const empty = testaments.data?.every((t) => t.books.length === 0) ?? false;
  return (
    <div className="mx-auto max-w-[1200px]">
      <NextLink
        href={paths.app.parole.getHref()}
        className="mb-6 inline-flex h-11 items-center gap-2 text-sm font-medium text-primary hover:text-primary-strong"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Lectures du jour
      </NextLink>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">01</span> — La Bible
          </p>
          <h1 className="m-0 mt-3 font-serif text-[2.25rem] font-normal leading-none tracking-[-0.015em] text-ink lg:text-[3.125rem]">
            Ouvrir la <em className="italic text-primary">Bible</em>
          </h1>
        </div>
        <BibleSearch className="w-full lg:w-[360px]" />
      </div>
      <div className="mt-8 max-w-[720px]">
        {testaments.isPending ? (
          <LoadingBlock label="Chargement de la Bible…" lines={6} />
        ) : testaments.isError ? (
          <EmptyState
            tone="err"
            title="Impossible d’ouvrir la Bible."
            action={
              <Button variant="secondary" onClick={() => testaments.refetch()}>
                Réessayer
              </Button>
            }
          >
            <p className="m-0">
              {testaments.error instanceof ApiError ? testaments.error.message : 'Le service ne répond pas. Réessayez dans un instant.'}
            </p>
          </EmptyState>
        ) : empty ? (
          <EmptyState icon="bible" title="La Bible n’est pas encore disponible." />
        ) : (
          <BookNav testaments={testaments.data} />
        )}
      </div>
    </div>
  );
};
