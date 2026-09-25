'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { StatusDot } from '@/components/signature/status-dot';
import { Button } from '@/components/ui/button';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dotDate } from '@/utils/dates';

import { useTransitionRequest } from '../api/transition-request';
import type { QueueItem } from '../types/processing';
import { allowedTransitions } from '../utils/transitions';

/** Tableau de la file, avec sélection et action groupée « Passer en vérification ». */
export const QueueTable = ({ nodeId, rows }: { nodeId: string; rows: QueueItem[] }) => {
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
    <>
      {visible.length > 0 && (
        <div role="toolbar" aria-label="Actions sur la sélection" className="mb-3 flex flex-wrap items-center gap-4 rounded bg-surface-2 px-4 py-2">
          <span className="tnum text-sm text-ink">
            {visible.length} sélectionnée{visible.length > 1 ? 's' : ''}
          </span>
          {eligible.length > 0 && (
            <Button size="sm" onClick={startVerification} disabled={transition.isPending}>
              Passer en vérification{eligible.length < visible.length ? ` (${eligible.length})` : ''}
            </Button>
          )}
          <Button variant="tertiary" size="sm" onClick={() => setSelected(new Set())}>
            Tout désélectionner
          </Button>
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                aria-label="Tout sélectionner"
                checked={allChecked}
                onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                className="size-4"
              />
            </Th>
            <Th>Réf.</Th>
            <Th>Demandeur</Th>
            <Th className="hidden md:table-cell">Type d’acte</Th>
            <Th className="hidden sm:table-cell">Reçue</Th>
            <Th className="hidden sm:table-cell">Délai</Th>
            <Th>Statut</Th>
            <Th className="hidden lg:table-cell">Assignée</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const href = paths.espace.demandes.detail.getHref(nodeId, r.id);
            const checked = selected.has(r.id);
            return (
              <Tr key={r.id} selected={checked}>
                <Td>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(r.id)}
                    aria-label={`Sélectionner ${r.reference}${r.is_overdue ? ', en retard' : ''}`}
                    className="size-4"
                  />
                </Td>
                <Td className="tnum text-xs">
                  <NextLink href={href}>{r.reference}</NextLink>
                </Td>
                <Td>
                  <NextLink href={href} className="font-semibold text-ink hover:text-primary">
                    {r.requester_name}
                  </NextLink>
                </Td>
                <Td className="hidden text-ink-2 md:table-cell">{r.document_type_label}</Td>
                <Td className="tnum hidden text-xs sm:table-cell">{dotDate(r.created_at)}</Td>
                <Td className="tnum hidden text-xs sm:table-cell">
                  {r.age_days === null ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <span className={cn(r.is_overdue && 'font-semibold text-err')}>{r.age_days} j</span>
                  )}
                  {r.is_overdue && <span className="block text-meta text-err">En retard</span>}
                  {r.status === 'info_requested' && <span className="block text-meta text-ink-3">Suspendu</span>}
                </Td>
                <Td>
                  <StatusDot status={r.status} />
                </Td>
                <Td className={cn('hidden lg:table-cell', r.assigned_to_id ? 'text-ink' : 'text-ink-3')}>
                  {r.assigned_to_id ? 'Assignée' : 'À assigner'}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
};
