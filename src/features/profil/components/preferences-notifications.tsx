'use client';

import { Switch } from '@/components/ui/form/switch';
import { Skeleton } from '@/components/ui/skeleton';

import {
  type NotificationPreferences,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../api/notification-preferences';

type Cle = keyof Pick<
  NotificationPreferences,
  'in_app' | 'email' | 'push' | 'topic_annonces' | 'topic_evenements'
>;

const LIGNES: { cle: Cle; titre: string; detail: string }[] = [
  {
    cle: 'topic_annonces',
    titre: 'Annonces de ma paroisse',
    detail: 'Les annonces publiées par votre paroisse principale.',
  },
  {
    cle: 'topic_evenements',
    titre: 'Rappels d’événements',
    detail: 'La veille d’un événement auquel vous êtes inscrit.',
  },
  {
    cle: 'push',
    titre: 'Sur le téléphone',
    detail: 'Notifications de l’application mobile.',
  },
  {
    cle: 'email',
    titre: 'Par e-mail',
    detail: 'Un courriel pour les notifications importantes.',
  },
  {
    cle: 'in_app',
    titre: 'Dans l’application',
    detail: 'La cloche de notifications.',
  },
];

const heure = (hms: string) => hms.slice(0, 5);

export function PreferencesNotifications() {
  const { data, isLoading, isError } = useNotificationPreferences();
  const modifier = useUpdateNotificationPreferences();

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Vos préférences n’ont pas pu être chargées.
      </p>
    );
  }

  const changer = (patch: Partial<NotificationPreferences>) =>
    modifier.mutate({ ...data, ...patch });

  return (
    <div className="space-y-4">
      {LIGNES.map(({ cle, titre, detail }) => (
        <div
          key={cle}
          className="flex items-start justify-between gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0"
        >
          <div className="min-w-0">
            <label
              htmlFor={`notif-${cle}`}
              className="text-sm font-medium text-foreground"
            >
              {titre}
            </label>
            <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">
              {detail}
            </p>
          </div>
          <Switch
            id={`notif-${cle}`}
            checked={data[cle]}
            disabled={modifier.isPending}
            onCheckedChange={(v) => changer({ [cle]: v })}
            className="mt-0.5"
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
        <span>Heures calmes, de</span>
        <input
          type="time"
          aria-label="Début des heures calmes"
          value={heure(data.quiet_start)}
          onChange={(e) => changer({ quiet_start: `${e.target.value}:00` })}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
        <span>à</span>
        <input
          type="time"
          aria-label="Fin des heures calmes"
          value={heure(data.quiet_end)}
          onChange={(e) => changer({ quiet_end: `${e.target.value}:00` })}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}
