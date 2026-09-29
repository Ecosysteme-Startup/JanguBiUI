'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMesParoisses } from '@/lib/paroisses/api';

import { useFeedSecondaires } from '../api/get-feed-secondaires';

import { AnnouncementList } from './announcement-row';

const TOUTES = 'toutes';

/**
 * « Autres paroisses » (paroisses multiples) : annonces des paroisses secondaires, sans
 * notification ; celles de la paroisse principale restent au-dessus. Rien sans paroisse secondaire.
 */
export const OtherParishesAnnouncements = () => {
  const mes = useMesParoisses();
  const secondaires = (mes.data ?? []).filter((m) => !m.principale);
  const [paroisse, setParoisse] = useState<string>(TOUTES);
  const feed = useFeedSecondaires(paroisse === TOUTES ? null : paroisse, {
    enabled: secondaires.length > 0,
  });
  if (secondaires.length === 0) return null;

  return (
    <section
      aria-labelledby="autres-paroisses-titre"
      className="flex flex-col gap-4"
    >
      <h2
        id="autres-paroisses-titre"
        className="m-0 text-22 font-semibold text-ink"
      >
        Autres paroisses
      </h2>
      {secondaires.length > 1 && (
        <SegmentedControl
          size="sm"
          label="Filtrer par paroisse"
          value={paroisse}
          onChange={setParoisse}
          options={[
            [TOUTES, 'Toutes'] as const,
            ...secondaires.map(
              (m) => [m.paroisse.id, m.paroisse.name] as const,
            ),
          ]}
        />
      )}
      <p className="m-0 flex items-start gap-2 text-14 text-ink-2">
        <Icon name="cloche" size={16} className="mt-0.5 shrink-0 text-ink-3" />
        <span>
          Les annonces de vos autres paroisses arrivent ici, sans notification.{' '}
          <NextLink href={`${paths.app.profil.getHref()}#paroisse`}>
            Mes paroisses
          </NextLink>
        </span>
      </p>
      {feed.isPending ? (
        <LoadingBlock label="Chargement des annonces…" />
      ) : feed.isError ? (
        <EmptyState
          tone="err"
          title="Les annonces de vos autres paroisses n’ont pas pu être chargées."
        />
      ) : feed.data.results.length === 0 ? (
        <p className="m-0 text-15 text-ink-2">
          Aucune annonce récente dans vos autres paroisses.
        </p>
      ) : (
        <AnnouncementList items={feed.data.results} />
      )}
    </section>
  );
};
