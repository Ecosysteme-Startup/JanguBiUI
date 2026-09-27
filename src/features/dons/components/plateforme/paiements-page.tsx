'use client';

import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { dayjs, fromNow, hour } from '@/utils/dates';

import { usePaymentsHealth } from '../../api/platform';
import type { Health } from '../../types/schemas';

import { CollectionCard } from './collection-card';
import { IncidentsCard } from './incidents-card';
import { InfoRow } from './info-row';
import { WEBHOOK_ROWS } from './payment-labels';

const NBSP = ' ';

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong className="tnum text-15 font-semibold text-ink">{children}</strong>
);

/** « lun. 28 sept., 8 h 56 » */
const stamp = (iso: string) =>
  `${dayjs(iso).format('ddd D MMM')}, ${hour(iso)}`.replace(/ /g, NBSP);

/** Agrégateur configuré et dernière notification reçue. */
const ProviderCard = ({ health }: { health: Health }) => {
  const last = health.last_webhook_at;
  const fresh = last !== null && dayjs().diff(last, 'minute') < 60;
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="pa-agr"
      className="px-6 py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-12 bg-tint-50 text-primary-strong">
            <Icon name="carte-bancaire" size={20} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 id="pa-agr" className="m-0 text-20 font-semibold">
              {health.provider}
            </h2>
            <span className="text-14 text-ink-2">
              Agrégateur de paiement configuré sur la plateforme
            </span>
          </div>
        </div>
        {last ? (
          <Badge tone={fresh ? 'ok' : 'warn'} dot>
            Dernière notification {fromNow(last)}
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Aucune notification reçue
          </Badge>
        )}
      </div>
      <dl className="m-0 mt-4 grid gap-x-8 sm:grid-cols-2">
        <InfoRow label="Dernière notification" last>
          {last ? (
            <span className="tnum text-15 text-ink">{stamp(last)}</span>
          ) : (
            '—'
          )}
        </InfoRow>
        <InfoRow label="En échec sur 24 h" last>
          <Strong>{health.webhooks_failed_24h}</Strong>
        </InfoRow>
      </dl>
    </Card>
  );
};

