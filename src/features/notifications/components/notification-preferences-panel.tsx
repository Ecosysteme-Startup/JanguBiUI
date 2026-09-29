'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import {
  QUIET_DEFAULT,
  QUIET_NONE,
  isQuietEnabled,
  quietHour,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notification-preferences';
import { ofParish } from '@/utils/parish-name';

const Row = ({ children }: { children: React.ReactNode }) => <li className="border-t border-line py-3 last:pb-0">{children}</li>;

/** « Me prévenir pour » (FID-Notifications, colonne de droite) : sujets, silence, canaux. */
export const NotificationPreferencesPanel = () => {
  const { data: me } = useMe();
  const { data: prefs, isPending, isError } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences({ onError: () => toast.err('La préférence n’a pas pu être enregistrée.') });
  const paroisse = me?.paroisse_suivie?.name;

  return (
    <aside aria-labelledby="nt-pref" className="flex min-w-0 flex-col gap-4">
      <div className="rounded-16 border border-line bg-surface p-6">
        <h2 id="nt-pref" className="m-0 text-18 font-semibold text-ink">
          Me prévenir pour
        </h2>
        <p className="m-0 mt-1 text-14 text-ink-2">
          Le suivi de vos demandes et vos rendez-vous de confession vous sont toujours signalés, selon les canaux choisis.
        </p>
        {isPending ? (
          <div className="mt-4">
            <LoadingBlock label="Chargement des préférences…" lines={3} />
          </div>
        ) : isError ? (
          <p className="m-0 mt-4 text-14 text-ink-2">Vos préférences n’ont pas pu être chargées.</p>
        ) : (
          <ul className="m-0 mt-4 flex list-none flex-col p-0">
            <Row>
              <Switch
                label={paroisse ? `Annonces ${ofParish(paroisse)}` : 'Annonces de ma paroisse'}
                checked={prefs.topic_annonces}
                onCheckedChange={(v) => update.mutate({ topic_annonces: v })}
              />
            </Row>
            <Row>
              <Switch label="Agenda et événements" checked={prefs.topic_evenements} onCheckedChange={(v) => update.mutate({ topic_evenements: v })} />
            </Row>
            <Row>
              <Switch
                label={isQuietEnabled(prefs) ? `Silence de ${quietHour(prefs.quiet_start)} à ${quietHour(prefs.quiet_end)}` : 'Silence la nuit'}
                description="Les e-mails attendent la fin de la plage."
                checked={isQuietEnabled(prefs)}
                onCheckedChange={(v) => update.mutate(v ? QUIET_DEFAULT : QUIET_NONE)}
              />
            </Row>
            <Row>
              <Switch label="Dans l’application" checked={prefs.in_app} onCheckedChange={(v) => update.mutate({ in_app: v })} />
            </Row>
            <Row>
              <Switch label="Aussi par e-mail" checked={prefs.email} onCheckedChange={(v) => update.mutate({ email: v })} />
            </Row>
          </ul>
        )}
      </div>
      <p className="m-0 flex items-start gap-2 px-2 text-13 text-ink-3">
        <Icon name="cadenas" size={16} className="mt-px shrink-0" />
        Le contenu de vos conversations n’apparaît jamais dans une notification. Messages chiffrés, aucun administrateur n’y a accès.
      </p>
      <NextLink href={paths.app.profil.getHref()} className="hit inline-flex items-center gap-2 px-2 text-15 font-medium">
        <Icon name="reglages" size={18} />
        Tous les réglages de notifications
      </NextLink>
    </aside>
  );
};
