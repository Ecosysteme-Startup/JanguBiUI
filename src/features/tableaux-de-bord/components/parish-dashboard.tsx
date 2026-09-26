'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useOfficeLabel } from '@/hooks/use-office-types';
import { useCan } from '@/lib/can';
import { plural } from '@/utils/plural';

import { type NodeDashboard, useNodeDashboard } from '../api/get-node-dashboard';
import { days, hours, n, pct, stamp, weekLabel } from '../utils/format';

import { Figure, Footnote, Grid, Meter, Panel } from './dashboard-parts';

type Todo = { key: string; title: string; detail: string; href?: string; action?: string; urgent?: boolean };

/** Le titre réel de la nomination (« curé », « administrateur paroissial »), à défaut le libellé du catalogue. */
const OfficeLine = ({ office, title }: { office: string; title?: string }) => {
  const catalogueLabel = useOfficeLabel(office);
  const label = title || catalogueLabel;
  return label ? <>{label.toLowerCase()}</> : null;
};

const TodoSection = ({ data, nodeId }: { data: NodeDashboard; nodeId: string }) => {
  const canActes = useCan('actes.traiter', nodeId);
  const canMessages = useCan('messagerie.recevoir_fideles', nodeId);
  const c = data.actes.counts;
  const demandes = canActes ? paths.espace.demandes.list.getHref(nodeId) : undefined;
  const todos = [
    data.actes.overdue > 0 && {
      key: 'retard',
      title: `${plural(data.actes.overdue, 'demande d’acte en retard', 'demandes d’actes en retard')}`,
      detail: 'Délai indicatif de 7 jours dépassé : à traiter en priorité.',
      href: demandes,
      action: 'Traiter',
      urgent: true,
    },
    (c.submitted ?? 0) > 0 && {
      key: 'soumises',
      title: `${plural(c.submitted ?? 0, 'demande reçue, non ouverte', 'demandes reçues, non ouvertes')}`,
      detail: 'Ouvrez le registre pour vérifier l’inscription.',
      href: demandes,
      action: 'Ouvrir la file',
    },
    (c.ready_for_pickup ?? 0) > 0 && {
      key: 'retrait',
      title: `${plural(c.ready_for_pickup ?? 0, 'acte prêt à retirer', 'actes prêts à retirer')}`,
      detail: 'Originaux papier attendus au secrétariat.',
      href: demandes,
      action: 'Voir',
    },
    (c.info_requested ?? 0) > 0 && {
      key: 'complement',
      title: `${plural(c.info_requested ?? 0, 'complément attendu', 'compléments attendus')} des fidèles`,
      detail: 'La demande reprend dès que le fidèle a répondu.',
    },
    data.messagerie.unanswered_48h > 0 && {
      key: 'messages',
      title: `${plural(data.messagerie.unanswered_48h, 'conversation sans réponse', 'conversations sans réponse')} depuis 48 h`,
      detail: 'Messages chiffrés · aucun administrateur n’y a accès.',
      href: canMessages ? paths.espace.messagerie.getHref(nodeId) : undefined,
      action: 'Messagerie',
    },
  ].filter(Boolean) as Todo[];

  return (
    <Panel span={7} labelledBy="tb-traiter">
      <SectionHeading
        id="tb-traiter"
        number="01"
        title="À traiter"
        aside={`${plural(todos.length, 'point', 'points')} · mis à jour à ${stamp(data.generated_at).split(' à ')[1]}`}
      />
      {todos.length === 0 ? (
        <p className="m-0 border-b border-line py-4 text-base text-ink-2">
          Rien d’urgent : aucune demande en attente, aucune conversation sans réponse.
        </p>
      ) : (
        <ol className="m-0 list-none p-0">
          {todos.map((todo, index) => (
            <li key={todo.key} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4">
              <span className="tnum text-meta text-primary">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className={todo.urgent ? 'm-0 text-body font-semibold text-err' : 'm-0 text-body font-semibold text-ink'}>
                  {todo.title}
                </p>
                <p className="m-0 mt-1 text-sm text-ink-2">{todo.detail}</p>
              </div>
              {todo.href && (
                <NextLink href={todo.href} className="text-sm text-primary">
                  {todo.action}
                </NextLink>
              )}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
};

const ConfessionsSection = ({ data, nodeId }: { data: NodeDashboard; nodeId: string }) => {
  const canManageSlots = useCan('confessions.gerer', nodeId);
  const canSeePlanning = useCan('confessions.voir_planning', nodeId);
  const canManage = canManageSlots || canSeePlanning;
  const { confessions: cf } = data;
  return (
    <Panel span={5} labelledBy="tb-conf">
      <SectionHeading
        id="tb-conf"
        number="02"
        title="Confessions"
        aside={
          canManage ? (
            <NextLink href={paths.espace.confessions.getHref(nodeId)} className="text-primary">
              Gérer
            </NextLink>
          ) : undefined
        }
      />
      <Figure value={n(cf.upcoming_booked)}>rendez-vous à venir</Figure>
      <p className="m-0 text-sm text-ink-2">
        Sur les {data.period_days} derniers jours : {n(cf.booked)} créneaux pris sur {n(cf.slots_offered)} proposés.
      </p>
      <Meter value={cf.booked} max={cf.slots_offered} className="mt-3 h-2 [&>span]:h-2" />
      <dl className="m-0 mt-4 grid grid-cols-3 gap-4">
        {[
          { label: 'Honorés', value: cf.honoured },
          { label: 'Absences', value: cf.absent },
          { label: 'Annulés', value: cf.cancelled },
        ].map((item) => (
          <div key={item.label}>
            <dt className="tnum text-meta text-ink-3">{item.label}</dt>
            <dd className="tnum m-0 mt-1 font-serif text-h4">{n(item.value)}</dd>
          </div>
        ))}
      </dl>
      <Footnote icon="cadenas">Le nom des pénitents n’est visible que du prêtre concerné.</Footnote>
    </Panel>
  );
};

const Indicators = ({ data }: { data: NodeDashboard }) => {
  const rows = [
    {
      label: 'Fidèles rattachés',
      value: n(data.fideles.attached),
      text: (
        <>
          dont <strong className="font-semibold text-ink">{plural(data.fideles.active, 'actif', 'actifs')}</strong> sur la période, soit{' '}
          {pct(data.fideles.active, data.fideles.attached)}. {plural(data.fideles.new, 'nouveau rattachement', 'nouveaux rattachements')}.
        </>
      ),
      meter: [data.fideles.active, data.fideles.attached] as const,
    },
    {
      label: 'Lectures d’annonces',
      value: n(data.annonces.reads),
      text: <>{plural(data.annonces.published, 'annonce publiée', 'annonces publiées')} sur la période.</>,
    },
    {
      label: 'Demandes d’actes',
      value: n(data.actes.received),
      text: (
        <>
          délai médian de {days(data.actes.median_days_to_collect)} ·{' '}
          <strong className={data.actes.overdue ? 'font-semibold text-err' : 'font-semibold text-ink'}>
            {n(data.actes.overdue)} en retard
          </strong>
        </>
      ),
    },
    {
      label: 'Conversations ouvertes',
      value: n(data.messagerie.conversations),
      text: <>première réponse d’un prêtre en {hours(data.messagerie.median_first_reply_hours)} (médiane)</>,
    },
    {
      label: 'Événements à venir',
      value: n(data.evenements.upcoming),
      text: <>{plural(data.evenements.registrations, 'inscription reçue', 'inscriptions reçues')} sur la période.</>,
    },
  ];
  return (
    <Panel span={12} labelledBy="tb-ind">
      <SectionHeading
        id="tb-ind"
        number="03"
        title={`Indicateurs · ${data.period_days} derniers jours`}
        aside="Données de la paroisse seule"
      />
      <dl className="m-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-1 items-baseline gap-2 border-b border-line py-3 md:grid-cols-[200px_120px_minmax(0,1fr)_140px] md:gap-6"
          >
            <dt className="tnum text-meta text-ink-3">{row.label}</dt>
            <dd className="tnum m-0 font-serif text-h3 text-ink">{row.value}</dd>
            <dd className="m-0 text-sm text-ink-2">{row.text}</dd>
            <dd className="m-0">{row.meter && <Meter value={row.meter[0]} max={row.meter[1]} />}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};

/** Tableau de bord d'une paroisse (PAR-Tableau-de-bord). */
type ParishDashboardProps = { nodeId: string; offices: string[]; officeLabels?: Record<string, string> };

export const ParishDashboard = ({ nodeId, offices, officeLabels }: ParishDashboardProps) => {
  const dashboard = useNodeDashboard(nodeId);
  const canActes = useCan('actes.traiter', nodeId);
  const canAnnonces = useCan('annonces.publier', nodeId);

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
  const actingOffices = offices.filter((o) => o !== 'plateforme');

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="tnum m-0 text-meta text-ink-2">{weekLabel(data.generated_at)}</p>
          <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">
            Cette semaine à <em className="text-primary">{data.node.name}</em>
          </h1>
          {actingOffices.length > 0 && (
            <p className="m-0 mt-3 text-base text-ink-2">
              Vous agissez comme{' '}
              {actingOffices.map((o, i) => (
                <span key={o}>
                  {i > 0 && ' et '}
                  <OfficeLine office={o} title={officeLabels?.[o]} />
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canActes && (
            <Button asChild variant="secondary">
              <NextLink href={paths.espace.demandes.list.getHref(nodeId)}>File des demandes</NextLink>
            </Button>
          )}
          {canAnnonces && (
            <Button asChild>
              <NextLink href={paths.espace.annonces.nouvelle.getHref(nodeId)}>Préparer l’annonce du dimanche</NextLink>
            </Button>
          )}
        </div>
      </header>
      <Grid>
        <TodoSection data={data} nodeId={nodeId} />
        <ConfessionsSection data={data} nodeId={nodeId} />
      </Grid>
      <Grid>
        <Indicators data={data} />
      </Grid>
    </div>
  );
};
