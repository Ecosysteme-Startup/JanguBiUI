'use client';

import { Info } from 'lucide-react';
import * as React from 'react';

import { EffacerHistoriqueLecture } from '@/components/personnalisation/effacer-historique';
import { Switch } from '@/components/ui/form/switch';
import { useNotifications } from '@/components/ui/notifications';
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

// Réglages « Personnalisation » du profil (maquette APP-F10, pendant web) :
// suggestions de lecture, suggestions d'écoute, présence, historique.

function Ligne({
  id,
  titre,
  detail,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  titre: string;
  detail: React.ReactNode;
  checked: boolean;
  disabled: boolean;
  onChange: (valeur: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {titre}
        </label>
        <p
          id={`${id}-detail`}
          className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground"
        >
          {detail}
        </p>
      </div>
      <Switch
        id={id}
        aria-describedby={`${id}-detail`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="mt-0.5"
      />
    </div>
  );
}

export function Personnalisation() {
  const { addNotification } = useNotifications();
  const erreur = () =>
    addNotification({
      type: 'error',
      title: "Le réglage n'a pas pu être enregistré",
      message: 'Réessayez dans quelques instants.',
    });

  const parole = useReglagesParole();
  const modifierParole = useModifierReglagesParole();
  const ecoute = useReglagesEcoute();
  const modifierEcoute = useModifierReglagesEcoute();
  const presence = useReglagePresence();
  const modifierPresence = useModifierReglagePresence();

  return (
    <div className="space-y-4">
      <Ligne
        id="reglage-suggestions-lecture"
        titre="Suggestions de lecture"
        detail="« Pour vous aujourd'hui » sur la page Parole : un verset, la lecture à continuer, un livre."
        checked={parole.data?.personnalisation_parole ?? false}
        disabled={!parole.data || modifierParole.isPending}
        onChange={(v) => modifierParole.mutate(v, { onError: erreur })}
      />
      <Ligne
        id="reglage-suggestions-ecoute"
        titre="Suggestions d'écoute"
        detail="Chants et homélies proposés dans la sonothèque."
        checked={ecoute.data?.recommendations_enabled ?? false}
        disabled={!ecoute.data || modifierEcoute.isPending}
        onChange={(v) => modifierEcoute.mutate(v, { onError: erreur })}
      />
      <Ligne
        id="reglage-presence"
        titre="Montrer quand je suis en ligne"
        detail="« En ligne » et « Vu à » dans la messagerie."
        checked={presence.data?.effective ?? false}
        disabled={!presence.data || modifierPresence.isPending}
        onChange={(v) => modifierPresence.mutate(v, { onError: erreur })}
      />
      <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-[13px] leading-[18px] text-foreground/80">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Seules les personnes avec qui vous avez une conversation le voient.
          Désactivé, rien n&apos;apparaît : ni «&nbsp;En ligne&nbsp;», ni
          «&nbsp;Vu à&nbsp;». Si vous masquez votre présence, vous ne verrez
          plus celle des autres.
        </span>
      </p>
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-foreground">Historique</h3>
        <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">
          Données utilisées : vos lectures, vos signets et surlignages, les
          versets ouverts depuis une recherche et le jour liturgique. Jamais vos
          messages, confessions, demandes ou dons.
        </p>
        <EffacerHistoriqueLecture className="-ml-2 mt-2" />
      </div>
    </div>
  );
}
