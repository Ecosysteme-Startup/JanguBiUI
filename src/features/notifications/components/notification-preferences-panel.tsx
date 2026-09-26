'use client';

import { Choice } from '@/components/ui/choice';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
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

/** Préférences (FID-Notifications, colonne de droite) : sujets, silence, canaux. */
export const NotificationPreferencesPanel = () => {
  const { data: me } = useMe();
  const { data: prefs, isPending, isError } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences({ onError: () => toast.err('La préférence n’a pas pu être enregistrée.') });
  const paroisse = me?.paroisse_suivie?.name;

  return (
    <aside aria-labelledby="nt-pref" className="flex flex-col gap-5 border border-line bg-surface p-6">
      <h2 id="nt-pref" className="m-0 font-serif text-h4 font-normal text-ink">
        Préférences
      </h2>
      {isPending ? (
        <LoadingBlock label="Chargement des préférences…" lines={3} />
      ) : isError ? (
        <p className="m-0 text-sm text-ink-2">Vos préférences n’ont pas pu être chargées.</p>
      ) : (
        <>
          <Switch
            label={paroisse ? `Annonces ${ofParish(paroisse)}` : 'Annonces de ma paroisse'}
            checked={prefs.topic_annonces}
            onCheckedChange={(v) => update.mutate({ topic_annonces: v })}
          />
          <Switch label="Agenda et événements" checked={prefs.topic_evenements} onCheckedChange={(v) => update.mutate({ topic_evenements: v })} />
          <Switch
            label={isQuietEnabled(prefs) ? `Silence de ${quietHour(prefs.quiet_start)} à ${quietHour(prefs.quiet_end)}` : 'Silence la nuit'}
            description="Les e-mails attendent la fin de la plage."
            checked={isQuietEnabled(prefs)}
            onCheckedChange={(v) => update.mutate(v ? QUIET_DEFAULT : QUIET_NONE)}
          />
          <fieldset className="m-0 flex flex-col gap-3 border-0 border-t border-line p-0 pt-4">
            <legend className="float-left mb-3 text-sm font-semibold text-ink">Recevoir par</legend>
            <Choice label="Dans l’application" checked={prefs.in_app} onChange={(e) => update.mutate({ in_app: e.target.checked })} />
            <Choice label="Par e-mail" checked={prefs.email} onChange={(e) => update.mutate({ email: e.target.checked })} />
          </fieldset>
          <p className="m-0 text-sm text-ink-3">
            Le suivi de vos demandes et vos rendez-vous de confession vous sont toujours signalés, selon les canaux choisis.
          </p>
        </>
      )}
      <Notice title="Échanges avec un prêtre" icon="cadenas">
        Messages chiffrés · aucun administrateur n’y a accès. Aucune notification n’en montre le contenu.
      </Notice>
    </aside>
  );
};