/** Notifications (webhooks) : reçues et réparties par statut, sur 24 h et 7 jours. */
const NotificationsCard = ({ health }: { health: Health }) => {
  const byStatus = health.webhooks_7d_by_status;
  const received7d = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const rows = [
    ...WEBHOOK_ROWS,
    ...(byStatus.recu
      ? [{ status: 'recu', label: 'En cours de traitement', alert: false }]
      : []),
  ];
  const cell = 'py-2.5 text-right text-15';
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="pa-notif"
      className="px-6 pb-6 pt-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="pa-notif" className="m-0 text-20 font-semibold">
          Notifications de l’agrégateur
        </h2>
        <span className="text-13 text-ink-3">Webhooks reçus par Jàngu Bi</span>
      </div>
      <table className="tnum mt-4 w-full max-w-md border-collapse text-14">
        <caption className="sr-only">
          Notifications sur 24 heures et 7 jours
        </caption>
        <thead>
          <tr className="text-13 text-ink-3">
            <td className="pb-2" />
            <th scope="col" className="w-14 pb-2 text-right font-normal">
              24{NBSP}h
            </th>
            <th scope="col" className="w-16 pb-2 text-right font-normal">
              7{NBSP}jours
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            <th scope="row" className="py-2.5 text-left font-normal text-ink-2">
              Reçues
            </th>
            <td className={cn(cell, 'font-semibold')}>{health.webhooks_24h}</td>
            <td className={cn(cell, 'font-semibold')}>{received7d}</td>
          </tr>
          {rows.map((r) => {
            const value = byStatus[r.status] ?? 0;
            return (
              <tr key={r.status} className="border-t border-line">
                <th
                  scope="row"
                  className="py-2.5 text-left font-normal text-ink-2"
                >
                  {r.label}
                </th>
                <td className={cn(cell, 'text-ink-3')}>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">non détaillé</span>
                </td>
                <td
                  className={cn(
                    cell,
                    r.alert && value > 0 && 'font-semibold text-warn',
                  )}
                >
                  {value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="m-0 mt-3 text-13 text-ink-3">
        Sur 24{NBSP}h, {health.webhooks_failed_24h} en échec (signature rejetée
        ou erreur de traitement).
      </p>
    </Card>
  );
};

type Todo = { label: string; count: number; detail: string; dot: string };

/** « À traiter » : paiements en attente, reversements à rapprocher, écarts. */
const ToHandleCard = ({ health }: { health: Health }) => {
  const hours = health.oldest_pending_at
    ? dayjs().diff(health.oldest_pending_at, 'hour')
    : null;
  const items: Todo[] = [
    {
      label: 'Paiements en attente',
      count: health.pending_payments,
      detail:
        hours === null
          ? 'Aucun paiement en attente'
          : hours < 1
            ? 'Le plus ancien depuis moins d’une heure'
            : `Le plus ancien depuis ${hours}${NBSP}h`,
      dot: 'bg-warn-dot',
    },
    {
      label:
        health.payouts_to_reconcile > 1
          ? 'Reversements à rapprocher'
          : 'Reversement à rapprocher',
      count: health.payouts_to_reconcile,
      detail: health.payouts_to_reconcile
        ? 'Reçus de l’agrégateur, pas encore rapprochés'
        : 'Aucun',
      dot: 'bg-primary-fill',
    },
    {
      label:
        health.payouts_with_discrepancy > 1
          ? 'Écarts de reversement'
          : 'Écart de reversement',
      count: health.payouts_with_discrepancy,
      detail: health.payouts_with_discrepancy
        ? 'À examiner avec l’économe diocésain'
        : 'Aucun',
      dot: 'bg-warn-dot',
    },
  ];
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="pa-trait"
      className="px-6 py-5"
    >
      <h2 id="pa-trait" className="m-0 text-18 font-semibold leading-[26px]">
        À traiter
      </h2>
      <ul className="m-0 mt-3 list-none p-0">
        {items.map((it, i) => (
          <li
            key={it.label}
            className={cn(
              'flex gap-2.5 border-t border-line',
              i === items.length - 1 ? 'pt-3' : 'py-3',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-[7px] size-2 shrink-0 rounded-full',
                it.count > 0 ? it.dot : 'bg-ok-dot',
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex justify-between gap-2 text-14 font-semibold">
                <span>{it.label}</span>
                <span className="tnum text-15">{it.count}</span>
              </span>
              <span className="text-13 text-ink-3">{it.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

/**
 * Paiements (WEB-PLA-Paiements, plateforme.admin) : santé de la liaison avec l'agrégateur.
 * Aucun nom ni montant par donateur à ce niveau.
 */
export const PaiementsPage = () => {
  const health = usePaymentsHealth();
  return (
    <div>
      <PageHeader
        compact
        title="Paiements"
        description={`Liaison avec l’agrégateur de paiement.${health.isSuccess ? ` Mis à jour à ${hour(health.dataUpdatedAt).replace(/ /g, NBSP)}.` : ''}`}
      />
      {health.isPending ? (
        <Card className="mt-8">
          <LoadingBlock label="Chargement de l’état des paiements…" lines={4} />
        </Card>
      ) : health.isError ? (
        <Card className="mt-8">
          <EmptyState
            tone="err"
            icon="alerte"
            title="L’état des paiements n’a pas pu être chargé"
          >
            {health.error.message}
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-6">
              <ProviderCard health={health.data} />
              <NotificationsCard health={health.data} />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <ToHandleCard health={health.data} />
              <CollectionCard />
            </div>
          </div>
          <IncidentsCard incidents={health.data.incidents} />
        </>
      )}
    </div>
  );
};
