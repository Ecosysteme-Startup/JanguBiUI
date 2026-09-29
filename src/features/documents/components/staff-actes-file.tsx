'use client';

import { FileText, Search } from 'lucide-react';
import { useState } from 'react';

import {
  AucunNoeud,
  NoeudSelect,
  useNoeudActif,
} from '@/components/staff/noeud-actif';
import { Badge } from '@/components/ui/badge/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';

import {
  ACTES_PAR_PAGE,
  type ActeFile,
  LIBELLES_STATUT,
  type StatutActe,
  useComptesActes,
  useFileActes,
} from '../api/staff-documents';

const ONGLETS: (StatutActe | '')[] = [
  '',
  'submitted',
  'under_verification',
  'info_requested',
  'ready_for_pickup',
  'collected',
  'rejected',
];

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** File des demandes d'actes de la paroisse (`/v1/staff/documents/`). */
export function StaffActesFile() {
  const { noeud, noeuds, choisir, isLoading } = useNoeudActif('actes.traiter');
  const [statut, setStatut] = useState<string>('');
  const [recherche, setRecherche] = useState('');
  const [enRetard, setEnRetard] = useState(false);
  const [offset, setOffset] = useState(0);

  const { data: comptes } = useComptesActes(noeud?.id, !!noeud);
  const file = useFileActes(
    {
      node: noeud?.id,
      status: statut,
      search: recherche,
      overdue: enRetard,
      offset,
    },
    !!noeud,
  );

  if (isLoading) return null;
  if (!noeud) return <AucunNoeud quoi="le traitement des demandes d’actes" />;

  const options = ONGLETS.map((s) => ({
    value: s,
    label: s ? LIBELLES_STATUT[s] : 'Toutes',
    count: s ? comptes?.counts[s] : comptes?.total,
  }));

  const colonnes: DataTableColumn<ActeFile>[] = [
    {
      header: 'Référence',
      cell: (a) => (
        <Link
          href={paths.app.admin.document.getHref(a.id)}
          className="font-medium"
        >
          {a.reference}
        </Link>
      ),
    },
    { header: 'Acte', cell: (a) => a.document_type_label },
    { header: 'Demandeur', cell: (a) => a.requester_name || '—' },
    {
      header: 'Statut',
      cell: (a) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge variant="outline">{a.status_label}</Badge>
          {a.is_overdue && <Badge variant="destructive">En retard</Badge>}
        </span>
      ),
    },
    {
      header: 'Suivi par',
      cell: (a) => a.assigned_to_name ?? 'À attribuer',
      hideOnMobile: true,
    },
    { header: 'Reçue le', cell: (a) => dateCourte(a.created_at) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoeudSelect
          noeuds={noeuds}
          valeur={noeud.id}
          onChange={(id) => {
            choisir(id);
            setOffset(0);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={enRetard}
              onChange={(e) => {
                setEnRetard(e.target.checked);
                setOffset(0);
              }}
            />
            En retard seulement
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Rechercher une référence ou un nom"
              placeholder="Référence ou nom"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setOffset(0);
              }}
              className="rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      <FilterPills
        options={options}
        value={statut}
        onChange={(v) => {
          setStatut(v);
          setOffset(0);
        }}
        ariaLabel="Filtrer par statut"
      />

      {file.isError ? (
        <ErrorState onRetry={() => file.refetch()} />
      ) : (
        <DataTable
          data={file.data?.results}
          columns={colonnes}
          rowKey={(a) => a.id}
          isLoading={file.isLoading}
          caption={`Demandes d’actes de ${noeud.name}`}
          emptyState={
            <EmptyState
              icon={<FileText />}
              title="Aucune demande"
              description="Aucune demande ne correspond à ces filtres."
            />
          }
          pagination={
            file.data
              ? {
                  count: file.data.count,
                  limit: ACTES_PAR_PAGE,
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
