'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { Pagination } from '@/components/ui/pagination';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-errors';

import {
  OPERATIONS_PAGE_SIZE,
  type OperationsFilters,
  useOperations,
  useRefundDonation,
} from '../../api/operations';
import type { Operation } from '../../types/schemas';
import { DONATION_STATUS, fcfa, paymentMethodLabel } from '../../utils/format';
import { DonationStatusBadge } from '../shared/donation-status-badge';

import { DataTable, DTd, DTh, QueryFailure } from './parts';
import { dayMonthTime } from './period';

const OperationStatus = ({ op }: { op: Operation }) =>
  op.channel === 'especes' && op.status === 'confirme' ? (
    <Badge tone="ok" dot>
      Validée
    </Badge>
  ) : (
    <DonationStatusBadge status={op.status} />
  );

/** Donateur tel que le serveur l'expose (nom seulement avec dons.voir_donateurs). */
const Donor = ({ donor }: { donor: string }) => {
  if (donor === 'Quête en espèces')
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-2">
        <Icon name="especes" size={16} />
        {donor}
      </span>
    );
  if (donor === 'Anonyme')
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-3">
        <Icon name="oeil-barre" size={16} />
        {donor}
      </span>
    );
  if (donor === 'Donateur sans compte' || donor === 'Donateur')
    return <span className="text-ink-3">{donor}</span>;
  return <span>{donor}</span>;
};

const refundable = (op: Operation) =>
  op.channel === 'en_ligne' && op.status === 'confirme';

type Props = {
  nodeId: string;
  period: { date_from: string; date_to: string };
  status?: string;
  onClearStatus: () => void;
  canRefund: boolean;
};

/** « Dernières opérations » (WEB-PAR-Dons) : 10 lignes, remboursement réservé à dons.gerer_fonds. */
export const OperationsTable = ({
  nodeId,
  period,
  status,
  onClearStatus,
  canRefund,
}: Props) => {
  const [page, setPage] = useState(1);
  const filters: OperationsFilters = { ...period, status, page };
  const query = useOperations(nodeId, filters);
  const refund = useRefundDonation(nodeId);
  const [target, setTarget] = useState<Operation | null>(null);
  const [note, setNote] = useState('');

  const close = () => {
    setTarget(null);
    setNote('');
    refund.reset();
  };

  const confirmRefund = () => {
    if (!target) return;
    refund.mutate(
      { id: target.id, body: { note: note.trim() } },
      {
        onSuccess: () => {
          toast.ok(`Le don ${target.reference} est remboursé.`);
          close();
        },
      },
    );
  };

  const statusLabel = status
    ? (DONATION_STATUS[status as keyof typeof DONATION_STATUS]?.label ?? status)
    : null;

  return (
    <>
      {statusLabel && (
        <div className="flex items-center gap-2 px-6 pb-4">
          <span className="text-13 text-ink-3">Filtre&nbsp;:</span>
          <Chip
            pressed
            onClick={onClearStatus}
            aria-label={`Retirer le filtre ${statusLabel}`}
          >
            {statusLabel}
            <Icon name="x" size={14} />
          </Chip>
        </div>
      )}
      {query.isPending ? (
        <div className="border-t border-line px-6 py-6">
          <LoadingBlock label="Chargement des opérations…" />
        </div>
      ) : query.isError ? (
        <div className="border-t border-line">
          <QueryFailure error={query.error} nodeId={nodeId} what="Opérations" />
        </div>
      ) : query.data.results.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState icon="recu" title="Aucune opération sur la période">
            Les dons en ligne confirmés et les quêtes validées apparaîtront ici.
          </EmptyState>
        </div>
      ) : (
        <DataTable label="Dernières opérations">
          <thead>
            <tr>
              <DTh className="w-[112px]">Date</DTh>
              <DTh className="w-[144px]">Référence</DTh>
              <DTh>Fonds</DTh>
              <DTh align="right" className="w-[124px]">
                Montant
              </DTh>
              <DTh className="w-[124px]">Moyen</DTh>
              <DTh className="w-[124px]">Statut</DTh>
              <DTh className="w-[176px]">Donateur</DTh>
              {canRefund && (
                <DTh className="w-[56px]">
                  <span className="sr-only">Action</span>
                </DTh>
              )}
            </tr>
          </thead>
          <tbody>
            {query.data.results.map((op) => (
              <tr key={op.id} className="hover:bg-surface">
                <DTd className="tnum h-12 whitespace-nowrap text-ink-2">
                  {op.created_at ? dayMonthTime(op.created_at) : '—'}
                </DTd>
                <DTd className="tnum whitespace-nowrap text-ink-2">
                  {op.reference}
                </DTd>
                <DTd className="max-w-0 truncate">{op.fund.title}</DTd>
                <DTd
                  align="right"
                  className="tnum whitespace-nowrap font-semibold"
                >
                  {fcfa(op.amount)}
                </DTd>
                <DTd className="whitespace-nowrap text-ink-2">
                  {paymentMethodLabel(op.payment_method)}
                </DTd>
                <DTd>
                  <OperationStatus op={op} />
                </DTd>
                <DTd className="whitespace-nowrap">
                  <Donor donor={op.donor} />
                </DTd>
                {canRefund && (
                  <DTd align="right">
                    {refundable(op) && (
                      <Menu>
                        <MenuTrigger className={iconButtonClasses({ size: 'sm' })} aria-label={`Actions sur le don ${op.reference}`}>
                          <Icon name="plus-horizontal" size={18} />
                        </MenuTrigger>
                        <MenuContent align="end">
                          <MenuItem icon="rembourser" tone="danger" onSelect={() => setTarget(op)}>
                            Rembourser le don
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    )}
                  </DTd>
                )}
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5">
        <p className="m-0 flex items-center gap-2 text-13 text-ink-3">
          <Icon name="cadenas" size={16} className="shrink-0" />
          Les noms ne sont visibles que du curé et de l’économe. Un don anonyme
          reste anonyme pour tous.
        </p>
        {query.data && (
          <Pagination
            offset={(page - 1) * OPERATIONS_PAGE_SIZE}
            limit={OPERATIONS_PAGE_SIZE}
            total={query.data.count}
            onChange={(offset) => setPage(offset / OPERATIONS_PAGE_SIZE + 1)}
            noun="opérations"
            nounPosition="after"
            compact
          />
        )}
      </div>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && close()}
        title="Rembourser ce don ?"
        description={
          target
            ? `Le don ${target.reference} de ${fcfa(target.amount)} (${target.fund.title}) passera au statut « Remboursé ». Il n’est jamais réaffecté à un autre fonds.`
            : undefined
        }
        confirmLabel="Rembourser"
        tone="danger"
        pending={refund.isPending}
        onConfirm={confirmRefund}
      >
        <Field
          id="dons-remboursement-note"
          label="Motif"
          optional
          error={refund.isError ? apiErrorMessage(refund.error) : undefined}
        >
          <Textarea
            controlSize="sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
};
