'use client';

import NextLink from 'next/link';

import { REQUEST_STATUS, RequestStatusBadge, type RequestStatus } from '@/components/signature/status-dot';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

import type { OverdueRequest } from '../api/get-overdue-requests';

const grid = 'grid grid-cols-[minmax(0,1fr)_40px] gap-4 sm:grid-cols-[124px_minmax(0,1fr)_148px_40px]';

/** « Demandes en retard » (maquette PAR-Tableau-de-bord) : lien vers la fiche de chaque demande. */
export const OverdueRequestsCard = ({ nodeId, total, rows }: { nodeId: string; total: number; rows: OverdueRequest[] }) => (
  <section aria-labelledby="tb-retard" className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 pb-4 pt-5">
      <div className="flex items-center gap-2.5">
        <h2 id="tb-retard" className="m-0 text-20 font-semibold text-ink">
          Demandes en retard
        </h2>
        <span className="tnum inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-warn-bg px-[7px] text-12 font-semibold text-warn">
          {total}
        </span>
      </div>
      <NextLink href={`${paths.espace.demandes.list.getHref(nodeId)}?retard=1`} className="text-14 font-semibold hover:underline">
        Voir toutes les demandes
      </NextLink>
    </div>
    <div role="table" aria-label="Demandes en retard">
      <div role="row" className={`${grid} border-t border-line bg-surface px-6 py-2 text-13 text-ink-3`}>
        <span role="columnheader" className="hidden sm:block">
          Référence
        </span>
        <span role="columnheader">Acte demandé</span>
        <span role="columnheader" className="hidden sm:block">
          Statut
        </span>
        <span role="columnheader" className="text-right">
          Âge
        </span>
      </div>
      {rows.map((r) => {
        const href = paths.espace.demandes.detail.getHref(nodeId, r.id);
        const status = r.status as RequestStatus;
        return (
          <div key={r.id} role="row" className={`${grid} items-center border-t border-line px-6 py-3.5 hover:bg-surface`}>
            <span role="cell" className="tnum hidden truncate text-14 text-ink-2 sm:block">
              {r.reference}
            </span>
            <span role="cell" className="flex min-w-0 flex-col">
              <NextLink href={href} className="truncate text-15 font-semibold text-ink hover:text-primary">
                {r.document_type_label}
              </NextLink>
              <span className="truncate text-13 text-ink-3">{r.requester_name}</span>
              <span className="tnum truncate text-13 text-ink-3 sm:hidden">{r.reference}</span>
            </span>
            <span role="cell" className="hidden sm:block">
              {status in REQUEST_STATUS && <RequestStatusBadge status={status} />}
            </span>
            <span role="cell" className="tnum whitespace-nowrap text-right text-14 font-semibold text-warn">
              {r.age_days ?? '—'}&nbsp;j
            </span>
          </div>
        );
      })}
    </div>
    <p className="m-0 flex items-start gap-2 border-t border-line px-6 py-3 text-13 text-ink-3">
      <Icon name="info" size={16} className="mt-px shrink-0" />
      Une demande est en retard quand elle dépasse, sans changement de statut, le délai fixé par la paroisse.
    </p>
  </section>
);
