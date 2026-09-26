'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';


import { SectionHeading } from '@/components/ui/section-heading';
import { SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useAnnouncements } from '../api/get-announcements';
import { useEvents } from '../api/get-events';
import { useParishWeek } from '../api/get-parish-week';
import { whenLabel } from '../utils/day-label';
import { nextOccurrence } from '../utils/schedule';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <li className="border-b border-line py-4">
    <span className="tnum block text-meta text-ink-3">{label}</span>
    {children}
  </li>
);

/** Trois lignes au gabarit exact des lignes chargées (annonce, messe, événement). */
const DigestSkeleton = () => (
  <div role="status" data-testid="paroisse-squelette">
    <span className="sr-only">Chargement de la semaine paroissiale…</span>
    <ul aria-hidden="true" className="m-0 list-none p-0">
      {[0, 1, 2].map((i) => (
        <li key={i} className="border-b border-line py-4">
          <SkeletonLine className="text-meta" width="w-32" />
          <SkeletonLine className="mt-1 font-serif text-h4" width="w-3/4" />
          <SkeletonLine className="mt-1 text-sm" width="w-1/2" />
        </li>
      ))}
    </ul>
  </div>
);

const titleLink = 'mt-1 block font-serif text-h4 text-ink hover:text-primary';

/** « Ma paroisse cette semaine » (FID-Accueil 03, MOB-Accueil 02) : annonce, messe, événement. */
export const ParishWeekDigest = ({ number, className }: { number: string; className?: string }) => {
  const { data: me } = useMe();
  const paroisse = me?.paroisse_suivie ?? null;
  const nodeId = paroisse?.id ?? null;
  const announcements = useAnnouncements(nodeId);
  const week = useParishWeek(nodeId);
  const events = useEvents(nodeId);

  if (me && !paroisse) {
    return (
      <section aria-labelledby="acc-paroisse" className={className}>
        <SectionHeading id="acc-paroisse" number={number} title="Ma paroisse cette semaine" />
        <p className="m-0 text-base text-ink-2">Vous ne suivez encore aucune paroisse.</p>
        <NextLink href={paths.app.profil.getHref()} className="mt-2 inline-block font-medium">
          Choisir ma paroisse
        </NextLink>
      </section>
    );
  }

  const now = new Date();
  const sunday = announcements.data?.results.find((a) => a.is_sunday_notice) ?? announcements.data?.results[0];
  const mass = nextOccurrence(week.data, 'messe', now);
  const event = events.data?.results.find((e) => !e.is_cancelled);
  // On attend les TROIS sources : afficher les lignes au fil des réponses décalait la page.
  const loading = !me || announcements.isPending || week.isPending || events.isPending;
  const empty = !sunday && !mass && !event;

  return (
    <section aria-labelledby="acc-paroisse" className={cn(className)}>
      <SectionHeading
        id="acc-paroisse"
        number={number}
        title={paroisse ? `${paroisse.name} cette semaine` : 'Ma paroisse cette semaine'}
        aside={<NextLink href={paths.app.paroisse.root.getHref()}>Ma paroisse</NextLink>}
      />
      {loading ? (
        <DigestSkeleton />
      ) : empty ? (
        <p className="m-0 text-base text-ink-2">Rien de publié pour cette semaine.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {sunday && (
            <Row label={sunday.is_sunday_notice ? 'Annonce du dimanche' : 'Dernière annonce'}>
              <NextLink href={paths.app.paroisse.annonce.getHref(sunday.id)} className={titleLink}>
                {frenchTypo(sunday.title)}
              </NextLink>
              {sunday.excerpt && <span className="mt-1 block text-sm text-ink-2">{frenchTypo(sunday.excerpt)}</span>}
            </Row>
          )}
          {mass && (
            <Row label="Prochaine messe">
              <NextLink href={paths.app.paroisse.root.getHref('horaires')} className={cn(titleLink, 'first-letter:uppercase')}>
                {whenLabel(mass.date, mass.start_time, now)}
              </NextLink>
              <span className="mt-1 block text-sm text-ink-2">{mass.place_name}</span>
            </Row>
          )}
          {event && (
            <Row label="Prochain événement">
              <NextLink href={paths.app.paroisse.evenement.getHref(event.id)} className={titleLink}>
                {frenchTypo(event.title)}
              </NextLink>
              <span className="mt-1 block text-sm text-ink-2 first-letter:uppercase">
                {[
                  dayjs(event.start_at).format('dddd D MMMM'),
                  event.location,
                  event.max_participants !== null
                    ? `${Math.max(0, event.max_participants - event.registrations_count)} places restantes`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </Row>
          )}
        </ul>
      )}
    </section>
  );
};
