'use client';

import { EffacerHistoriqueLecture } from '@/components/personnalisation/effacer-historique';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import {
  useModifierReglagesEcoute,
  useReglagesEcoute,
} from '@/lib/personnalisation/ecoute';
import {
  useModifierReglagesParole,
  useReglagesParole,
} from '@/lib/personnalisation/parole';
import {
  useModifierReglagePresence,
  useReglagePresence,
} from '@/lib/personnalisation/presence';

import { SettingsCard } from './settings-card';

const erreur = () =>
  toast.err(
    "Le réglage n'a pas pu être enregistré. Réessayez dans quelques instants.",
  );

/**
 * Personnalisation (maquette APP-F10, pendant web) : suggestions de lecture (« Pour vous
 * aujourd'hui »), suggestions d'écoute (sonothèque), présence dans la messagerie, historique.
 */
export function Personnalisation() {
  const parole = useReglagesParole();
  const modifierParole = useModifierReglagesParole();
  const ecoute = useReglagesEcoute();
  const modifierEcoute = useModifierReglagesEcoute();
  const presence = useReglagePresence();
  const modifierPresence = useModifierReglagePresence();

  return (
    <SettingsCard
      id="personnalisation"
      title="Personnalisation"
      description="Suggestions de lecture et d’écoute, présence dans la messagerie."
    >
      <div className="mt-5 flex flex-col gap-4">
        <Switch
          id="reglage-suggestions-lecture"
          label="Suggestions de lecture"
          description="« Pour vous aujourd'hui » sur la page Parole : un verset, la lecture à continuer, un livre."
          checked={parole.data?.personnalisation_parole ?? false}
          disabled={!parole.data || modifierParole.isPending}
          onCheckedChange={(v) => modifierParole.mutate(v, { onError: erreur })}
        />
        <Switch
          id="reglage-suggestions-ecoute"
          label="Suggestions d'écoute"
          description="Chants et homélies proposés dans la sonothèque."
          checked={ecoute.data?.recommendations_enabled ?? false}
          disabled={!ecoute.data || modifierEcoute.isPending}
          onCheckedChange={(v) => modifierEcoute.mutate(v, { onError: erreur })}
        />
        <Switch
          id="reglage-presence"
          label="Montrer quand je suis en ligne"
          description="« En ligne » et « Vu à » dans la messagerie."
          checked={presence.data?.effective ?? false}
          disabled={!presence.data || modifierPresence.isPending}
          onCheckedChange={(v) =>
            modifierPresence.mutate(v, { onError: erreur })
          }
        />
        <p className="m-0 flex items-start gap-2 rounded-12 bg-surface-2 px-3 py-2.5 text-13 text-ink-2">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          <span>
            Seules les personnes avec qui vous avez une conversation le voient.
            Désactivé, rien n&apos;apparaît : ni «&nbsp;En ligne&nbsp;», ni
            «&nbsp;Vu à&nbsp;». Si vous masquez votre présence, vous ne verrez
            plus celle des autres.
          </span>
        </p>
        <div className="border-t border-line pt-4">
          <h3 className="m-0 text-15 font-semibold text-ink">Historique</h3>
          <p className="m-0 mt-1 text-13 text-ink-3">
            Données utilisées : vos lectures, vos signets et surlignages, les
            versets ouverts depuis une recherche et le jour liturgique. Jamais
            vos messages, confessions, demandes ou dons.
          </p>
          <EffacerHistoriqueLecture className="-ml-2 mt-2" />
        </div>
      </div>
    </SettingsCard>
  );
}
