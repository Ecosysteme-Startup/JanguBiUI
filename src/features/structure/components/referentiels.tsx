'use client';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

import {
  type TypeNoeud,
  type TypeOffice,
  useTypesNoeud,
  useTypesOffice,
} from '../api/hierarchie';

/** Référentiels en lecture : types de nœuds et catalogue des offices. */
export function Referentiels() {
  const noeuds = useTypesNoeud();
  const offices = useTypesOffice();
  const colNoeuds: DataTableColumn<TypeNoeud>[] = [
    { header: 'Type', cell: (t) => t.label },
    { header: 'Code', cell: (t) => <code className="text-xs">{t.code}</code> },
    {
      header: 'Rattaché à',
      cell: (t) => t.allowed_parent_types.join(', ') || '—',
    },
    { header: 'Tient des registres', cell: (t) => (t.holds_registers ? 'Oui' : 'Non') },
  ];
  const colOffices: DataTableColumn<TypeOffice>[] = [
    { header: 'Office', cell: (o) => o.label },
    { header: 'Nœuds', cell: (o) => o.node_types.join(', ') },
    {
      header: 'Nommé par',
      cell: (o) =>
        o.appointed_by_platform ? 'Plateforme' : o.appointed_by.join(', '),
    },
    {
      header: 'Capacités',
      cell: (o) => (
        <span className="text-xs">{o.capabilities.join(', ')}</span>
      ),
      hideOnMobile: true,
    },
  ];
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">Types de nœuds</h2>
        <DataTable
          data={noeuds.data}
          columns={colNoeuds}
          rowKey={(t) => t.code}
          isLoading={noeuds.isLoading}
          caption="Types de nœuds"
        />
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">Offices</h2>
        <DataTable
          data={offices.data}
          columns={colOffices}
          rowKey={(o) => o.code}
          isLoading={offices.isLoading}
          caption="Catalogue des offices"
        />
      </section>
    </div>
  );
}
