'use client';

import NextLink from 'next/link';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { type NodeByCode, useNodeByCode } from '../../api/get-node-by-code';
import { usePublicParish } from '../../api/get-public-parish';
import type { DonationSource } from '../../types/schemas';
import { AuthorizationNote } from '../shared/authorization-note';

import { DonationForm } from './donation-form';
import { shortParishName, supportTitle } from './fund-labels';
import { ClosedCollection } from './give-screen';

/** « Point E, Dakar · archidiocèse de Dakar » : quartier (fin de l'adresse), ville, juridiction. */
const placeLine = (node: NodeByCode) => {
  const district = node.address?.split(',').at(-1)?.trim();
  const place = [district, node.city].filter(Boolean).join(', ');
  const jurisdiction = node.diocese_name ?? node.parent_name;
  const juris = jurisdiction
    ? jurisdiction.charAt(0).toLowerCase() + jurisdiction.slice(1)
    : null;
  return [place, juris].filter(Boolean).join(' · ');
};

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="jb-container pb-18 pt-8">
    <div className="mx-auto w-full max-w-[640px]">{children}</div>
  </div>
);

/**
 * Don sans compte (WEB-Don-Paroisse) : la page qu'ouvre l'application mobile dans le navigateur.
 * Même formulaire que l'espace fidèle, sur une colonne, avec un e-mail facultatif pour le reçu.
 */
export const PublicGiveScreen = ({
  code,
  fundId,
  source,
  placeId,
}: {
  code: string;
  fundId?: string | null;
  source?: DonationSource;
  placeId?: number | null;
}) => {
  const node = useNodeByCode(code);
  const parish = usePublicParish(node.data?.id);

  if (node.isPending || (node.data && parish.isPending)) {
    return (
      <Frame>
        <LoadingBlock label="Chargement de la collecte…" lines={6} />
      </Frame>
    );
  }
  if (node.isError || parish.isError) {
    return (
      <Frame>
        <EmptyState
          tone="err"
          icon="alerte"
          title="La collecte n’a pas pu être chargée."
          action={
            <Button
              variant="secondary"
              onClick={() => (node.isError ? node.refetch() : parish.refetch())}
            >
              Réessayer
            </Button>
          }
        >
          Le service ne répond pas. Réessayez dans un instant.
        </EmptyState>
      </Frame>
    );
  }
  if (!node.data || !parish.data) {
    return (
      <Frame>
        <EmptyState
          icon="paroisse"
          title="Paroisse introuvable."
          action={
            <NextLink href={paths.paroisses.list.getHref()}>
              Trouver une paroisse
            </NextLink>
          }
        >
          Le lien suivi ne correspond à aucune paroisse de l’annuaire.
        </EmptyState>
      </Frame>
    );
  }

  const data = parish.data;
  const name = shortParishName(node.data.name);
  return (
    <Frame>
      <Breadcrumbs
        items={[
          { label: 'Paroisses', href: paths.paroisses.list.getHref() },
          { label: name, href: paths.paroisses.detail.getHref(code) },
          { label: 'Faire un don' },
        ]}
      />
      <div className="mt-6 flex items-center gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-14 bg-tint-50 text-primary-strong">
          <Icon name="paroisse" size={28} />
        </span>
        <div className="min-w-0">
          <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">
            {supportTitle(node.data.name)}
          </h1>
          <p className="m-0 mt-0.5 text-16 text-ink-2">
            {placeLine(node.data)}
          </p>
        </div>
      </div>
      <p className="m-0 mt-4 text-16 text-ink">
        Votre don est affecté au fonds que vous choisissez. Aucun compte n’est
        nécessaire.
      </p>
      <AuthorizationNote
        authorization={data.authorization}
        className="mt-2 text-13"
      />
      {data.enabled && data.funds.length > 0 ? (
        <>
          <DonationForm
            variant="public"
            data={data}
            parishCode={code}
            initialFundId={fundId}
            source={source}
            placeId={placeId}
            redirectHref={paths.dons.redirection.getHref}
          />
          <p className="m-0 mt-5 text-center text-15 text-ink-2">
            Vous avez un compte Jàngu Bi&nbsp;?{' '}
            <a
              href={paths.auth.connexion.getHref(
                paths.app.dons.root.getHref(fundId ?? undefined),
              )}
              className="font-semibold"
            >
              Se connecter pour retrouver ce don dans Mes dons
            </a>
          </p>
        </>
      ) : (
        <ClosedCollection data={data} />
      )}
    </Frame>
  );
};
