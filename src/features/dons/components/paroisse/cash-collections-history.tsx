'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { useCashCollections, useRejectCashCollection, useValidateCashCollection } from '../../api/cash-collections';
import type { CashCollection } from '../../types/schemas';
import { fcfa } from '../../utils/format';

import { DataTable, DTd, DTh, Panel, PanelTitle, QueryFailure } from './parts';
import { dayMonthAtTime } from './period';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « Dim. 20 sept. » */
const massDay = (date: string) => capitalize(dayjs(date).format('ddd D MMM'));
/** « Messe du 20 septembre, Messe de 18 h 30 » (noms accessibles des actions). */
const describe = (c: CashCollection) => `${c.mass_label}, ${dayjs(c.mass_date).format('D MMMM')}`;

const Status = ({ c }: { c: CashCollection }) => {
  if (c.status === 'validee')
    return (
      <span className="flex flex-col items-start gap-1">
        <Badge tone="ok" dot>
          Validée
        </Badge>
        {c.validated_by && <span className="text-13 text-ink-3">par {c.validated_by}</span>}
      </span>
    );
  if (c.status === 'rejetee')
    return (
      <span className="flex flex-col items-start gap-1">
        <Badge tone="err" dot>
          Rejetée
        </Badge>
        {c.rejection_reason && <span className="text-13 text-ink-3">{c.rejection_reason}</span>}
      </span>
    );
  const days = c.created_at ? dayjs().startOf('day').diff(dayjs(c.created_at).startOf('day'), 'day') : 0;
  return (
    <span className="flex flex-col items-start gap-1">
      <Badge tone="warn" dot>
        À valider
      </Badge>
      {days > 0 && <span className="text-13 text-ink-3">Depuis {plural(days, 'jour', 'jours')}</span>}
    </span>
  );
};

type Filter = 'toutes' | 'saisie';

