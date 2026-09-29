'use client';

import { useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ErrorState } from '@/components/ui/error-state';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';

import {
  AUDIT_PAR_PAGE,
  type EntreeAudit,
  type FiltresAudit,
  useAuditComptes,
} from '../api/admin-comptes';
import {
  familleAction,
  LIBELLES_ACTION_AUDIT,
  libelleAction,
  motifAudit,
} from '../utils/audit';

import { champ, dateHeure } from './commun';

/** Journal des actions d'administration sur les comptes (lecture seule). */
export function JournalComptes() {
  const id = useId();
  const sp = useSearchParams();
  const [f, setF] = useState<FiltresAudit>({
    account: sp?.get('account') ?? '',
    actor: '',
    action: '',
    date_from: '',
    date_to: '',
    offset: 0,
  });
  const maj = (p: Partial<FiltresAudit>) =>
    setF((a) => ({ ...a, ...p, offset: 0 }));
  const { data, isLoading, isError, refetch } = useAuditComptes(f);

  const columns: DataTableColumn<EntreeAudit>[] = [
    { header: 'Date', cell: (e) => dateHeure(e.at) },
    { header: 'Auteur', cell: (e) => e.actor_email ?? 'Système' },
    {
      header: 'Action',
      cell: (e) => (
        <span>
          {libelleAction(e.action)}
          {motifAudit(e.metadata) && (
            <span className="block text-xs text-muted-foreground">
              Motif : {motifAudit(e.metadata)}
            </span>
          )}
        </span>
      ),
    },
    {
      header: 'Compte concerné',
      cell: (e) =>
        e.target_email ? (
          <Link
            href={paths.app.admin.comptes.fiche.getHref(e.target_id)}
            className="hover:text-primary"
          >
            {e.target_email}
          </Link>
        ) : (
          '—'
        ),
    },
    { header: 'Rattachement', cell: (e) => e.node?.name ?? '—' },
    {
      header: 'Type',
      cell: (e) => <Badge variant="outline">{familleAction(e.action)}</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Journal d’audit</h2>
        <p className="text-sm text-muted-foreground">
          Actions sur les comptes de votre périmètre. Les entrées ne peuvent pas
          être modifiées.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={`${id}-a`} className="text-xs font-medium">
            Auteur
          </label>
          <input
            id={`${id}-a`}
            type="search"
            placeholder="E-mail de l’auteur"
            value={f.actor}
            onChange={(e) => maj({ actor: e.target.value })}
            className={champ}
          />
        </div>
        <div>
          <label htmlFor={`${id}-t`} className="text-xs font-medium">
            Type d’action
          </label>
          <select
            id={`${id}-t`}
            value={f.action}
            onChange={(e) => maj({ action: e.target.value })}
            className={champ}
          >
            <option value="">Tous les types</option>
            {Object.entries(LIBELLES_ACTION_AUDIT).map(([k, l]) => (
              <option key={k} value={`compte.admin.${k}`}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-d`} className="text-xs font-medium">
            Du
          </label>
          <input
            id={`${id}-d`}
            type="date"
            value={f.date_from}
            onChange={(e) => maj({ date_from: e.target.value })}
            className={champ}
          />
        </div>
        <div>
          <label htmlFor={`${id}-f`} className="text-xs font-medium">
            Au
          </label>
          <input
            id={`${id}-f`}
            type="date"
            value={f.date_to}
            onChange={(e) => maj({ date_to: e.target.value })}
            className={champ}
          />
        </div>
        {f.account && (
          <p className="text-sm sm:col-span-2 lg:col-span-4">
            Filtré sur un compte.{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => maj({ account: '' })}
            >
              Voir tous les comptes
            </button>
          </p>
        )}
      </div>

      {isError ? (
        <ErrorState
          description="Le journal n’a pas pu être chargé."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          caption="Journal des actions sur les comptes"
          data={data?.results}
          columns={columns}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          pagination={
            data
              ? {
                  count: data.count,
                  limit: AUDIT_PAR_PAGE,
                  offset: f.offset ?? 0,
                  onOffsetChange: (offset) => setF((a) => ({ ...a, offset })),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
