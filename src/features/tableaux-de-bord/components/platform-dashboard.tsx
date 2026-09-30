'use client';

import NextLink from 'next/link';
import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { usePlatformDashboard } from '../api/get-platform-dashboard';
import { n } from '../utils/format';

const runAt = (iso: string | null) => (iso ? dayjs(iso).format('DD.MM HH:mm:ss') : 'Jamais');

/** Rangée « libellé … valeur · complément » de la carte Santé (WEB-PLA-Tableau-de-bord). */
const HealthRow = ({ label, value, extra }: { label: string; value: React.ReactNode; extra?: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-line py-3">
    <dt className="text-14 text-ink-2">{label}</dt>
    <dd className="tnum m-0 whitespace-nowrap text-14 text-ink-3">
      {value}
      {extra && <> · {extra}</>}
    </dd>
  </div>
);

const Strong = ({ children, tone }: { children: React.ReactNode; tone?: 'warn' }) => (
  <strong className={cn('text-15 font-semibold', tone === 'warn' ? 'text-warn' : 'text-ink')}>{children}</strong>
);

/** Rangée de file technique : point d'état, libellé, compteur (WEB-PLA-Tableau-de-bord, « Files techniques »). */
const QueueRow = ({ label, value, alert, hint }: { label: string; value: number; alert: boolean; hint: string }) => (
  <div className="flex items-center justify-between gap-3 border-t border-line py-2.5">
    <dt className="flex min-w-0 flex-col">
      <span className="inline-flex items-center gap-2 text-14 text-ink-2">
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', alert ? 'bg-warn-dot' : 'bg-ok-dot')} />
        {label}
      </span>
      <span className="pl-4 text-13 text-ink-3">{hint}</span>
    </dt>
    <dd className={cn('tnum m-0 text-15 font-semibold', alert ? 'text-warn' : 'text-ink')}>{n(value)}</dd>
  </div>
);

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
  const mfaFull = staff.mfa_share !== null && staff.mfa_share >= 1;
  const mfa = staff.mfa_share === null ? '—' : `${Math.round(staff.mfa_share * 100)}\u00a0%`;

  return (
    <div>
      <PageHeader
        compact
        title="Tableau de bord"
        description={`État de Jàngu Bi en production. Mis à jour le ${dayjs(generated_at).format('D MMMM')} à ${hour(generated_at)}.`}
        actions={
          <Button asChild variant="outline" className="min-h-11 text-14">
            <NextLink href={paths.plateforme.audit.getHref()}>
              <Icon name="historique" size={18} className="text-ink-2" />
              Journal d’audit
            </NextLink>
          </Button>
        }
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="jb-cascade flex min-w-0 flex-col gap-6">
          <Card as="section" padding="none" aria-labelledby="p-sante" className="px-6 py-5">
            <h2 id="p-sante" className="m-0 text-20 font-semibold text-ink">
              Santé de la plateforme
            </h2>
            <dl className="m-0 mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <HealthRow label="Comptes" value={<Strong>{n(accounts.total)}</Strong>} extra={`dont ${n(staff.total)} staff`} />
              <HealthRow label="Actifs, 30 jours" value={<Strong>{n(accounts.active_30d)}</Strong>} />
              <HealthRow label="Nouveaux comptes, 30 jours" value={<Strong>{n(accounts.new_30d)}</Strong>} />
              <div className="flex items-center justify-between gap-3 border-t border-line py-3">
                <dt className="text-14 text-ink-2">MFA du staff</dt>
                <dd className="m-0">
                  <Badge tone={mfaFull ? 'ok' : 'warn'} icon={mfaFull ? 'check' : 'alerte'}>
                    {n(staff.with_mfa_30d)} sur {n(staff.total)} · {mfa}
                  </Badge>
                </dd>
              </div>
            </dl>
            <p className="m-0 mt-2 flex gap-2 text-13 text-ink-3">
              <Icon name="info" size={16} className="mt-px shrink-0" />
              MFA : staff ayant validé son second facteur dans les 30 derniers jours.
            </p>
          </Card>

          <Card as="section" padding="none" aria-labelledby="p-task" className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-4 px-6 pb-4 pt-5">
              <h2 id="p-task" className="m-0 text-20 font-semibold text-ink">
                Tâches planifiées
              </h2>
              <span className="text-13 text-ink-3">{plural(beat.length, 'tâche', 'tâches')} · heure de Dakar (UTC)</span>
            </div>
            {beat.length === 0 ? (
              <p className="m-0 border-t border-line px-6 py-4 text-14 text-ink-2">Aucune tâche planifiée déclarée.</p>
            ) : (
              <Table label="Tâches planifiées, défilement horizontal">
                <thead>
                  <tr>
                    <Th className="h-10 first:pl-6">Tâche</Th>
                    <Th className="h-10">Dernière exécution</Th>
                    <Th className="h-10 last:pr-6">État</Th>
                  </tr>
                </thead>
                <tbody>
                  {beat.map((task) => (
                    <Tr key={task.name}>
                      <Td className="h-14 first:pl-6">
                        <span className="block font-semibold">{task.name}</span>
                        <span className="tnum block text-13 text-ink-3">{task.task}</span>
                      </Td>
                      <Td className="tnum h-14 text-ink-2">{runAt(task.last_run_at)}</Td>
                      <Td className="h-14 last:pr-6">
                        {!task.enabled ? (
                          <Badge tone="muted" dot>
                            Désactivée
                          </Badge>
                        ) : task.stale ? (
                          <Badge tone="err" dot>
                            En retard
                          </Badge>
                        ) : (
                          <Badge tone="ok" dot>
                            OK
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card as="section" padding="none" aria-labelledby="p-files" className="min-w-0 px-6 py-5">
          <h2 id="p-files" className="m-0 text-18 font-semibold leading-[26px] text-ink">
            Files techniques
          </h2>
          <dl className="m-0 mt-3">
            <QueueRow label="Courriels en échec" value={health.emails_failed_7d} alert={health.emails_failed_7d > 0} hint="7 derniers jours" />
            <QueueRow
              label="Actes en retard"
              value={health.document_requests_overdue}
              alert={health.document_requests_overdue > 0}
              hint="Toutes paroisses, plus de 7 jours"
            />
            <QueueRow label="Tâches planifiées en retard" value={health.beat_stale} alert={health.beat_stale > 0} hint="Planificateur (Celery beat)" />
          </dl>
        </Card>
      </div>
    </div>
  );
};
