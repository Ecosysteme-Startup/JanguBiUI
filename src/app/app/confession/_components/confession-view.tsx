'use client';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useSlots } from '@/features/confession/api/get-slots';
import { ConfessionBooking, type UnavailablePriest } from '@/features/confession/components/confession-booking';
import { nextConfessionDay } from '@/features/confession/utils/next-confession';
import { usePriests } from '@/features/pretres/api/get-priests';
import { useMe } from '@/hooks/use-me';
import { isAbsent } from '@/utils/availability-label';
import { dayjs, hour } from '@/utils/dates';
import { parishLabel } from '@/utils/parish-name';

/** « Paroisse Saint-Dominique · le samedi de 16 h à 18 h, par créneaux de 10 minutes. » (données réelles) */
const useSubtitle = (parish: { id: string; name: string } | null) => {
  const slots = useSlots(parish?.id ?? null, dayjs().format('YYYY-MM-DD'));
  if (!parish) return 'La confession se vit en présentiel, à l’église. Aucun motif n’est demandé.';
  const next = slots.data ? nextConfessionDay(slots.data) : null;
  const when = next
    ? ` · le ${dayjs(next.day).format('dddd')} de ${hour(next.from)} à ${hour(next.to)}, par créneaux de ${next.minutes} minutes.`
    : ' · réservez un créneau, aucun motif n’est demandé.';
  return `${parishLabel(parish.name)}${when}`;
};

// Rendez-vous de confession (FID-Confession-RDV, MOB-Confession).
export const ConfessionView = () => {
  const me = useMe();
  const parish = me.data?.paroisse_suivie ?? null;
  const priests = usePriests();
  const subtitle = useSubtitle(parish);
  const unavailable: UnavailablePriest[] = (priests.data ?? [])
    .filter((p) => isAbsent(p.availability))
    .map((p) => ({ id: p.user_id, name: p.full_name, until: p.availability!.absent_until! }));

  return (
    <>
      <TopbarContent
        start={<Breadcrumbs items={[{ label: 'Parler à un prêtre', href: paths.app.pretres.list.getHref() }, { label: 'Rendez-vous de confession' }]} />}
        end={
          <a href="#mes-rendez-vous" className="text-15 font-semibold no-underline hover:underline">
            Mes rendez-vous
          </a>
        }
      />
      <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">Rendez-vous de confession</h1>
      <p className="m-0 mt-2 text-16 text-ink-2">{subtitle}</p>
      <div className="mt-8">
        {me.isPending ? (
          <LoadingBlock label="Chargement…" />
        ) : (
          <ConfessionBooking nodeId={parish?.id ?? null} parishName={parish?.name ?? null} unavailablePriests={unavailable} />
        )}
      </div>
    </>
  );
};

