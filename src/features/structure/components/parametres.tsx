'use client';

import { useEffect, useId, useState } from 'react';

import { NoeudSelect, useNoeudActif } from '@/components/staff/noeud-actif';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { aCapacite } from '@/lib/staff/capacites';

import {
  type Delais,
  type Reglages,
  useDelais,
  useDisponibilite,
  useEnregistrerDelais,
  useEnregistrerDisponibilite,
  useEnregistrerReglages,
  useReglages,
} from '../api/parametres';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const Erreur = ({ e }: { e: unknown }) =>
  e instanceof ApiError ? (
    <p role="alert" className="text-sm text-destructive">
      {e.message}
    </p>
  ) : null;

function Secretariat({ nodeId, r }: { nodeId: string; r: Reglages }) {
  const id = useId();
  const [v, setV] = useState(r);
  useEffect(() => setV(r), [r]);
  const enregistrer = useEnregistrerReglages(nodeId);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        enregistrer.mutate({
          phone: v.phone,
          email: v.email,
          address: v.address,
          city: v.city,
          secretariat_public: v.secretariat_public,
          acts_delay_days: v.acts_delay_days,
          acts_welcome_message: v.acts_welcome_message,
          office_hours: v.office_hours,
        });
      }}
    >
      <h2 className="font-serif text-lg font-semibold">Secrétariat</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${id}-t`} className="text-sm">
          Téléphone
          <input
            id={`${id}-t`}
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
            className={champ}
          />
        </label>
        <label htmlFor={`${id}-e`} className="text-sm">
          E-mail
          <input
            id={`${id}-e`}
            type="email"
            value={v.email}
            onChange={(e) => setV({ ...v, email: e.target.value })}
            className={champ}
          />
        </label>
        <label htmlFor={`${id}-a`} className="text-sm sm:col-span-2">
          Adresse
          <input
            id={`${id}-a`}
            value={v.address}
            onChange={(e) => setV({ ...v, address: e.target.value })}
            className={champ}
          />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Horaires d’accueil</legend>
        {v.office_hours.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label="Jours"
              value={h.days}
              onChange={(e) =>
                setV({
                  ...v,
                  office_hours: v.office_hours.map((x, j) =>
                    j === i ? { ...x, days: e.target.value } : x,
                  ),
                })
              }
              className={champ}
            />
            <input
              aria-label="Heures"
              value={h.hours}
              onChange={(e) =>
                setV({
                  ...v,
                  office_hours: v.office_hours.map((x, j) =>
                    j === i ? { ...x, hours: e.target.value } : x,
                  ),
                })
              }
              className={champ}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setV({
                  ...v,
                  office_hours: v.office_hours.filter((_, j) => j !== i),
                })
              }
            >
              Retirer
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setV({
              ...v,
              office_hours: [...v.office_hours, { days: '', hours: '' }],
            })
          }
        >
          Ajouter une plage
        </Button>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.secretariat_public}
          onChange={(e) => setV({ ...v, secretariat_public: e.target.checked })}
        />
        Afficher ces coordonnées sur la fiche publique
      </label>
      <label htmlFor={`${id}-w`} className="block text-sm">
        Message d’accueil des demandes d’actes
        <textarea
          id={`${id}-w`}
          rows={2}
          value={v.acts_welcome_message}
          onChange={(e) => setV({ ...v, acts_welcome_message: e.target.value })}
          className={champ}
        />
      </label>
      <Erreur e={enregistrer.error} />
      <Button type="submit" size="sm" isLoading={enregistrer.isPending}>
        Enregistrer
      </Button>
    </form>
  );
}

function DelaisActes({ nodeId, d }: { nodeId: string; d: Delais }) {
  const [items, setItems] = useState(d.items);
  useEffect(() => setItems(d.items), [d]);
  const enregistrer = useEnregistrerDelais(nodeId);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        enregistrer.mutate(
          items
            .filter((i) => i.document_type !== 'other')
            .map((i) => ({ document_type: i.document_type, days: i.days })),
        );
      }}
    >
      <h2 className="font-serif text-lg font-semibold">
        Délais indicatifs des actes
      </h2>
      <p className="text-sm text-muted-foreground">
        Jours ouvrés annoncés au fidèle. Vide : délai général ({d.default_days}{' '}
        jours).
      </p>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.document_type}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <label htmlFor={`delai-${i.document_type}`}>
              {i.document_type_label}
            </label>
            <input
              id={`delai-${i.document_type}`}
              type="number"
              min={1}
              max={90}
              value={i.days ?? ''}
              placeholder={String(d.default_days)}
              onChange={(e) =>
                setItems((l) =>
                  l.map((x) =>
                    x.document_type === i.document_type
                      ? {
                          ...x,
                          days: e.target.value ? Number(e.target.value) : null,
                        }
                      : x,
                  ),
                )
              }
              className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </li>
        ))}
      </ul>
      <Erreur e={enregistrer.error} />
      <Button type="submit" size="sm" isLoading={enregistrer.isPending}>
        Enregistrer les délais
      </Button>
    </form>
  );
}

function Disponibilites() {
  const { data } = useDisponibilite(true);
  const enregistrer = useEnregistrerDisponibilite();
  if (!data) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-lg font-semibold">Messagerie</h2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.accepts_new_conversations}
          disabled={enregistrer.isPending}
          onChange={(e) =>
            enregistrer.mutate({ accepts_new_conversations: e.target.checked })
          }
        />
        Accepter de nouveaux échanges avec les fidèles
      </label>
      <Erreur e={enregistrer.error} />
    </section>
  );
}

/** Paramètres de la communauté et de la personne (messagerie). */
export function Parametres() {
  const { data: user } = useUser();
  const { noeud, noeuds, choisir } = useNoeudActif(
    'horaires.gerer',
    'structure.gerer',
  );
  const reglages = useReglages(noeud?.id);
  const delais = useDelais(noeud?.id);
  return (
    <div className="space-y-10">
      {noeud && (
        <>
          <NoeudSelect noeuds={noeuds} valeur={noeud.id} onChange={choisir} />
          {reglages.isLoading ? (
            <SkeletonList />
          ) : reglages.data ? (
            <Secretariat nodeId={noeud.id} r={reglages.data} />
          ) : null}
          {delais.data && <DelaisActes nodeId={noeud.id} d={delais.data} />}
        </>
      )}
      {aCapacite(user, 'messagerie.recevoir_fideles') && <Disponibilites />}
    </div>
  );
}
