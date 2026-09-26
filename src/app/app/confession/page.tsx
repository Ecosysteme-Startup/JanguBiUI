'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ConfessionBooking } from '@/features/confession/components/confession-booking';
import { useMe } from '@/hooks/use-me';

// Rendez-vous de confession (FID-Confession-RDV, MOB-Confession).
const ConfessionPage = () => {
  const me = useMe();
  const parish = me.data?.paroisse_suivie ?? null;
  return (
    <>
      <NextLink
        href={paths.app.pretres.list.getHref()}
        className="mb-6 inline-flex h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Parler à un prêtre
      </NextLink>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">04</span> — Parler à un prêtre ·
            Sacrement de réconciliation
          </p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink lg:text-[3.125rem] lg:leading-none">
            Rendez-vous de <em className="italic text-primary">confession</em>
          </h1>
        </div>
        <p className="m-0 max-w-[440px] text-body text-ink-2">
          La confession se vit en présentiel, à l’église. Réservez un créneau :
          rien ne vous est demandé sur son contenu.
        </p>
      </div>
      {me.isPending ? (
        <LoadingBlock label="Chargement…" />
      ) : (
        <ConfessionBooking
          nodeId={parish?.id ?? null}
          parishName={parish?.name ?? null}
        />
      )}
    </>
  );
};

export default ConfessionPage;
