'use client';

import NextLink from 'next/link';

import { StatusDot } from '@/components/signature/status-dot';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { usePlatformDashboard } from '../api/get-platform-dashboard';
import { n, stamp } from '../utils/format';

import { Grid, Panel } from './dashboard-parts';

const runAt = (iso: string | null) => (iso ? dayjs(iso).format('DD.MM HH:mm:ss') : 'Jamais');

/** Tableau de bord plateforme (PLA-Tableau-de-bord) : comptes, MFA du staff, santé. */
export const PlatformDashboardView = () => {
  const dashboard = usePlatformDashboard();

  if (dashboard.isPending) return <LoadingBlock label="Chargement des mesures…" lines={6} />;
  if (dashboard.isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="Les mesures n’ont pas pu être chargées"
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
  const { accounts, staff, health, beat, generated_at } = dashboard.data;
  const mfa = staff.mfa_share === null ? '—' : `${Math.round(staff.mfa_share * 100)}\u00a0%`;
  const figures = [
    { label: 'Comptes', value: n(accounts.total), hint: `${plural(accounts.active_30d, 'actif', 'actifs')} sur 30 jours · ${plural(accounts.new_30d, 'nouveau', 'nouveaux')}` },
    {
      label: 'Staff avec MFA',
      value: mfa,
      hint: `${n(staff.with_mfa_30d)} sur ${n(staff.total)} dans les 30 derniers jours`,
      alert: staff.mfa_share !== null && staff.mfa_share < 1,
    },
    { label: 'Courriels en échec', value: n(health.emails_failed_7d), hint: '7 derniers jours', alert: health.emails_failed_7d > 0 },
    {
      label: 'Actes en retard',
      value: n(health.document_requests_overdue),
      hint: 'Toutes paroisses, plus de 7 jours',
      alert: health.document_requests_overdue > 0,
    },
    { label: 'Tâches en retard', value: n(health.beat_stale), hint: 'Planificateur (Celery beat)', alert: health.beat_stale > 0 },
  ];

  return (
    <div>
      <PageHeader
        number="01"
        eyebrow={`Production · mesures du ${stamp(generated_at)}`}
        title="Santé de la plateforme"
        actions={
          <Button asChild variant="secondary">
            <NextLink href={paths.plateforme.audit.getHref()}>Journal d’audit</NextLink>
          </Button>
        }
      />
      <dl className="m-0 mt-8 grid grid-cols-2 gap-x-6 border-t border-line-strong md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        {figures.map((f) => (
          <div key={f.label} className="pr-6 pt-4">
            <dt className="tnum text-meta text-ink-3">{f.label}</dt>
            <dd className={f.alert ? 'tnum m-0 mt-2 font-serif text-h2 text-err' : 'tnum m-0 mt-2 font-serif text-h2 text-ink'}>
              {f.value}
            </dd>
            <dd className="m-0 mt-1 text-sm text-ink-2">{f.hint}</dd>
          </div>
        ))}
      </dl>
      <Grid>
        <Panel span={12} labelledBy="p-task">
          <SectionHeading
            id="p-task"
            number="02"
            title="Tâches planifiées"
            aside={`${plural(beat.length, 'tâche', 'tâches')} · heure de Dakar (UTC)`}
          />
          {beat.length === 0 ? (
            <p className="m-0 text-sm text-ink-2">Aucune tâche planifiée déclarée.</p>
          ) : (
            <Table label="Tâches planifiées, défilement horizontal">
              <thead>
                <tr>
                  <Th>Tâche</Th>
                  <Th>Code</Th>
                  <Th>Dernière exécution</Th>
                  <Th>État</Th>
                </tr>
              </thead>
              <tbody>
                {beat.map((task) => (
                  <Tr key={task.name}>
                    <Td className="font-medium">{task.name}</Td>
                    <Td className="tnum text-meta text-ink-3">{task.task}</Td>
                    <Td className="tnum">{runAt(task.last_run_at)}</Td>
                    <Td>
                      {!task.enabled ? (
                        <StatusDot tone="muted" label="Désactivée" />
                      ) : task.stale ? (
                        <StatusDot tone="err" label="En retard" />
                      ) : (
                        <StatusDot tone="ok" label="OK" />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </Grid>
    </div>
  );
};
