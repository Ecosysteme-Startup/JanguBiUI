'use client';

import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useTableauPlateforme } from '../api/get-node-dashboard';

const nf = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toLocaleString('fr-FR');

/** Tableau de bord Numerisen (`GET /v1/dashboards/platform/`). */
export function TableauPlateformeSection() {
  const { data, isLoading, isError, refetch } = useTableauPlateforme();
  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  const tuiles: [string, string][] = [
    ['Comptes actifs', nf(data.accounts.total)],
    ['Actifs sur 30 jours', nf(data.accounts.active_30d)],
    ['Nouveaux sur 30 jours', nf(data.accounts.new_30d)],
    [
      'Responsables avec MFA récente',
      data.staff.mfa_share === null
        ? '—'
        : `${Math.round(data.staff.mfa_share * 100)} %`,
    ],
    ['E-mails en échec (7 j)', nf(data.health.emails_failed_7d)],
    ['Demandes d’actes en retard', nf(data.health.document_requests_overdue)],
  ];
  return (
    <section aria-label="Plateforme" className="space-y-3">
      <h2 className="font-serif text-lg font-semibold">Plateforme</h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tuiles.map(([label, valeur]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-serif text-2xl font-bold tabular-nums">
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
      {data.beat.length > 0 && (
        <details className="rounded-xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">
            Tâches planifiées ({data.health.beat_stale} en retard)
          </summary>
          <ul className="mt-2 space-y-1">
            {data.beat.map((t) => (
              <li key={t.name} className="flex justify-between gap-3">
                <span>{t.name}</span>
                <span className="text-muted-foreground">
                  {t.stale
                    ? 'En retard'
                    : t.last_run_at
                      ? new Date(t.last_run_at).toLocaleString('fr-FR')
                      : 'Jamais'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
