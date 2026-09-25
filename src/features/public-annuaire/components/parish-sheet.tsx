'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

import { PhotoSlot } from '@/components/signature/photo-slot';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';

import type { DirectoryNode } from '../api/get-directory';
import { useParishByCode } from '../api/get-parish-by-code';

import { ParishAnnouncements } from './parish-announcements';
import { ParishEvents } from './parish-events';
import { ParishSchedule } from './parish-schedule';
import { ParishStatus } from './parish-status';

/** « Paroisse Saint-Dominique » → « Paroisse » + nom en italique. */
const Title = ({ name }: { name: string }) => {
  const match = /^(Paroisse|Quasi-paroisse)\s+(.+)$/i.exec(name);
  return match ? (
    <>
      {match[1]} <em className="italic text-primary">{match[2]}</em>
    </>
  ) : (
    <em className="italic text-primary">{name}</em>
  );
};

const mapHref = (parish: DirectoryNode) => {
  const lat = Number(parish.lat);
  const lng = Number(parish.lng);
  if (parish.lat === null || parish.lat === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
};

const ParishHeader = ({ parish }: { parish: DirectoryNode }) => {
  const ancestors = useQuery(nodeAncestorsQueryOptions(parish.id));
  const chain = ancestors.data ?? [];
  // Juridiction : les deux niveaux au-dessus de la paroisse (doyenné, diocèse), sans la province.
  const jurisdiction = chain.slice(-2).reverse();
  const address = [parish.address, parish.city].filter(Boolean);
  const itinerary = mapHref(parish);

  return (
    <>
      <NextLink href={paths.paroisses.list.getHref()} className="hit inline-flex items-center gap-2 text-base text-primary hover:text-primary-strong">
        <Icon name="fleche-gauche" size={16} />
        Retour · Annuaire des paroisses
      </NextLink>
      {chain.length > 0 && (
        <nav aria-label="Fil d’Ariane" className="tnum mt-2 text-meta text-ink-3">
          {chain.map((node) => (
            <span key={node.id}>
              {node.name}
              <span aria-hidden="true"> / </span>
            </span>
          ))}
          <span aria-current="page" className="text-ink">
            {parish.name}
          </span>
        </nav>
      )}

      <section aria-labelledby="fiche-titre" className="mt-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="tnum m-0 flex items-center gap-4 text-meta text-ink-2">
            <span className="text-primary">{parish.type?.label ?? 'Paroisse'}</span>
            {parish.city && (
              <>
                <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
                <span>{parish.city}</span>
              </>
            )}
          </p>
          <h1 id="fiche-titre" className="m-0 mt-4 font-serif text-title font-normal text-ink md:text-h1">
            <Title name={parish.name} />
          </h1>
          <dl className="m-0 mt-8 grid grid-cols-1 gap-6 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <dt className="tnum text-meta text-ink-3">Adresse</dt>
              <dd className="m-0 mt-1 text-base">{address.length ? address.join(', ') : 'Non renseignée'}</dd>
            </div>
            <div>
              <dt className="tnum text-meta text-ink-3">Juridiction</dt>
              <dd className="m-0 mt-1 text-base">
                {jurisdiction.length
                  ? jurisdiction.map((node) => (
                      <span key={node.id} className="block">
                        {node.name}
                      </span>
                    ))
                  : '…'}
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <NextLink href={paths.auth.inscription.getHref()}>Suivre cette paroisse</NextLink>
            </Button>
            {itinerary && (
              <Button asChild size="lg" variant="secondary">
                <a href={itinerary} target="_blank" rel="noopener noreferrer">
                  <Icon name="pin" size={18} />
                  Itinéraire<span className="sr-only"> (ouvre OpenStreetMap dans un nouvel onglet)</span>
                </a>
              </Button>
            )}
            <ParishStatus active={parish.is_active_on_platform} className="ml-2" />
          </div>
          {!parish.is_active_on_platform && (
            <p className="m-0 mt-4 max-w-[60ch] text-sm text-ink-2">
              Cette paroisse n&apos;est pas encore ouverte sur Jàngu Bi : sa fiche d&apos;annuaire peut être incomplète. Pour ses horaires,
              renseignez-vous auprès de son secrétariat.
            </p>
          )}
        </div>
        <PhotoSlot slot="fiche-facade-eglise" caption={`Façade de l’église, ${parish.name}`} ratio="4:3" className="lg:col-span-5" />
      </section>
    </>
  );
};

/**
 * Fiche publique d'une paroisse (PUB-Fiche-Paroisse) : en-tête, horaires de la semaine,
 * annonces récentes et prochains événements. Le code d'URL est résolu via l'annuaire.
 */
export const ParishSheet = ({ code }: { code: string }) => {
  const { data: parish, isPending, isError, refetch } = useParishByCode(code);

  if (isPending) return <LoadingBlock label="Chargement de la fiche…" lines={6} />;
  if (isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="La fiche n’a pas pu être chargée."
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            Réessayer
          </Button>
        }
      >
        Le service ne répond pas. Réessayez dans un instant.
      </EmptyState>
    );
  }
  if (!parish) {
    return (
      <EmptyState
        icon="paroisse"
        title="Paroisse introuvable."
        action={
          <Button asChild variant="secondary">
            <NextLink href={paths.paroisses.list.getHref()}>Chercher dans l’annuaire</NextLink>
          </Button>
        }
      >
        Aucune paroisse ne porte le code « {code} ».
      </EmptyState>
    );
  }

  return (
    <div>
      <ParishHeader parish={parish} />
      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-16 lg:col-span-8">
          <ParishSchedule nodeId={parish.id} />
          <ParishAnnouncements nodeId={parish.id} />
        </div>
        <aside aria-label="Agenda de la paroisse" className="lg:col-span-4">
          <ParishEvents nodeId={parish.id} />
        </aside>
      </div>
    </div>
  );
};
