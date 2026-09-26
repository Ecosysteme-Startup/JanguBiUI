'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useSocket } from '@/hooks/use-socket';

import {
  type AppNotification,
  notificationsQueryOptions,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../api/get-notifications';
import { dayGroupOf, describeNotification, type NotificationCategory } from '../utils/describe';

import { NotificationPreferencesPanel } from './notification-preferences-panel';
import { NotificationRow } from './notification-row';

type Filter = 'toutes' | 'non-lues' | Exclude<NotificationCategory, 'autre'>;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'non-lues', label: 'Non lues' },
  { key: 'demandes', label: 'Demandes' },
  { key: 'pretres', label: 'Messages' },
  { key: 'annonces', label: 'Paroisse' },
  { key: 'confession', label: 'Confession' },
];

const matches = (n: AppNotification, filter: Filter) => {
  if (filter === 'toutes') return true;
  if (filter === 'non-lues') return !n.is_read;
  return describeNotification(n).category === filter;
};

const unreadLabel = (count: number) => `${count} non lue${count > 1 ? 's' : ''}`;

/** Notifications (FID-Notifications) : liste filtrable par jour, marquage lu, temps réel, préférences. */
export const NotificationsCenter = () => {
  const [filter, setFilter] = useState<Filter>('toutes');
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const onSocketMessage = useCallback(
    (frame: unknown) => {
      if (frame && typeof frame === 'object' && (frame as { type?: unknown }).type === 'notification') {
        void queryClient.invalidateQueries({ queryKey: notificationsQueryOptions().queryKey });
      }
    },
    [queryClient],
  );
  const socket = useSocket('/ws/notifications/', onSocketMessage);

  const items = data ?? [];
  const unread = items.filter((n) => !n.is_read).length;
  const shown = items.filter((n) => matches(n, filter));
  const groups = shown.reduce<{ label: string; items: AppNotification[] }[]>((acc, n) => {
    const label = dayGroupOf(n.created_at);
    const last = acc.at(-1);
    if (last?.label === label) return [...acc.slice(0, -1), { label, items: [...last.items, n] }];
    return [...acc, { label, items: [n] }];
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">Notifications</h1>
          <p className="m-0 mt-2 text-16 text-ink-2" aria-live="polite">
            {data ? (unread === 0 ? 'Tout est lu.' : `${unreadLabel(unread)}.`) : '\u00a0'}
          </p>
        </div>
        <Button variant="outline" className="h-11 self-start sm:self-auto" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
          <Icon name="check-double" size={18} />
          Tout marquer comme lu
        </Button>
      </div>
      {socket.status === 'offline' && (
        <p role="status" className="m-0 mt-4 flex items-center gap-3 text-14 text-ink-2">
          Mises à jour en direct interrompues.
          <Button variant="ghost" size="sm" onClick={socket.retry}>
            Réessayer
          </Button>
        </p>
      )}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        <section aria-label="Liste des notifications" className="min-w-0">
          <ChipGroup label="Filtrer les notifications">
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                pressed={filter === f.key}
                count={f.key === 'non-lues' ? unread : items.filter((n) => matches(n, f.key)).length}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Chip>
            ))}
          </ChipGroup>
          {isPending ? (
            <div className="mt-6">
              <LoadingBlock label="Chargement des notifications…" lines={5} />
            </div>
          ) : isError ? (
            <EmptyState
              tone="err"
              className="mt-6"
              title="Vos notifications n’ont pas pu être chargées."
              action={
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                  Réessayer
                </Button>
              }
            />
          ) : shown.length === 0 ? (
            <EmptyState icon="cloche" className="mt-6" title={items.length === 0 ? 'Aucune notification.' : 'Rien dans ce filtre.'}>
              {items.length === 0 && 'Les réponses des prêtres, le suivi de vos demandes et les annonces de votre paroisse arriveront ici.'}
            </EmptyState>
          ) : (
            groups.map((group, index) => {
              const groupUnread = group.items.filter((n) => !n.is_read).length;
              const headingId = `nt-groupe-${index}`;
              return (
                <section key={group.label} aria-labelledby={headingId} className="mt-6">
                  <div className="flex items-baseline justify-between gap-4 px-1">
                    <h2 id={headingId} className="m-0 text-15 font-semibold text-ink-2">
                      {group.label}
                    </h2>
                    {groupUnread > 0 && <span className="text-13 text-ink-3">{unreadLabel(groupUnread)}</span>}
                  </div>
                  <ul className="m-0 mt-2 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card">
                    {group.items.map((item, i) => (
                      <NotificationRow key={item.id} item={item} first={i === 0} onRead={(id) => markRead.mutate(id)} />
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </section>
        <NotificationPreferencesPanel />
      </div>
    </div>
  );
};
