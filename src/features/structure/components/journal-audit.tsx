'use client';

import { History } from 'lucide-react';
import { useState } from 'react';

import { NoeudSelect, useNoeudActif } from '@/components/staff/noeud-actif';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

import { AUDIT_PAR_PAGE, type EvenementAudit, useAudit } from '../api/audit';

const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Journal d'audit (`GET /v1/audit/`), filtré par nœud et préfixe d'action. */
export function JournalAudit() {
  const { noeud, noeuds, choisir } = useNoeudActif('audit.voir');
  const [action, setAction] = useState('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useAudit({
    node: noeud?.id,
    action,
    date_from: du,
    date_to: au,
    offset,
  });

  const colonnes: DataTableColumn<EvenementAudit>[] = [
    { header: 'Date', cell: (e) => dateHeure(e.at) },
    { header: 'Auteur', cell: (e) => e.actor_name ?? 'Système' },
    { header: 'Action', cell: (e) => <code className="text-xs">{e.action}</code> },
    {
      header: 'Objet',
      cell: (e) => `${e.target_type} ${e.target_id}`,
      hideOnMobile: true,
    },
    { header: 'Adresse', cell: (e) => e.ip ?? '—', hideOnMobile: true },
  ];

  const reset = () => setOffset(0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <NoeudSelect
          noeuds={noeuds}
          valeur={noeud?.id}
          onChange={(id) => {
            choisir(id);
            reset();
          }}
        />
        <label className="text-sm">
          <span className="block text-muted-foreground">Action (préfixe)</span>
          <input
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              reset();
            }}
            placeholder="office."
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-muted-foreground">Du</span>
          <input
            type="date"
            value={du}
            onChange={(e) => {
              setDu(e.target.value);
              reset();
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-muted-foreground">Au</span>
          <input
            type="date"
            value={au}
            onChange={(e) => {
              setAu(e.target.value);
              reset();
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </label>
      </div>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results}
          columns={colonnes}
          rowKey={(e) => String(e.id)}
          isLoading={isLoading}
          caption="Journal d’audit"
          emptyState={
            <EmptyState
              icon={<History />}
              title="Aucune action"
              description="Aucune action enregistrée pour ces filtres."
            />
          }
          pagination={
            data
              ? {
                  count: data.count,
                  limit: AUDIT_PAR_PAGE,
                  offset,
                  onOffsetChange: setOffset,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
