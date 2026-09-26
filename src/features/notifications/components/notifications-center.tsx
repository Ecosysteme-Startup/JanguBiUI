'use client';

import { useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import {
  type AppNotification,
  notificationsQueryOptions,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../api/get-notifications';
import { dayGroupOf, describeNotification, type NotificationCategory } from '../utils/describe';

import { NotificationPreferencesPanel } from './notification-preferences-panel';

type Filter = 'toutes' | 'non-lues' | Exclude<NotificationCategory, 'autre'>;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'non-lues', label: 'Non lues' },
  { key: 'demandes', label: 'Mes demandes' },
  { key: 'annonces', label: 'Annonces' },
  { key: 'pretres', label: 'Prêtres' },
  { key: 'confession', label: 'Confession' },
];

const matches = (n: AppNotification, filter: Filter) => {
  if (filter === 'toutes') return true;
  if (filter === 'non-lues') return !n.is_read;
  return describeNotification(n).category === filter;
};

const timeOf = (createdAt: string) => {
  const d = dayjs(createdAt);
  return dayjs().diff(d, 'day') >= 2 ? d.format('ddd DD.MM') : hour(createdAt);
};

const NotificationItem = ({ item, onOpen }: { item: AppNotification; onOpen: (id: string) => void }) => {
  const view = describeNotification(item);
  const content = (
    <>
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-base text-ink', !item.is_read && 'font-semibold')}>{frenchTypo(view.title)}</span>
        {view.detail && <span className="mt-0.5 text-sm text-ink-2">{frenchTypo(view.detail)}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="tnum text-meta text-ink-3">{timeOf(item.created_at)}</span>
        {!item.is_read && <span aria-label="Non lue" role="img" className="size-2 rounded-full bg-primary" />}
      </span>
    </>
  );
  const cls = 'flex items-start justify-between gap-4 py-4 text-ink';
  return (
    <li className="border-b border-line">
      {view.href ? (
        <NextLink href={view.href} className={cn(cls, 'hover:text-primary')} onClick={() => !item.is_read && onOpen(item.id)}>
          {content}
        </NextLink>
      ) : (
        <button type="button" className={cn(cls, 'w-full text-left')} onClick={() => !item.is_read && onOpen(item.id)}>
          {content}
        </button>
      )}
    </li>
  );
};

/** Notifications (FID-Notifications) : liste filtrable, marquage lu, temps réel. */
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
    <div className="mx-auto max-w-[1180px]">
      <NextLink href={paths.app.root.getHref()} className="hidden min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-primary lg:inline-flex">
        <Icon name="fleche-gauche" size={16} />
        Retour · Accueil
      </NextLink>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 lg:mt-6">
        <div>
          <p className="tnum m-0 text-meta text-ink-3" aria-live="polite">
            Mon espace · {unread} non lue{unread > 1 ? 's' : ''}
          </p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">Notifications</h1>
        </div>
        <Button variant="secondary" size="sm" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
          Tout marquer comme lu
        </Button>
      </div>
      {socket.status === 'offline' && (
        <p role="status" className="m-0 mt-4 flex items-center gap-3 text-sm text-ink-2">
          Mises à jour en direct interrompues.
          <Button variant="tertiary" size="sm" onClick={socket.retry}>
            Réessayer
          </Button>
        </p>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-6">
        <section aria-label="Liste des notifications" className="lg:col-span-8">
          <ChipGroup label="Filtrer les notifications">
            {FILTERS.map((f) => (
              <Chip key={f.key} pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
                {f.key === 'toutes' && ` · ${items.length}`}
                {f.key === 'non-lues' && ` · ${unread}`}
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
            groups.map((group) => {
              const groupUnread = group.items.filter((n) => !n.is_read).length;
              return (
                <div key={group.label} className="mt-8">
                  <h2 className="tnum m-0 flex justify-between border-b border-line-strong pb-2 text-meta font-normal text-ink-2 first-letter:uppercase">
                    <span>{group.label}</span>
                    {groupUnread > 0 && (
                      <span className="text-primary">
                        {groupUnread} non lue{groupUnread > 1 ? 's' : ''}
                      </span>
                    )}
                  </h2>
                  <ul className="m-0 list-none p-0">
                    {group.items.map((item) => (
                      <NotificationItem key={item.id} item={item} onOpen={(id) => markRead.mutate(id)} />
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </section>
        <div className="lg:col-span-4">
          <NotificationPreferencesPanel />
        </div>
      </div>
    </div>
  );
};
