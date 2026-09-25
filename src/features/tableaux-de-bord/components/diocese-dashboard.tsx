'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useCan } from '@/lib/can';

import { type Deployment, useDeployment } from '../api/get-deployment';
import { type NodeDashboard, useNodeDashboard } from '../api/get-node-dashboard';
import { usePendingVerifications, useProposedAssignments } from '../api/get-watch-counts';
import { days, hours, n, pct, plural, stamp } from '../utils/format';

import { Figure, Footnote, Grid, Meter, Panel } from './dashboard-parts';

const ACTE_STATUSES: { key: string; label: string }[] = [
  { key: 'submitted', label: 'Soumises, non ouvertes' },
  { key: 'under_verification', label: 'En vérification' },
  { key: 'info_requested', label: 'Complément demandé' },
  { key: 'ready_for_pickup', label: 'Prêtes à retirer' },
  { key: 'collected', label: 'Retirées' },
  { key: 'rejected', label: 'Rejetées' },
];

const Unavailable = () => <p className="m-0 text-sm text-ink-2">Données de structure indisponibles pour le moment.</p>;

const DeploymentSection = ({ deployment, failed, nodeId }: { deployment: Deployment | undefined; failed: boolean; nodeId: string }) => {
  const toConnect = deployment ? deployment.total - deployment.active : 0;
  return (
    <>
      <Panel span={5} labelledBy="d-deploiement">
        <SectionHeading
          id="d-deploiement"
          number="02"
          title="Déploiement de Jàngu Bi"
          aside={deployment ? plural(deployment.total, 'paroisse', 'paroisses') : undefined}
        />
        {deployment ? (
          <>
            <Figure value={n(deployment.active)} size="xl">
              {deployment.active > 1 ? 'paroisses actives' : 'paroisse active'} sur {n(deployment.total)}
              {deployment.founding > 0 && (
                <>
                  , <em className="text-primary">{plural(deployment.founding, 'en fondation', 'en fondation')}</em>
                </>
              )}
            </Figure>
            <div aria-hidden="true" className="mt-4 flex h-3 border border-line-strong">
              <span className="bg-primary" style={{ width: `${deployment.total ? (deployment.active / deployment.total) * 100 : 0}%` }} />
              <span className="flex-1 bg-surface" />
            </div>
            <dl className="m-0 mt-3 grid grid-cols-2 gap-4">
              <div>
                <dt className="tnum flex items-center gap-2 text-meta text-ink-3">
                  <span aria-hidden="true" className="size-2 bg-primary" />
                  Active{deployment.active > 1 ? 's' : ''}
                </dt>
                <dd className="tnum m-0 mt-1 text-xs text-ink">{n(deployment.active)}</dd>
              </div>
              <div>
                <dt className="tnum flex items-center gap-2 text-meta text-ink-3">
                  <span aria-hidden="true" className="size-2 border border-line-strong" />À raccorder
                </dt>
                <dd className="tnum m-0 mt-1 text-xs text-ink">{n(toConnect)}</dd>
              </div>
            </dl>
          </>
        ) : failed ? (
          <Unavailable />
        ) : (
          <LoadingBlock label="Chargement du déploiement…" />
        )}
      </Panel>

      <Panel span={7} labelledBy="d-doy">
        <SectionHeading
          id="d-doy"
          number="03"
          title="Déploiement par doyenné"
          aside={
            <NextLink href={paths.espace.structure.getHref(nodeId)} className="text-primary">
              Ouvrir la structure
            </NextLink>
          }
        />
        {!deployment ? (
          failed ? (
            <Unavailable />
          ) : (
            <LoadingBlock label="Chargement des doyennés…" />
          )
        ) : deployment.rows.length === 0 ? (
          <p className="m-0 text-sm text-ink-2">Aucun doyenné sous ce nœud : les paroisses y sont rattachées directement.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Doyenné</Th>
                <Th className="text-right">Paroisses</Th>
                <Th className="text-right">Actives</Th>
                <Th className="text-right">En fondation</Th>
                <Th>Ouverture</Th>
              </tr>
            </thead>
            <tbody>
              {deployment.rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <span className="font-medium">{row.name}</span>
                  </Td>
                  <Td className="tnum text-right">{n(row.total)}</Td>
                  <Td className="tnum text-right">{n(row.active)}</Td>
                  <Td className="tnum text-right">{n(row.founding)}</Td>
                  <Td className="w-32">
                    <Meter value={row.active} max={row.total} />
                  </Td>
                </Tr>
              ))}
              <Tr>
                <Td className="font-semibold">Ensemble</Td>
                <Td className="tnum text-right font-semibold">{n(deployment.total)}</Td>
                <Td className="tnum text-right font-semibold">{n(deployment.active)}</Td>
                <Td className="tnum text-right font-semibold">{n(deployment.founding)}</Td>
                <Td className="tnum text-meta text-ink-2">Taux d’ouverture : {pct(deployment.active, deployment.total)}</Td>
              </Tr>
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
};

const WatchSection = ({ data, nodeId }: { data: NodeDashboard; nodeId: string }) => {
  const canVerify = useCan('personnes.verifier', nodeId);
  const canAppoint = useCan('offices.nommer', nodeId);
  const verifications = usePendingVerifications(canVerify);
  const proposed = useProposedAssignments(nodeId, canAppoint);
  const items = [
    data.actes.overdue > 0 && {
      key: 'actes',
      text: `${plural(data.actes.overdue, 'demande d’acte', 'demandes d’actes')} en retard dans les paroisses`,
      hint: 'Délai indicatif de 7 jours dépassé',
      tone: 'err',
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
  ].filter(Boolean) as { key: string; text: string; hint?: string; href?: string; tone: string }[];

  return (
    <Panel span={12} labelledBy="d-surv">
      <SectionHeading id="d-surv" number="04" title="À surveiller" aside={`${plural(items.length, 'point', 'points')}`} />
      {items.length === 0 ? (
        <p className="m-0 text-base text-ink-2">Rien à signaler dans le sous-arbre.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 p-0 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
              <span>
                <span
                  className={
                    item.tone === 'err'
                      ? 'font-semibold text-err'
                      : item.tone === 'warn'
                        ? 'font-semibold text-warn'
                        : 'font-medium text-ink'
                  }
                >
                  {item.text}
                </span>
                {item.hint && <span className="block text-sm text-ink-2">{item.hint}</span>}
              </span>
              {item.href && (
                <NextLink href={item.href} className="shrink-0 text-sm text-primary">
                  Ouvrir
                </NextLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const AggregateSections = ({ data }: { data: NodeDashboard }) => {
  const max = Math.max(1, ...ACTE_STATUSES.map((s) => data.actes.counts[s.key] ?? 0));
  return (
    <Grid>
      <Panel span={4} labelledBy="d-fid">
        <SectionHeading id="d-fid" number="05" title="Fidèles rattachés" aside={`${data.period_days} derniers jours`} />
        <Figure value={n(data.fideles.attached)}>
          dont <strong className="font-semibold text-ink">{plural(data.fideles.active, 'actif', 'actifs')}</strong> sur la période
          <br />
          {plural(data.fideles.new, 'nouveau rattachement', 'nouveaux rattachements')}
        </Figure>
        <Meter value={data.fideles.active} max={data.fideles.attached} className="h-2 [&>span]:h-2" />
        <Footnote>Comptage par paroisse suivie ; aucune donnée personnelle n’est remontée au diocèse.</Footnote>
      </Panel>

      <Panel span={4} labelledBy="d-actes">
        <SectionHeading id="d-actes" number="06" title="Demandes d’actes" aside="Toutes paroisses" />
        <Figure value={n(data.actes.received)}>
          reçues · délai médian <strong className="font-semibold text-ink">{days(data.actes.median_days_to_collect)}</strong>
          <br />
          <strong className={data.actes.overdue ? 'font-semibold text-err' : 'font-semibold text-ink'}>
            {n(data.actes.overdue)} en retard
          </strong>{' '}
          (plus de 7 jours)
        </Figure>
        <ul aria-label="Demandes par statut" className="m-0 flex list-none flex-col gap-2 p-0">
          {ACTE_STATUSES.map((s) => (
            <li key={s.key} className="grid grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-1">
              <span className="text-sm text-ink">{s.label}</span>
              <span className="tnum text-right text-xs">{n(data.actes.counts[s.key] ?? 0)}</span>
              <Meter value={data.actes.counts[s.key] ?? 0} max={max} className="col-span-2" />
            </li>
          ))}
        </ul>
        <Footnote>Volumes et délais seulement : le nom des demandeurs reste à la paroisse du sacrement.</Footnote>
      </Panel>

      <Panel span={4} labelledBy="d-msg">
        <SectionHeading id="d-msg" number="07" title="Parler à un prêtre" aside={`${data.period_days} derniers jours`} />
        <Figure value={n(data.messagerie.conversations)}>
          {data.messagerie.conversations > 1 ? 'conversations ouvertes' : 'conversation ouverte'}
          <br />1<sup>re</sup> réponse en{' '}
          <strong className="font-semibold text-ink">{hours(data.messagerie.median_first_reply_hours)}</strong> (médiane)
        </Figure>
        <dl className="m-0 grid grid-cols-2 gap-4 border-t border-line pt-3">
          <div>
            <dt className="tnum text-meta text-ink-3">Sans réponse à 48 h</dt>
            <dd className="tnum m-0 mt-1 font-serif text-h3">{n(data.messagerie.unanswered_48h)}</dd>
          </div>
          <div>
            <dt className="tnum text-meta text-ink-3">Confessions réservées</dt>
            <dd className="tnum m-0 mt-1 font-serif text-h3">
              {n(data.confessions.booked)}
              <span className="text-base text-ink-2"> / {n(data.confessions.slots_offered)}</span>
            </dd>
          </div>
        </dl>
        <Footnote icon="cadenas">
          Messages chiffrés · aucun administrateur n’y a accès. Le diocèse ne voit que des volumes et des délais, jamais le contenu.
        </Footnote>
      </Panel>
    </Grid>
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

  if (dashboard.isPending) return <LoadingBlock label="Chargement du tableau de bord…" lines={6} />;
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
        number="01"
        eyebrow={`Vue agrégée · données au ${stamp(data.generated_at)}`}
        title={data.node.name}
        actions={
          canAppoint && (
            <Button asChild variant="secondary">
              <NextLink href={paths.espace.nominations.getHref(nodeId)}>Préparer un mouvement</NextLink>
            </Button>
          )
        }
      />
      <Grid>
        <DeploymentSection deployment={deployment.data} failed={deployment.isError} nodeId={nodeId} />
        <WatchSection data={data} nodeId={nodeId} />
      </Grid>
      <AggregateSections data={data} />
    </div>
  );
};
