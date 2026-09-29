'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import { type MassOccurrence, useParishWeek } from '../api/get-parish-week';
import { countdownLabel, massDayLabel, timeHHMM, upcomingMasses } from '../utils/home';

import { HomeSection } from './home-section';

const rowClass = 'grid grid-cols-[64px_1px_minmax(0,1fr)] items-stretch gap-4 rounded-16 border p-4 text-ink';

const MassRow = ({ mass, now, first }: { mass: MassOccurrence; now: Date; first: boolean }) => {
  const countdown = first ? countdownLabel(mass.date, mass.start_time, now) : null;
  const soon = Boolean(countdown);
  return (
    <li>
      <NextLink
        href={paths.app.paroisse.root.getHref('horaires')}
        className={cn(
          rowClass,
          'transition-colors hover:border-line-active hover:text-ink',
          soon ? 'border-line-active bg-tint-50' : 'border-line bg-paper',
        )}
      >
        <span className="flex flex-col">
          <span className="tnum text-16 font-semibold">{timeHHMM(mass.start_time)}</span>
          <span className={cn('text-13', soon ? 'text-ink-2' : 'text-ink-3')}>{massDayLabel(mass.date, mass.start_time, now)}</span>
        </span>
        <span aria-hidden="true" className={soon ? 'bg-primary-fill' : 'bg-line'} />
        <span className="flex min-w-0 flex-col">
          <span className="text-15 font-semibold">{frenchTypo(mass.note || 'Messe')}</span>
          <span className="text-14 text-ink-2">{mass.place_name}</span>
          {countdown && (
            <span className="mt-1 inline-flex items-center gap-1.5 text-13 text-tint-800">
              <Icon name="horloge" size={14} />
              {countdown}
            </span>
          )}
        </span>
      </NextLink>
    </li>
  );
};

/** « Prochaines messes » (FID-Accueil) : les trois prochaines messes de la paroisse suivie. */
export const NextMasses = ({ className }: { className?: string }) => {
  const { data: me } = useMe();
  const nodeId = me?.paroisse_suivie?.id ?? null;
  const week = useParishWeek(nodeId);
  const now = new Date();
  const masses = upcomingMasses(week.data, now, 3);

  return (
    <HomeSection
      id="acc-messes"
      title="Prochaines messes"
      className={className}
      action={nodeId ? <NextLink href={paths.app.paroisse.root.getHref('horaires')}>Horaires</NextLink> : undefined}
    >
      {me && !nodeId ? (
        <p className="m-0 text-15 text-ink-2">
          Suivez une paroisse pour voir ses horaires.{' '}
          <NextLink href={paths.app.profil.getHref()} className="font-medium">
            Choisir ma paroisse
          </NextLink>
        </p>
      ) : !me || week.isPending ? (
        <div role="status" data-testid="messes-squelette" className="flex flex-col gap-2">
          <span className="sr-only">Chargement des horaires…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden="true" className={cn(rowClass, 'border-line')}>
              <span>
                <SkeletonLine className="text-16" width="w-12" />
                <SkeletonLine className="text-13" width="w-10" />
              </span>
              <span className="bg-line" />
              <span>
                <SkeletonLine className="text-15" width="w-3/4" />
                <SkeletonLine className="text-14" width="w-1/2" />
              </span>
            </div>
          ))}
        </div>
      ) : week.isError ? (
        <p className="m-0 text-15 text-ink-2">Les horaires n’ont pas pu être chargés.</p>
      ) : masses.length === 0 ? (
        <p className="m-0 text-15 text-ink-2">Aucune messe annoncée pour les sept prochains jours.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {masses.map((mass, i) => (
            <MassRow key={`${mass.date}-${mass.start_time}-${mass.place_id}`} mass={mass} now={now} first={i === 0} />
          ))}
        </ul>
      )}
    </HomeSection>
  );
};
