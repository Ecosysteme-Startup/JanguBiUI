'use client';

import NextLink from 'next/link';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import type { Book, Testament } from '@/features/bible/api/get-testaments';
import { cn } from '@/utils/cn';

/** Livres de la Bible, par testament (onglets) ; le livre ouvert est marqué `aria-current`. */
export const BookNav = ({ testaments, current, className }: { testaments: Testament[]; current?: Book; className?: string }) => {
  const sorted = [...testaments].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;
  return (
    <nav aria-label="Livres de la Bible" className={className}>
      <Tabs defaultValue={current?.testament ?? sorted[0].slug}>
        <TabsList aria-label="Testament" className="gap-6">
          {sorted.map((t) => (
            <TabsTrigger key={t.slug} value={t.slug} count={t.books.length}>
              {t.name.replace(/ Testament$/, '')}
            </TabsTrigger>
          ))}
        </TabsList>
        {sorted.map((t) => (
          <TabsContent key={t.slug} value={t.slug} className="mt-2 lg:max-h-[60vh] lg:overflow-y-auto">
            <ul className="m-0 list-none p-0">
              {[...t.books]
                .sort((a, b) => a.order - b.order)
                .map((b) => {
                  const active = current?.id === b.id;
                  return (
                    <li key={b.id}>
                      <NextLink
                        href={paths.app.bible.chapitre.getHref(b.slug, 1)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center justify-between gap-3 border-b border-line px-2 text-base transition-colors hover:bg-surface-2',
                          active ? 'bg-tint-50 font-semibold text-ink' : 'text-ink',
                        )}
                      >
                        <span>{b.name}</span>
                        <span className="tnum text-meta font-normal text-ink-3">{b.chapter_count}</span>
                      </NextLink>
                    </li>
                  );
                })}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </nav>
  );
};
