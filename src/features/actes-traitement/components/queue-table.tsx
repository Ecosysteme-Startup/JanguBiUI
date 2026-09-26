'use client';

import NextLink from 'next/link';
import type * as React from 'react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Choice } from '@/components/ui/choice';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useTransitionRequest } from '../api/transition-request';
import { type QueueItem, reasonText } from '../types/processing';
import { allowedTransitions } from '../utils/transitions';

import { RequestStatusBadge } from './request-status-badge';

type Props = {
  nodeId: string;
  rows: QueueItem[];
  /** Filtres courants (« ?statut=… ») : repris par le détail pour ses flèches précédent / suivant. */
  query?: string;
  /** Pied de carte : pagination ou nombre de demandes. */
  footer?: React.ReactNode;
};

/** « Germaine Faye » → « G. Faye » (colonne « Suivie par »). */
export const shortName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const first = parts[0];
  // « Abbé Robert Sagna » garde son titre : « Abbé R. Sagna ».
  if (/^(abbé|père|mgr|sœur|frère|don)$/i.test(first) && parts.length > 2) return `${first} ${parts[1][0]}. ${last}`;
  return `${first[0]}. ${last}`;
};

const RowCheck = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  // Label englobant de 44 px : la case de 20 px garde une cible confortable (A11Y-13).
  <Choice
    checked={checked}
    onChange={onChange}
    label={<span className="sr-only">{label}</span>}
    className="-m-3 size-11 items-center justify-center gap-0 p-3"
  />
);

const toolbarButton =
  'hit inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-10 border border-line-active bg-paper px-3 text-14 font-semibold text-tint-800 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-ink-4';

/** Tableau de la file (maquette PAR-Demandes), avec sélection et action groupée « Passer en vérification ». */
export const QueueTable = ({ nodeId, rows, query = '', footer }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const transition = useTransitionRequest(nodeId);
  const visible = rows.filter((r) => selected.has(r.id));
  // L'action groupée ne vise que les demandes pour lesquelles la transition est permise.
  const eligible = visible.filter((r) => allowedTransitions(r.status).includes('start-verification'));
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startVerification = async () => {
    const results = await Promise.allSettled(
      eligible.map((r) => transition.mutateAsync({ id: r.id, transition: 'start-verification', body: { message: '', pickup_hours: '' } })),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    if (ok) toast.ok(ok > 1 ? `${ok} demandes passées en vérification.` : 'Demande passée en vérification.');
    if (ok < results.length) toast.err(`${results.length - ok} demande(s) n’ont pas pu changer de statut.`);
    setSelected(new Set());
  };

  return (
    <div className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      {visible.length > 0 && (
        <div
          role="toolbar"
          aria-label="Actions sur la sélection"
          className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line-active bg-tint-50 px-5 py-2"
        >
          <span className="tnum text-14 font-semibold text-tint-800">
            {visible.length > 1 ? `${visible.length} demandes sélectionnées` : '1 demande sélectionnée'}
          </span>
          {eligible.length > 0 && (
            <>
              <span aria-hidden="true" className="h-5 w-px bg-line-active" />
              <button type="button" className={toolbarButton} onClick={startVerification} disabled={transition.isPending}>
                Passer en vérification{eligible.length < visible.length ? ` (${eligible.length})` : ''}
              </button>
            </>
          )}
          <span className="flex-1" />
          <button type="button" className="hit text-14 font-semibold text-tint-800 hover:underline" onClick={() => setSelected(new Set())}>
            Tout désélectionner
          </button>
        </div>
      )}
      <table className="w-full table-fixed border-collapse text-14 text-ink">
        <caption className="sr-only">Demandes d’actes de la paroisse</caption>
        <thead>
          <tr className="h-10 bg-surface text-left text-13 font-medium text-ink-3">
            <th scope="col" className="w-[52px] pl-5">
              <RowCheck
                label="Tout sélectionner"
                checked={allChecked}
                onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
              />
            </th>
            <th scope="col" className="hidden w-[176px] pr-4 font-medium md:table-cell">
              Référence
            </th>
            <th scope="col" className="pr-4 font-medium">
              Acte demandé
            </th>
            <th scope="col" className="hidden w-[184px] pr-4 font-medium md:table-cell">
              Statut
            </th>
            <th scope="col" className="hidden w-[148px] pr-4 font-medium lg:table-cell">
              Suivie par
            </th>
            <th scope="col" aria-sort="descending" className="hidden w-[88px] pr-4 font-semibold text-ink sm:table-cell">
              Reçue le
            </th>
            <th scope="col" className="w-[68px] pr-5 text-right font-medium">
              Âge
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const href = `${paths.espace.demandes.detail.getHref(nodeId, r.id)}${query}`;
            const checked = selected.has(r.id);
            return (
              <tr key={r.id} aria-selected={checked || undefined} className={cn('border-t border-line', checked ? 'bg-tint-50' : 'hover:bg-surface')}>
                <td className="py-2 pl-5 align-middle">
                  <RowCheck
                    label={`Sélectionner ${r.reference}${r.is_overdue ? ', en retard' : ''}`}
                    checked={checked}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="tnum hidden truncate py-2 pr-4 align-middle text-ink-2 md:table-cell">
                  <NextLink href={href} className="text-ink-2 hover:text-primary-strong hover:underline">
                    {r.reference}
                  </NextLink>
                </td>
                <td className="min-h-15 py-2 pr-4 align-middle">
                  <NextLink href={href} className="block truncate text-15 font-semibold text-ink hover:text-primary">
                    {r.document_type_label}
                  </NextLink>
                  <span className="block truncate text-13 text-ink-3">
                    {r.requester_name} · pour {reasonText(r).toLowerCase()}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                    <span className="tnum text-13 text-ink-2">{r.reference}</span>
                    <RequestStatusBadge status={r.status} />
                  </span>
                </td>
                <td className="hidden py-2 pr-4 align-middle md:table-cell">
                  <RequestStatusBadge status={r.status} />
                </td>
                <td className="hidden py-2 pr-4 align-middle lg:table-cell">
                  {r.assigned_to_id ? (
                    <span className="inline-flex max-w-full items-center gap-2 whitespace-nowrap text-ink-2" title={r.assigned_to_name ?? undefined}>
                      <Avatar name={r.assigned_to_name || 'Équipe'} size={24} />
                      <span className="truncate">{r.assigned_to_name ? shortName(r.assigned_to_name) : 'Assignée'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-ink-3">
                      <span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-dashed border-line-field" />
                      Non attribuée
                    </span>
                  )}
                </td>
                <td className="tnum hidden whitespace-nowrap py-2 pr-4 align-middle text-ink-2 sm:table-cell">
                  {dayjs(r.created_at).format('D MMM')}
                </td>
                <td className="tnum whitespace-nowrap py-2 pr-5 text-right align-middle">
                  {r.age_days === null ? (
                    <span className="text-ink-4" aria-label="Sans objet">
                      —
                    </span>
                  ) : r.is_overdue ? (
                    <span className="inline-flex items-center justify-end gap-1.5 font-semibold text-warn" title="En retard">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-warn-dot" />
                      {r.age_days}&nbsp;j<span className="sr-only">, en retard</span>
                    </span>
                  ) : (
                    <span className="text-ink-2">{r.age_days}&nbsp;j</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {footer && <div className="flex min-h-14 items-center border-t border-line px-5 py-2.5 text-14 text-ink-2">{footer}</div>}
    </div>
  );
};
