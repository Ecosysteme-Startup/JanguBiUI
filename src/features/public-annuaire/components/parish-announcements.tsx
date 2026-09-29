'use client';

import NextLink from 'next/link';

import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, dotDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type PublicAnnouncement, usePublicAnnouncements } from '../api/get-public-announcements';

/** « Liturgie · Abbé Augustin Ndiaye · publiée le 22.09 ». */
const kicker = (a: PublicAnnouncement) =>
  [a.category?.name, a.author_name, a.published_at ? `publiée le ${dotDate(a.published_at)}` : null].filter(Boolean).join(' · ');

/** Annonce publique en lecture seule (le détail complet est réservé à l'espace fidèle). */
const AnnouncementRow = ({ announcement, last }: { announcement: PublicAnnouncement; last: boolean }) => (
  <article className={cn('px-6 py-5', !last && 'border-b border-line')}>
    <p className="m-0 text-13 text-ink-3">{kicker(announcement)}</p>
    <h3 className="m-0 mt-1 text-17 font-semibold text-ink">{frenchTypo(announcement.title)}</h3>
    {announcement.excerpt && <p className="m-0 mt-0.5 text-15 text-ink-2">{frenchTypo(announcement.excerpt)}</p>}
  </article>
);

/**
 * « Annonces du dimanche » de la fiche (WEB-Fiche-Paroisse) : les dernières annonces publiques
 * de la paroisse ; l'inscription permet de les recevoir chaque dimanche.
 */
export const ParishAnnouncements = ({ nodeId }: { nodeId: string }) => {
  const { data, isPending, isError } = usePublicAnnouncements({ nodeId, limit: 4 });
  const sunday = data?.results.find((a) => a.is_sunday_notice && a.sunday_date)?.sunday_date;
  return (
    <section aria-labelledby="h-annonces">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="h-annonces" className="m-0 text-24 font-semibold text-ink">
          Annonces du dimanche
        </h2>
        <NextLink href={paths.auth.inscription.getHref()} className="hit text-15 font-semibold">
          Recevoir les annonces chaque dimanche
        </NextLink>
      </div>
      {data && data.results.length > 0 && (
        <p className="m-0 mt-1 text-15 text-ink-2">
          {sunday ? `Lues à la fin des messes du dimanche ${dayjs(sunday).format('D MMMM')}.` : 'Les dernières annonces publiées par la paroisse.'}
        </p>
      )}
      {isPending ? (
        <div className="mt-4">
          <LoadingBlock label="Chargement des annonces…" />
        </div>
      ) : isError ? (
        <p role="alert" className="m-0 mt-4 text-16 text-err">
          Les annonces n&apos;ont pas pu être chargées.
        </p>
      ) : data.results.length === 0 ? (
        <p className="m-0 mt-4 text-16 text-ink-2">Aucune annonce publiée pour le moment.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
          {data.results.map((announcement, index) => (
            <AnnouncementRow key={announcement.id} announcement={announcement} last={index === data.results.length - 1} />
          ))}
        </div>
      )}
    </section>
  );
};