/** « Saisies récentes » (WEB-PAR-Quete-Saisie) : validation ou rejet motivé, par une autre personne. */
export const CashCollectionsHistory = ({ nodeId }: { nodeId: string }) => {
  const [filter, setFilter] = useState<Filter>('toutes');
  const list = useCashCollections(nodeId, filter === 'saisie' ? { status: 'saisie' } : {});
  const pending = useCashCollections(nodeId, { status: 'saisie' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<CashCollection | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const validate = useValidateCashCollection(nodeId, { onSuccess: () => toast.ok('Saisie validée.') });
  const reject = useRejectCashCollection(nodeId, {
    onSuccess: () => {
      toast.ok('Saisie rejetée.');
      closeReject();
    },
  });

  function closeReject() {
    setRejecting(null);
    setReason('');
    setReasonError(null);
    reject.reset();
  }

  const onValidate = (c: CashCollection) => {
    setActionError(null);
    validate.mutate(c.id, { onError: (e) => setActionError(apiErrorMessage(e)) });
  };

  const onReject = () => {
    if (!rejecting) return;
    if (!reason.trim()) {
      setReasonError('Indiquez le motif du rejet.');
      return;
    }
    setActionError(null);
    reject.mutate({ id: rejecting.id, body: { reason: reason.trim() } });
  };

  const pendingCount = pending.data?.count ?? 0;

  return (
    <Panel labelledBy="quete-t-hist" className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <PanelTitle id="quete-t-hist">Saisies récentes</PanelTitle>
          {pendingCount > 0 && (
            <span className="inline-flex h-5.5 items-center rounded-full bg-warn-bg px-2 text-12 font-semibold text-warn">
              {pendingCount} à valider
            </span>
          )}
        </div>
        <SegmentedControl<Filter>
          label="Filtrer les saisies"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            ['toutes', 'Toutes les saisies'],
            ['saisie', 'À valider'],
          ]}
        />
      </div>
      {actionError && (
        <div className="px-6 pb-4">
          <Notice tone="err" role="alert" title="Action refusée">
            {actionError}
          </Notice>
        </div>
      )}
      {list.isPending ? (
        <div className="border-t border-line px-6 py-6">
          <LoadingBlock label="Chargement des saisies…" />
        </div>
      ) : list.isError ? (
        <div className="border-t border-line">
          <QueryFailure error={list.error} nodeId={nodeId} what="Saisies de quêtes" />
        </div>
      ) : list.data.results.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState icon="especes" title={filter === 'saisie' ? 'Aucune saisie à valider' : 'Aucune saisie pour le moment'}>
            Les quêtes en espèces saisies messe par messe apparaîtront ici.
          </EmptyState>
        </div>
      ) : (
        <DataTable label="Saisies récentes">
          <thead>
            <tr>
              <DTh className="w-[150px]">Messe</DTh>
              <DTh>Fonds</DTh>
              <DTh align="right" className="w-[124px]">
                Montant
              </DTh>
              <DTh className="w-[136px]">Compteurs</DTh>
              <DTh className="w-[140px]">Saisie par</DTh>
              <DTh className="w-[180px]">Statut</DTh>
              <DTh align="right" className="w-[150px]">
                Action
              </DTh>
            </tr>
          </thead>
          <tbody>
            {list.data.results.map((c) => (
              <tr key={c.id} className={c.status === 'saisie' ? 'bg-surface' : 'hover:bg-surface'}>
                <DTd className="h-15">
                  <span className="flex flex-col">
                    <span className="tnum whitespace-nowrap font-semibold">{massDay(c.mass_date)}</span>
                    <span className="text-13 text-ink-3">
                      {c.mass_label}
                      {c.place ? ` · ${c.place}` : ''}
                    </span>
                  </span>
                </DTd>
                <DTd>{c.fund.title}</DTd>
                <DTd align="right" className="tnum whitespace-nowrap font-semibold">
                  {fcfa(c.amount)}
                </DTd>
                <DTd className="text-13 text-ink-2">
                  <span className="flex flex-col">
                    <span>{c.counter_one}</span>
                    <span>{c.counter_two}</span>
                  </span>
                </DTd>
                <DTd className="text-13 text-ink-2">
                  <span className="flex flex-col">
                    <span>{c.entered_by}</span>
                    {c.created_at && <span className="tnum text-ink-3">{dayMonthAtTime(c.created_at)}</span>}
                  </span>
                </DTd>
                <DTd>
                  <Status c={c} />
                </DTd>
                <DTd align="right">
                  {c.status === 'saisie' && (
                    <span className="inline-flex items-center gap-1">
                      <Button size="sm" loading={validate.isPending && validate.variables === c.id} onClick={() => onValidate(c)}>
                        Valider<span className="sr-only"> la saisie : {describe(c)}</span>
                      </Button>
                      <Menu>
                        <MenuTrigger className={iconButtonClasses({ size: 'sm' })} aria-label={`Autres actions : ${describe(c)}`}>
                          <Icon name="plus-horizontal" size={18} />
                        </MenuTrigger>
                        <MenuContent align="end">
                          <MenuItem icon="x" tone="danger" onSelect={() => setRejecting(c)}>
                            Rejeter la saisie
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </span>
                  )}
                </DTd>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <p className="m-0 flex items-center gap-2 border-t border-line px-6 py-3.5 text-13 text-ink-3">
        <Icon name="info" size={16} className="shrink-0" />
        Vous ne pouvez pas valider une saisie que vous avez faite. Chaque validation est inscrite au journal d’audit.
      </p>

      <Modal
        open={rejecting !== null}
        onOpenChange={(open) => !open && closeReject()}
        title="Rejeter la saisie"
        description={rejecting ? `${describe(rejecting)} · ${fcfa(rejecting.amount)}. La saisie rejetée pourra être saisie à nouveau.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={closeReject}>
              Annuler
            </Button>
            <Button variant="danger" loading={reject.isPending} onClick={onReject}>
              Rejeter
            </Button>
          </>
        }
      >
        <Field
          id="quete-rejet-motif"
          label="Motif du rejet"
          required
          hint="Visible de la personne qui a saisi la quête."
          error={reasonError ?? (reject.isError ? apiErrorMessage(reject.error) : undefined)}
        >
          <Textarea
            controlSize="sm"
            value={reason}
            maxLength={300}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(null);
            }}
          />
        </Field>
      </Modal>
    </Panel>
  );
};
