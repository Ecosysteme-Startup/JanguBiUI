'use client';

import NextLink from 'next/link';

import { PhotoSlot } from '@/components/signature/photo-slot';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { AgendaSection } from './agenda-section';
import { AnnouncementsSection } from './announcements-section';
import { ClergySection } from './clergy-section';
import { ParishHeader } from './parish-header';
import { ScheduleSection } from './schedule-section';

/** Ma paroisse (FID-Ma-Paroisse, MOB-Ma-Paroisse) : la paroisse suivie, ancrée #annonces #horaires #agenda. */
export const ParishOverview = () => {
  const { data: me, isPending, isError } = useMe();

  if (isPending) return <LoadingBlock label="Chargement de votre paroisse…" lines={4} />;
  if (isError) {
    return (
      <EmptyState tone="err" title="Votre paroisse n’a pas pu être chargée.">
        Vérifiez votre connexion puis rechargez la page.
      </EmptyState>
    );
  }
  const paroisse = me.paroisse_suivie;
  if (!paroisse) {
    return (
      <EmptyState
        icon="paroisse"
        title="Vous ne suivez encore aucune paroisse."
        action={
          <NextLink href={paths.app.profil.getHref()} className="font-medium">
            Choisir ma paroisse
          </NextLink>
        }
      >
        Choisissez la paroisse que vous fréquentez pour recevoir ses annonces, ses horaires et son agenda.
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <NextLink href={paths.app.root.getHref()} className="hidden items-center gap-2 text-sm text-ink-2 hover:text-primary lg:inline-flex">
        <Icon name="fleche-gauche" size={16} />
        Retour · Accueil
      </NextLink>
      <div className="mt-2 grid gap-8 lg:mt-6 lg:grid-cols-12 lg:gap-6">
        <ParishHeader nodeId={paroisse.id} name={paroisse.name} className="lg:col-span-7" />
        <PhotoSlot
          slot="fid-paroisse-facade"
          caption={`Parvis de l’église ${paroisse.name}`}
          ratio="3:2"
          className="hidden lg:col-span-5 lg:block"
        />
      </div>
      <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-6">
        <AnnouncementsSection nodeId={paroisse.id} className="lg:col-span-7" />
        <ScheduleSection nodeId={paroisse.id} className="lg:col-span-5" />
      </div>
      <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-6">
        <AgendaSection nodeId={paroisse.id} className="lg:col-span-7" />
        <ClergySection nodeId={paroisse.id} className="lg:col-span-5" />
      </div>
    </div>
  );
};
