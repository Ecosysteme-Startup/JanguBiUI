'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { type ReactNode, useState } from 'react';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { cn } from '@/utils/cn';

import { useNodeWeek } from '../api/get-node-week';
import {
  type ParishSheetData,
  useParishByCode,
} from '../api/get-parish-by-code';

import { ChurchDrawing } from './church-drawing';
import { ParishAnnouncements } from './parish-announcements';
import { ParishClergy } from './parish-clergy';
import { ParishEvents } from './parish-events';
import { ParishNextMass } from './parish-next-mass';
import { ParishPlaces } from './parish-places';
import { ParishProcedures } from './parish-procedures';
import { ParishSchedule } from './parish-schedule';
import { ParishSecretariat } from './parish-secretariat';

const shortName = (name: string) => name.replace(/^Paroisse\s+/i, '');

/** « Point E, Dakar. Doyenné Plateau-Médina, archidiocèse de Dakar. » */
const description = (parish: ParishSheetData) => {
  const place = [parish.address, parish.city].filter(Boolean).join(', ');
  const jurisdiction = [
    parish.deanery_name,
    parish.diocese_name ?? parish.parent_name,
  ]
    .filter((name): name is string => Boolean(name))
    .map((name, index) =>
      index === 0 ? name : name.charAt(0).toLowerCase() + name.slice(1),
    )
    .join(', ');
  return [place, jurisdiction]
    .filter(Boolean)
    .map((part) => `${part}.`)
    .join(' ');
};

/** Partage de la fiche : partage natif du téléphone, sinon copie du lien. */
const ShareButton = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Partage annulé : rien à signaler.
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label="Partager la fiche"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'w-12 px-0',
        )}
      >
        <Icon name="partager" size={20} />
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Lien de la fiche copié.' : ''}
      </span>
    </>
  );
};

/** Trois dessins (façade, chapelle, nef) en attendant les photos de la paroisse. */
const ParishDrawings = ({ parish }: { parish: ParishSheetData }) => {
  const { data } = useNodeWeek(parish.id);
  const places = (data?.places ?? []).map((p) => p.name);
  const slug = parish.code.toLowerCase();
  return (
    <figure className="m-0 mt-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ChurchDrawing
          variant="facade"
          slot={`paroisse-${slug}-facade`}
          className="h-60 rounded-16 sm:h-[360px]"
        />
        <div className="hidden grid-rows-2 gap-3 sm:grid">
          <ChurchDrawing
            variant="chapelle"
            slot={`paroisse-${slug}-chapelle`}
            className="h-[174px] rounded-16"
          />
          <ChurchDrawing
            variant="nef"
            slot={`paroisse-${slug}-nef`}
            className="h-[174px] rounded-16"
          />
        </div>
      </div>
      <figcaption className="mt-2 text-13 text-ink-3">
        {places.length > 0 ? `${places.join(', ')}.` : shortName(parish.name)}{' '}
        Illustrations en attendant les photos de la paroisse.
      </figcaption>
    </figure>
  );
};

const ParishHeader = ({ parish }: { parish: ParishSheetData }) => {
  const ancestors = useQuery(nodeAncestorsQueryOptions(parish.id));
  const chain = (ancestors.data ?? []).filter(
    (node) => !node.type || node.type.code === 'diocese' || node.type.code === 'doyenne',
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Paroisses', href: paths.paroisses.list.getHref() },
          ...chain.map((node) => ({ label: node.name })),
          { label: shortName(parish.name) },
        ]}
      />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1
            id="fiche-titre"
            className="m-0 text-32 font-semibold text-ink md:text-40"
          >
            {parish.name}
          </h1>
          <p className="m-0 mt-2 text-18 text-ink-2">{description(parish)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ShareButton title={parish.name} />
          <NextLink
            href={paths.auth.inscription.getHref()}
            className={buttonVariants({ size: 'lg' })}
          >
            <Icon name="plus" size={20} />
            Suivre cette paroisse
          </NextLink>
        </div>
      </div>
      {!parish.is_active_on_platform && (
        <Notice
          className="mt-6"
          title="Cette paroisse n’est pas encore ouverte sur Jàngu Bi."
        >
          Sa fiche d&apos;annuaire peut être incomplète. Pour ses horaires,
          renseignez-vous auprès de son secrétariat.
        </Notice>
      )}
      <ParishDrawings parish={parish} />
    </>
  );
};

/**
 * Fiche publique d'une paroisse (PUB-Fiche-Paroisse) : en-tête, horaires de la semaine,
 * annonces récentes, secrétariat (s'il est publié), clergé et prochains événements. Le code d'URL est résolu via l'annuaire.
 */
export const ParishSheet = ({
  code,
  support,
}: {
  code: string;
  /** Bloc placé après les démarches par la page (ex. « Soutenir la paroisse », feature dons). */
  support?: ReactNode;
}) => {
  const { data: parish, isPending, isError, refetch } = useParishByCode(code);

  if (isPending) {
    return (
      <div className="jb-container pb-24 pt-8">
        <LoadingBlock label="Chargement de la fiche…" lines={6} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="jb-container pb-24 pt-8">
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
      </div>
    );
  }
  if (!parish) {
    return (
      <div className="jb-container pb-24 pt-8">
        <EmptyState
          icon="paroisse"
          title="Paroisse introuvable."
          action={
            <Button asChild variant="secondary">
              <NextLink href={paths.paroisses.list.getHref()}>
                Chercher dans l’annuaire
              </NextLink>
            </Button>
          }
        >
          Aucune paroisse ne porte le code « {code} ».
        </EmptyState>
      </div>
    );
  }

  const address = [parish.address, parish.city].filter(Boolean).join(', ');
  return (
    <div className="jb-container pb-24 pt-8">
      <ParishHeader parish={parish} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-24">
        <div className="flex min-w-0 flex-col gap-14">
          <ParishSchedule nodeId={parish.id} />
          <ParishAnnouncements nodeId={parish.id} />
          <ParishPlaces nodeId={parish.id} />
        </div>
        <aside
          aria-label="Prochaine messe, contact, clergé et démarches"
          className="flex flex-col gap-6"
        >
          <ParishNextMass nodeId={parish.id} />
          <ParishSecretariat
            secretariat={parish.secretariat}
            address={address}
          />
          <ParishClergy clergy={parish.clergy} />
          {parish.is_active_on_platform && (
            <ParishProcedures
              nodeId={parish.id}
              delayDays={parish.acts.delay_days}
            />
          )}
          {support}
          <ParishEvents nodeId={parish.id} />
        </aside>
      </div>
    </div>
  );
};
