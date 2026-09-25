'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { dotDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type PublicAnnouncement, usePublicAnnouncements } from '../api/get-public-announcements';

const kicker = (a: PublicAnnouncement) =>
  a.is_sunday_notice && a.sunday_date ? `Dim. ${dotDate(a.sunday_date)}` : a.published_at ? dotDate(a.published_at) : '';

/** Annonce publique en lecture seule (le détail complet est réservé à l'espace fidèle). */
export const PublicAnnouncementItem = ({ announcement, number }: { announcement: PublicAnnouncement; number: number }) => (
  <article className="border-t border-line pt-3">
    <p className="tnum m-0 flex justify-between gap-4 text-meta text-ink-3">
      <span>
        <span className="text-primary">{String(number).padStart(2, '0')}</span> — {kicker(announcement)}
      </span>
      {announcement.category && <span>{announcement.category.name}</span>}
    </p>
    <h3 className="m-0 mt-2 font-serif text-h3 font-normal text-ink">{frenchTypo(announcement.title)}</h3>
    {announcement.excerpt && <p className="m-0 mt-2 text-body text-ink-2">{frenchTypo(announcement.excerpt)}</p>}
    <p className="m-0 mt-2 text-sm text-ink-3">
      {announcement.author_name}
      {announcement.published_at && ` · publiée le ${dotDate(announcement.published_at)}`}
    </p>
  </article>
);

/** « 02 — Annonces récentes » d'une paroisse. */
export const ParishAnnouncements = ({ nodeId }: { nodeId: string }) => {
  const { data, isPending, isError } = usePublicAnnouncements({ nodeId, limit: 3 });
  return (
    <section aria-labelledby="h-annonces">
      <SectionHeading id="h-annonces" number="02" title="Annonces récentes" aside={data && data.count > 0 ? `${data.count} publiée${data.count > 1 ? 's' : ''}` : undefined} />
      {isPending ? (
        <LoadingBlock label="Chargement des annonces…" />
      ) : isError ? (
        <p role="alert" className="m-0 mt-4 text-base text-err">
          Les annonces n&apos;ont pas pu être chargées.
        </p>
      ) : data.results.length === 0 ? (
        <p className="m-0 mt-4 text-base text-ink-2">Aucune annonce publiée pour le moment.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-8">
          {data.results.map((announcement, index) => (
            <PublicAnnouncementItem key={announcement.id} announcement={announcement} number={index + 1} />
          ))}
        </div>
      )}
      <NextLink
        href={paths.auth.inscription.getHref()}
        className="hit mt-6 inline-flex items-center gap-2 text-base font-medium text-primary underline decoration-1 underline-offset-[5px]"
      >
        Recevoir les annonces chaque dimanche
        <Icon name="fleche-droite" size={16} />
      </NextLink>
    </section>
  );
};
