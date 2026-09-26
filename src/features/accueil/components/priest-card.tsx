'use client';

import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { useReachablePriests } from '../api/get-reachable-priests';

/** Gabarit de la fiche du prêtre (avatar, nom, office, bouton) : même hauteur que la fiche chargée. */
const PriestSkeleton = () => (
  <div role="status" data-testid="pretre-squelette" className="mt-4 flex items-start gap-4">
    <span className="sr-only">Chargement des prêtres…</span>
    <Skeleton className="size-12 shrink-0 rounded-full" />
    <div aria-hidden="true" className="min-w-0 flex-1">
      <SkeletonLine className="font-serif text-h4" width="w-3/4" />
      <SkeletonLine className="mt-1 text-sm" width="w-full" />
      <SkeletonLine className="mt-1 text-sm" width="w-2/3" />
      <Skeleton className="mt-3 h-9 w-20" />
    </div>
  </div>
);

/** « Parler à un prêtre » (FID-Accueil 04, MOB-Accueil 04) : un prêtre de ma paroisse, et la confession en présentiel. */
export const PriestCard = ({ number, className }: { number: string; className?: string }) => {
  const { data: me } = useMe();
  const { data: priests, isPending, isError } = useReachablePriests();
  const parishId = me?.paroisse_suivie?.id;
  const available = (priests ?? []).filter((p) => p.availability?.accepts_new_conversations !== false);
  const priest = available.find((p) => p.nodes.some((n) => n.id === parishId)) ?? available[0];
  const node = priest?.nodes.find((n) => n.id === parishId) ?? priest?.nodes[0];

  return (
    <section aria-labelledby="acc-pretre" className={className}>
      <SectionHeading
        id="acc-pretre"
        number={number}
        title="Parler à un prêtre"
        aside={<NextLink href={paths.app.pretres.list.getHref()}>Tous les prêtres</NextLink>}
      />
      {isPending ? (
        <PriestSkeleton />
      ) : isError ? (
        <p className="m-0 text-base text-ink-2">La liste des prêtres n’a pas pu être chargée.</p>
      ) : priest ? (
        <div className="mt-4 flex items-start gap-4">
          <Avatar name={priest.full_name} size={48} />
          <div className="min-w-0">
            <p className="m-0 font-serif text-h4 text-ink">{priest.full_name}</p>
            {(priest.office || node) && (
              <p className="m-0 mt-1 text-sm text-ink-2">{[priest.office?.label, node?.name].filter(Boolean).join(', ')}</p>
            )}
            <p className="m-0 mt-1 text-sm text-ink-3">Joignable par message</p>
            <NextLink href={paths.app.pretres.list.getHref()} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'mt-3' })}>
              Écrire
            </NextLink>
          </div>
        </div>
      ) : (
        <p className="m-0 mt-4 text-base text-ink-2">Aucun prêtre de votre paroisse ne reçoit de messages pour le moment.</p>
      )}
      <div className="mt-6 border-t border-line pt-4">
        <p className="tnum m-0 text-meta text-ink-3">Confession · en présentiel</p>
        <p className="m-0 mt-1 text-base text-ink-2">La confession ne se fait pas par message : réservez un créneau auprès d’un prêtre.</p>
        <NextLink href={paths.app.confession.getHref()} className="mt-2 inline-block font-medium">
          Prendre rendez-vous
        </NextLink>
      </div>
    </section>
  );
};
