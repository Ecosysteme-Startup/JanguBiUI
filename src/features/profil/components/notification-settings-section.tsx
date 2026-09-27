'use client';

import { Choice } from '@/components/ui/choice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import {
  QUIET_DEFAULT,
  QUIET_NONE,
  isQuietEnabled,
  quietHour,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notification-preferences';

import { SettingsCard } from './settings-card';

/** Notifications : sujets facultatifs, canaux, plage de silence (PUT /me/notification-preferences/). */
export const NotificationSettingsSection = () => {
  const { data: prefs, isPending, isError } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences({ onError: () => toast.err('La préférence n’a pas pu être enregistrée.') });

  return (
    <SettingsCard id="notifications" title="Notifications" description="Le contenu des messages n’est jamais affiché dans une notification.">
      {isPending ? (
        <LoadingBlock label="Chargement des préférences…" lines={3} />
      ) : isError ? (
        <p className="m-0 mt-5 text-14 text-ink-2">Vos préférences n’ont pas pu être chargées.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-3 p-0 text-16 font-semibold text-ink">Je veux être prévenu(e) pour</legend>
            <Switch label="Annonces de ma paroisse" checked={prefs.topic_annonces} onCheckedChange={(v) => update.mutate({ topic_annonces: v })} />
            <Switch label="Agenda et rappels d’événements" checked={prefs.topic_evenements} onCheckedChange={(v) => update.mutate({ topic_evenements: v })} />
            <p className="m-0 text-13 text-ink-3">Le suivi de vos demandes d’actes, les messages des prêtres et vos rendez-vous vous sont toujours signalés.</p>
          </fieldset>
          <fieldset className="m-0 flex flex-col gap-3 border-0 border-t border-line p-0 pt-4">
            <legend className="float-left mb-3 p-0 text-16 font-semibold text-ink">Canaux</legend>
            <Choice label="Dans l’application" checked={prefs.in_app} onChange={(e) => update.mutate({ in_app: e.target.checked })} />
            <Choice label="Par e-mail" checked={prefs.email} onChange={(e) => update.mutate({ email: e.target.checked })} />
          </fieldset>
          <div className="border-t border-line pt-4">
            <Switch
              label={isQuietEnabled(prefs) ? `Silence de ${quietHour(prefs.quiet_start)} à ${quietHour(prefs.quiet_end)}` : 'Silence la nuit'}
              description="Aucun e-mail la nuit : il part à la fin de la plage."
              checked={isQuietEnabled(prefs)}
              onCheckedChange={(v) => update.mutate(v ? QUIET_DEFAULT : QUIET_NONE)}
            />
          </div>
        </div>
      )}
    </SettingsCard>
  );
};
