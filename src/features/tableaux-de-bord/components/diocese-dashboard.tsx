'use client';

import NextLink from 'next/link';
import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useCan } from '@/lib/can';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { type Deployment, useDeployment } from '../api/get-deployment';
import {
  type NodeDashboard,
  useNodeDashboard,
} from '../api/get-node-dashboard';
import {
  usePendingVerifications,
  useProposedAssignments,
} from '../api/get-watch-counts';
import { dec, hours, n, stamp } from '../utils/format';

/** Paroisses ouvertes listées sur le tableau de bord ; au-delà, lien vers la structure. */
const MAX_OPEN_PARISHES = 8;

const ACTE_STATUSES: { key: string; label: string }[] = [
  { key: 'submitted', label: 'Soumises, non ouvertes' },
  { key: 'under_verification', label: 'En vérification' },
  { key: 'info_requested', label: 'Complément demandé' },
  { key: 'ready_for_pickup', label: 'Prêtes à retirer' },
  { key: 'collected', label: 'Retirées' },
  { key: 'rejected', label: 'Rejetées' },
];

/** « l'archidiocèse », « le diocèse », « le doyenné », « la province ». */
export const scopeOf = (node: { name: string; type: string }) => {
  if (/^archidioc/i.test(node.name)) return 'l’archidiocèse';
  return (
    { diocese: 'le diocèse', doyenne: 'le doyenné', province: 'la province' }[
      node.type
    ] ?? node.name
  );
};

/** « Du 28 août au 26 sept. » pour la période glissante du tableau de bord. */
export const periodLabel = (generatedAt: string, periodDays: number) => {
  const end = dayjs(generatedAt);
  const start = end.subtract(periodDays - 1, 'day');
  const short = (d: dayjs.Dayjs) => (d.date() === 1 ? '1er' : String(d.date()));
  const month = (d: dayjs.Dayjs) => d.format('MMM');
  return start.month() === end.month()
    ? `Du ${short(start)} au ${short(end)}\u00a0${month(end)}`
    : `Du ${short(start)}\u00a0${month(start)} au ${short(end)}\u00a0${month(end)}`;
};

const Panel = ({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <Card
    as="section"
    padding="none"
    aria-labelledby={id}
    className={cn('min-w-0 px-6 py-5', className)}
  >
    {children}
  </Card>
);

const PanelTitle = ({
  id,
  size = 'md',
  children,
  aside,
}: {
  id: string;
  size?: 'md' | 'sm';
  children: React.ReactNode;
  aside?: React.ReactNode;
}) => (
  <div className="flex items-baseline justify-between gap-4">
    <h2
      id={id}
      className={cn(
        'm-0 font-semibold text-ink',
        size === 'md' ? 'text-20' : 'text-18 leading-[26px]',
      )}
    >
      {children}
    </h2>
    {aside}
  </div>
);

/** Rangée « libellé … valeur » des encarts latéraux (filet haut, chiffres tabulaires). */
const FigureRow = ({
  label,
  value,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: 'warn';
}) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-line py-2.5">
    <dt className="text-14 text-ink-2">{label}</dt>
    <dd
      className={cn(
        'tnum m-0 text-15 font-semibold',
        tone === 'warn' ? 'text-warn' : 'text-ink',
      )}
    >
      {value}
    </dd>
  </div>
);

const Unavailable = () => (
  <p className="m-0 mt-4 text-14 text-ink-2">
    Données de structure indisponibles pour le moment.
  </p>
);

