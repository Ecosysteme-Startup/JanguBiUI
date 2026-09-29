'use client';

import NextLink from 'next/link';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { usePublicParish } from '../../api/get-public-parish';
import type { PublicParish } from '../../types/schemas';
import { AuthorizationNote } from '../shared/authorization-note';

import { DonationForm } from './donation-form';
import { supportTitle } from './fund-labels';

/** Collecte fermée ou sans fonds ouvert : une phrase sobre, jamais d'insistance. */
export const ClosedCollection = ({ data }: { data: PublicParish }) =>
  !data.enabled ? (
    <EmptyState
      icon="don"
      title="La collecte en ligne n’est pas ouverte pour cette paroisse."
      className="mt-8"
    >
      Vous pouvez soutenir votre paroisse lors des quêtes, à l’église.
    </EmptyState>
  ) : (
    <EmptyState
      icon="don"
      title="Aucun fonds n’est ouvert pour le moment."
      className="mt-8"
    >
      Les quêtes et les campagnes de la paroisse apparaîtront ici dès leur
      ouverture.
    </EmptyState>
  );

const Topbar = () => (
  <TopbarContent
    start={
      <Breadcrumbs
        items={[
          { label: 'Dons', href: paths.app.dons.historique.getHref() },
          { label: 'Faire un don' },
        ]}
      />
    }
    end={
      <NextLink
        href={paths.app.dons.historique.getHref()}
        className="inline-flex h-10 items-center rounded-12 px-3 text-15 font-semibold no-underline hover:bg-surface-2"
      >
        Mes dons
      </NextLink>
    }
  />
);

/**
 * Faire un don (WEB-FID-Donner) à la paroisse suivie : fonds, montant, options, puis paiement
 * chez l'agrégateur. `fundId` (paramètre `?fonds=`) présélectionne un fonds.
 */
export const GiveScreen = ({ fundId }: { fundId?: string | null }) => {
  const me = useMe();
  const parishRef = me.data?.paroisse_suivie ?? null;
  const parish = usePublicParish(parishRef?.id);

  if (me.isPending || (parishRef && parish.isPending)) {
    return (
      <>
        <Topbar />
        <LoadingBlock label="Chargement de la collecte…" lines={6} />
      </>
    );
  }
  if (me.isError || parish.isError) {
    return (
      <>
        <Topbar />
        <EmptyState
          tone="err"
          icon="alerte"
          title="La collecte n’a pas pu être chargée."
          action={
            <Button
              variant="secondary"
              onClick={() => (me.isError ? me.refetch() : parish.refetch())}
            >
              Réessayer
            </Button>
          }
        >
          Le service ne répond pas. Réessayez dans un instant.
        </EmptyState>
      </>
    );
  }
  if (!parishRef || !parish.data) {
    return (
      <>
        <Topbar />
        <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">
          Soutenir votre paroisse
        </h1>
        <EmptyState
          icon="paroisse"
          title="Vous ne suivez encore aucune paroisse."
          className="mt-8"
          action={
            <NextLink href={paths.app.profil.getHref()} className="font-medium">
              Choisir ma paroisse
            </NextLink>
          }
        >
          Choisissez la paroisse que vous fréquentez : vous pourrez ensuite la
          soutenir depuis cette page.
        </EmptyState>
      </>
    );
  }

  const data = parish.data;
  return (
    <>
      <Topbar />
      <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">
        {supportTitle(data.parish.name)}
      </h1>
      <p className="m-0 mt-2 text-16 text-ink-2">
        Votre don est affecté au fonds que vous choisissez.
      </p>
      <AuthorizationNote authorization={data.authorization} className="mt-3" />
      {data.enabled && data.funds.length > 0 ? (
        <DonationForm
          variant="fidele"
          data={data}
          initialFundId={fundId}
          redirectHref={paths.app.dons.redirection.getHref}
        />
      ) : (
        <ClosedCollection data={data} />
      )}
    </>
  );
};