const DeploymentCard = ({
  deployment,
  failed,
  nodeId,
  scope,
}: {
  deployment: Deployment | undefined;
  failed: boolean;
  nodeId: string;
  scope: string;
}) => {
  const open = deployment?.parishes.filter((p) => p.active) ?? [];
  const pending = deployment ? deployment.total - deployment.active : 0;
  const share = deployment?.total
    ? (deployment.active / deployment.total) * 100
    : 0;
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="d-deploiement"
      className="min-w-0 overflow-hidden"
    >
      <div className="px-6 py-5">
        <PanelTitle
          id="d-deploiement"
          aside={
            deployment && deployment.total > 0 ? (
              <NextLink
                href={paths.espace.structure.getHref(nodeId)}
                className="whitespace-nowrap text-14 font-semibold"
              >
                Voir les {plural(deployment.total, 'paroisse', 'paroisses')}
              </NextLink>
            ) : undefined
          }
        >
          Déploiement dans {scope}
        </PanelTitle>
        {deployment ? (
          <>
            <p className="m-0 mt-1 text-15 text-ink-2">
              {deployment.active > 1
                ? `${n(deployment.active)} paroisses`
                : `${n(deployment.active)} paroisse`}{' '}
              sur {n(deployment.total)}{' '}
              {deployment.active > 1 ? 'sont ouvertes' : 'est ouverte'} aux
              fidèles
              {deployment.founding > 0
                ? `, dont ${plural(deployment.founding, 'paroisse', 'paroisses')} en fondation dans la structure`
                : ''}
              .
            </p>
            <div
              role="img"
              aria-label={`Sur ${plural(deployment.total, 'paroisse', 'paroisses')} : ${n(deployment.active)} ouverte${deployment.active > 1 ? 's' : ''}, ${n(pending)} pas encore ouverte${pending > 1 ? 's' : ''}`}
              className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface-2"
            >
              <span className="origin-left animate-jb-grow bg-ok-dot" style={{ width: `${share}%` }} />
            </div>
            <div
              aria-hidden="true"
              className="tnum mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-13 text-ink-2"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-3 bg-ok-dot" />
                {n(deployment.active)} ouverte{deployment.active > 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-3 border border-line bg-surface-2" />
                {n(pending)} pas encore ouverte{pending > 1 ? 's' : ''}
              </span>
            </div>
          </>
        ) : failed ? (
          <Unavailable />
        ) : (
          <LoadingBlock label="Chargement du déploiement…" />
        )}
      </div>
      {deployment && (
        <>
          <div
            aria-hidden="true"
            className="grid grid-cols-[minmax(0,1fr)_136px] gap-4 border-t border-line bg-surface px-6 py-2 text-13 text-ink-3"
          >
            <span>Paroisse</span>
            <span>Statut</span>
          </div>
          {open.length === 0 ? (
            <p className="m-0 border-t border-line px-6 py-3 text-14 text-ink-2">
              Aucune paroisse n’est encore ouverte aux fidèles.
            </p>
          ) : (
            <ul
              aria-label="Paroisses ouvertes aux fidèles"
              className="m-0 list-none p-0"
            >
              {open.slice(0, MAX_OPEN_PARISHES).map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_136px] items-center gap-4 border-t border-line px-6 py-3 hover:bg-surface"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-15 font-semibold text-ink">
                      {p.name}
                    </span>
                    {p.doyenne && (
                      <span className="text-13 text-ink-3">{p.doyenne}</span>
                    )}
                  </span>
                  <span>
                    <Badge tone="ok" dot>
                      Active
                    </Badge>
                  </span>
                </li>
              ))}
              {open.length > MAX_OPEN_PARISHES && (
                <li className="border-t border-line px-6 py-3 text-13 text-ink-3">
                  Et{' '}
                  {plural(
                    open.length - MAX_OPEN_PARISHES,
                    'autre paroisse ouverte',
                    'autres paroisses ouvertes',
                  )}
                  .
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </Card>
  );
};

const ActesCard = ({
  data,
  openParishes,
}: {
  data: NodeDashboard;
  openParishes: number | undefined;
}) => {
  return (
    <Panel id="d-actes" className="pb-6">
      <PanelTitle
        id="d-actes"
        aside={
          <span className="tnum whitespace-nowrap text-13 text-ink-3">
            {periodLabel(data.generated_at, data.period_days)}
          </span>
        }
      >
        Demandes d’actes sur {data.period_days} jours
      </PanelTitle>
      <p className="m-0 mt-1 text-15 text-ink-2">
        Comptées par paroisse du sacrement. Le traitement reste à la paroisse ;
        aucun nom de demandeur n’apparaît ici.
      </p>

      <div className="mt-4 overflow-hidden rounded-12 border border-line">
        <ScrollRegion label="Demandes d’actes, défilement horizontal">
          <table className="tnum w-full min-w-[440px] border-collapse text-left">
            <caption className="sr-only">
              Demandes d’actes, toutes paroisses confondues
            </caption>
            <thead className="bg-surface text-13 text-ink-3">
              <tr>
                <th scope="col" className="py-2 pl-4 font-normal">
                  Périmètre
                </th>
                <th
                  scope="col"
                  className="w-18 py-2 pl-3 text-right font-normal"
                >
                  Reçues
                </th>
                <th
                  scope="col"
                  className="w-24 py-2 pl-3 text-right font-normal"
                >
                  Délai médian
                </th>
                <th
                  scope="col"
                  className="w-20 py-2 pl-3 text-right font-normal"
                >
                  En retard
                </th>
                <th
                  scope="col"
                  className="w-24 py-2 pl-3 pr-4 text-right font-normal"
                >
                  À retirer
                </th>
              </tr>
            </thead>
            <tbody className="text-15 text-ink">
              <tr className="border-t border-line">
                <th scope="row" className="py-3 pl-4 text-left font-semibold">
                  Toutes les paroisses
                </th>
                <td className="py-3 pl-3 text-right">
                  {n(data.actes.received)}
                </td>
                <td className="py-3 pl-3 text-right">
                  {data.actes.median_days_to_collect === null
                    ? '—'
                    : `${dec(data.actes.median_days_to_collect)}\u00a0j`}
                </td>
                <td
                  className={cn(
                    'py-3 pl-3 text-right',
                    data.actes.overdue > 0 && 'font-semibold text-warn',
                  )}
                >
                  {n(data.actes.overdue)}
                </td>
                <td className="py-3 pl-3 pr-4 text-right">
                  {n(data.actes.counts.ready_for_pickup ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollRegion>
        <p className="m-0 flex items-center gap-2 border-t border-line px-4 py-2.5 text-13 text-ink-3">
          <Icon name="info" size={16} className="shrink-0" />
          {openParishes === undefined
            ? 'Seules les paroisses ouvertes reçoivent des demandes.'
            : `Sur ${plural(openParishes, 'paroisse ouverte', 'paroisses ouvertes')} ; les autres apparaîtront ici à leur ouverture.`}{' '}
          Retard : plus de 7 jours.
        </p>
      </div>

      <h3 className="m-0 mb-1 mt-6 text-14 font-semibold text-ink">
        Par statut
      </h3>
      <dl className="m-0 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {ACTE_STATUSES.map((s) => (
          <div
            key={s.key}
            className="flex items-baseline justify-between gap-3 border-t border-line py-2.5 text-14"
          >
            <dt className="text-ink-2">{s.label}</dt>
            <dd className="tnum m-0 text-15 font-semibold text-ink">
              {n(data.actes.counts[s.key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};

const NominationsCard = ({ nodeId }: { nodeId: string }) => {
  const proposed = useProposedAssignments(nodeId, true);
  return (
    <Panel id="d-nom">
      <PanelTitle
        id="d-nom"
        size="sm"
        aside={
          <NextLink
            href={paths.espace.nominations.getHref(nodeId)}
            className="text-14 font-semibold"
          >
            Tout voir
          </NextLink>
        }
      >
        Prochaines nominations
      </PanelTitle>
      <p className="m-0 mt-0.5 text-14 text-ink-2">
        Proposées, en attente de leur prise d’effet
      </p>
      <dl className="m-0 mt-3">
        <FigureRow
          label="Nominations proposées"
          value={proposed.data === undefined ? '—' : n(proposed.data)}
        />
      </dl>
      <p className="m-0 mt-2 flex gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        Le détail nominatif se prépare dans l’écran des nominations.
      </p>
    </Panel>
  );
};

const FidelesCard = ({ data }: { data: NodeDashboard }) => (
  <Panel id="d-fid">
    <PanelTitle id="d-fid" size="sm">
      Fidèles sur Jàngu Bi
    </PanelTitle>
    <p className="m-0 mt-0.5 text-14 text-ink-2">
      Paroisses ouvertes, {data.period_days} derniers jours
    </p>
    <dl className="m-0 mt-3">
      <FigureRow label="Fidèles rattachés" value={n(data.fideles.attached)} />
      <FigureRow label="Actifs sur la période" value={n(data.fideles.active)} />
      <FigureRow label="Nouveaux rattachements" value={n(data.fideles.new)} />
      <FigureRow label="Lectures d’annonces" value={n(data.annonces.reads)} />
      <FigureRow
        label="Conversations avec un prêtre"
        value={n(data.messagerie.conversations)}
      />
      <FigureRow
        label="Première réponse (médiane)"
        value={hours(data.messagerie.median_first_reply_hours)}
      />
      <FigureRow
        label="Rendez-vous de confession"
        value={
          <>
            {n(data.confessions.booked)}
            <span className="font-normal text-ink-3">
              {' '}
              / {n(data.confessions.slots_offered)}
            </span>
          </>
        }
      />
    </dl>
    <p className="m-0 mt-2 flex gap-2 text-13 text-ink-3">
      <Icon name="cadenas" size={16} className="mt-px shrink-0" />
      <span>
        Le diocèse ne voit que des totaux : aucune donnée personnelle n’est
        remontée au diocèse. Messages chiffrés, aucun administrateur n’y a
        accès.
      </span>
    </p>
  </Panel>
);

type WatchItem = {
  key: string;
  text: string;
  hint?: string;
  href?: string;
  tone: 'warn' | 'primary';
};

const WatchCard = ({
  data,
  nodeId,
}: {
  data: NodeDashboard;
  nodeId: string;
}) => {
  const canVerify = useCan('personnes.verifier', nodeId);
  const canAppoint = useCan('offices.nommer', nodeId);
  const verifications = usePendingVerifications(canVerify);
  const proposed = useProposedAssignments(nodeId, canAppoint);
  const items = [
    data.actes.overdue > 0 && {
      key: 'actes',
      text: `${plural(data.actes.overdue, 'demande d’acte', 'demandes d’actes')} en retard dans les paroisses`,
      hint: 'Délai indicatif de 7 jours dépassé',
      tone: 'warn',
    },
    data.messagerie.unanswered_48h > 0 && {
      key: 'msg',
      text: `${plural(data.messagerie.unanswered_48h, 'conversation', 'conversations')} sans réponse depuis 48 h`,
      hint: 'Comptées depuis le premier message du fidèle',
      tone: 'warn',
    },
    canAppoint &&
      proposed.data !== undefined &&
      proposed.data > 0 && {
        key: 'nom',
        text: `${plural(proposed.data, 'nomination proposée', 'nominations proposées')} en attente d’effet`,
        href: paths.espace.nominations.getHref(nodeId),
        tone: 'primary',
      },
    canVerify &&
      verifications.data !== undefined &&
      verifications.data > 0 && {
        key: 'verif',
        text: `${plural(verifications.data, 'déclaration de clerc attend', 'déclarations de clercs attendent')} une vérification`,
        href: paths.espace.clerge.getHref(nodeId),
        tone: 'primary',
      },
  ].filter(Boolean) as WatchItem[];

  return (
    <Panel id="d-surv">
      <PanelTitle id="d-surv" size="sm">
        À suivre
      </PanelTitle>
      {items.length === 0 ? (
        <p className="m-0 mt-3 border-t border-line pt-3 text-14 text-ink-2">
          Rien à signaler dans le sous-arbre.
        </p>
      ) : (
        <ul className="m-0 mt-3 list-none p-0">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex gap-2.5 border-t border-line py-3 last:pb-0"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  item.tone === 'warn' ? 'bg-warn-dot' : 'bg-primary',
                )}
              />
              <span className="flex min-w-0 flex-col">
                {item.href ? (
                  <NextLink
                    href={item.href}
                    className="text-14 font-semibold text-ink hover:text-primary"
                  >
                    {item.text}
                  </NextLink>
                ) : (
                  <span className="text-14 font-semibold text-ink">
                    {item.text}
                  </span>
                )}
                {item.hint && (
                  <span className="text-13 text-ink-3">{item.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

/**
 * Tableau de bord d'un diocèse, doyenné ou province (DIO-Tableau-de-bord).
 * RÈGLE : au-dessus de la paroisse, agrégats uniquement, aucune donnée nominative.
 */
export const DioceseDashboard = ({ nodeId }: { nodeId: string }) => {
  const dashboard = useNodeDashboard(nodeId);
  const deployment = useDeployment(nodeId);
  const canAppoint = useCan('offices.nommer', nodeId);

  if (dashboard.isPending)
    return <LoadingBlock label="Chargement du tableau de bord…" lines={6} />;
  if (dashboard.isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="Le tableau de bord n’a pas pu être chargé"
        action={
          <Button variant="secondary" onClick={() => dashboard.refetch()}>
            Réessayer
          </Button>
        }
      >
        {dashboard.error.message}
      </EmptyState>
    );
  }
  const data = dashboard.data;

  return (
    <div>
      <PageHeader
        compact
        title="Tableau de bord"
        description={
          <>
            Le déploiement de Jàngu Bi et l’activité des paroisses ouvertes, en
            chiffres agrégés.
            <span className="tnum mt-1 block text-13 text-ink-3">
              {data.node.name} · données au {stamp(data.generated_at)}
            </span>
          </>
        }
        actions={
          canAppoint && (
            <Button asChild variant="outline" className="min-h-11 text-14">
              <NextLink href={paths.espace.nominations.getHref(nodeId)}>
                <Icon name="utilisateurs" size={18} className="text-ink-2" />
                Préparer un mouvement
              </NextLink>
            </Button>
          )
        }
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="jb-cascade flex min-w-0 flex-col gap-6">
          <DeploymentCard
            deployment={deployment.data}
            failed={deployment.isError}
            nodeId={nodeId}
            scope={scopeOf(data.node)}
          />
          <ActesCard data={data} openParishes={deployment.data?.active} />
        </div>
        <div className="jb-cascade flex min-w-0 flex-col gap-6">
          {canAppoint && <NominationsCard nodeId={nodeId} />}
          <FidelesCard data={data} />
          <WatchCard data={data} nodeId={nodeId} />
        </div>
      </div>
    </div>
  );
};
