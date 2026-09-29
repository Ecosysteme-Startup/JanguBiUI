'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';

import {
  type CreationCompte,
  DEGRES_ORDRE,
  ETATS_DE_VIE,
  LIBELLES_DEGRE,
  LIBELLES_ETAT_DE_VIE,
  useCreerCompte,
  usePerimetre,
} from '../api/admin-comptes';

import { champ, MessageErreur } from './commun';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Création d'un compte (Jàngu Bi + Keycloak) avec invitation par e-mail. */
export function CreerCompte() {
  const id = useId();
  const router = useRouter();
  const { data: perimetre, isLoading } = usePerimetre();
  const creer = useCreerCompte();
  const [v, setV] = useState<CreationCompte>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: null,
    node_id: '',
    etat_de_vie: 'laic',
    degre_ordre: 'aucun',
    send_invitation: true,
  });
  const set = (p: Partial<CreationCompte>) => setV((a) => ({ ...a, ...p }));
  const noeuds = perimetre?.nodes ?? [];
  const nodeId = v.node_id || noeuds[0]?.id || '';
  const noeud = noeuds.find((n) => n.id === nodeId);
  const emailOk = EMAIL.test(v.email.trim());
  const valide = emailOk && !!nodeId;

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    creer.mutate(
      {
        ...v,
        email: v.email.trim(),
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        phone_number: v.phone_number?.trim() || null,
        node_id: nodeId,
        degre_ordre: v.etat_de_vie === 'clerc' ? v.degre_ordre : 'aucun',
      },
      {
        onSuccess: (c) =>
          router.push(paths.app.admin.comptes.fiche.getHref(c.id)),
      },
    );
  };

  const label = (k: string, t: string) => (
    <label htmlFor={`${id}-${k}`} className="text-sm font-medium">
      {t}
    </label>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={soumettre} className="space-y-6" noValidate>
        <div>
          <h2 className="font-serif text-2xl font-semibold">Créer un compte</h2>
          <p className="text-sm text-muted-foreground">
            La personne reçoit une invitation par e-mail pour choisir son mot de
            passe.
          </p>
        </div>

        <fieldset className="space-y-4 rounded-xl border bg-card p-5">
          <legend className="px-1 font-serif text-lg font-semibold">
            Identité
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {label('p', 'Prénom')}
              <input
                id={`${id}-p`}
                value={v.first_name}
                maxLength={50}
                onChange={(e) => set({ first_name: e.target.value })}
                className={champ}
              />
            </div>
            <div>
              {label('n', 'Nom')}
              <input
                id={`${id}-n`}
                value={v.last_name}
                maxLength={50}
                onChange={(e) => set({ last_name: e.target.value })}
                className={champ}
              />
            </div>
          </div>
          <div>
            {label('e', 'Adresse e-mail')}
            <input
              id={`${id}-e`}
              type="email"
              required
              value={v.email}
              aria-describedby={`${id}-e-aide`}
              aria-invalid={v.email !== '' && !emailOk ? true : undefined}
              onChange={(e) => set({ email: e.target.value })}
              className={champ}
            />
            <p id={`${id}-e-aide`} className="mt-1 text-xs text-muted-foreground">
              Doit être unique. L’invitation y sera envoyée.
            </p>
          </div>
          <div>
            {label('t', 'Téléphone (facultatif)')}
            <input
              id={`${id}-t`}
              type="tel"
              maxLength={20}
              placeholder="+221 77 000 00 00"
              value={v.phone_number ?? ''}
              onChange={(e) => set({ phone_number: e.target.value })}
              className={champ}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border bg-card p-5">
          <legend className="px-1 font-serif text-lg font-semibold">
            Rattachement
          </legend>
          <p className="text-sm text-muted-foreground">
            Seuls les rattachements de votre portée sont proposés. Les fonctions
            (secrétaire, économe…) s’ajoutent ensuite depuis la fiche du compte.
          </p>
          <div>
            {label('r', 'Diocèse / paroisse')}
            <select
              id={`${id}-r`}
              value={nodeId}
              disabled={isLoading || noeuds.length === 0}
              onChange={(e) => set({ node_id: e.target.value })}
              className={champ}
            >
              {noeuds.length === 0 && (
                <option value="">Aucun rattachement disponible</option>
              )}
              {noeuds.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {label('v', 'État de vie')}
              <select
                id={`${id}-v`}
                value={v.etat_de_vie}
                onChange={(e) =>
                  set({
                    etat_de_vie: e.target.value as CreationCompte['etat_de_vie'],
                  })
                }
                className={champ}
              >
                {ETATS_DE_VIE.map((o) => (
                  <option key={o} value={o}>
                    {LIBELLES_ETAT_DE_VIE[o]}
                  </option>
                ))}
              </select>
            </div>
            {v.etat_de_vie === 'clerc' && (
              <div>
                {label('d', 'Degré de l’ordre')}
                <select
                  id={`${id}-d`}
                  value={v.degre_ordre}
                  onChange={(e) =>
                    set({
                      degre_ordre: e.target
                        .value as CreationCompte['degre_ordre'],
                    })
                  }
                  className={champ}
                >
                  {DEGRES_ORDRE.map((o) => (
                    <option key={o} value={o}>
                      {LIBELLES_DEGRE[o]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border bg-card p-5">
          <legend className="px-1 font-serif text-lg font-semibold">
            Invitation
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.send_invitation}
              onChange={(e) => set({ send_invitation: e.target.checked })}
            />
            Envoyer l’invitation par e-mail maintenant
          </label>
          <p className="text-xs text-muted-foreground">
            Le lien permet de vérifier l’adresse e-mail et de choisir un mot de
            passe. Aucun mot de passe n’est saisi par un administrateur.
          </p>
        </fieldset>

        <MessageErreur error={creer.error} />

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={paths.app.admin.comptes.liste.getHref()}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={!valide} isLoading={creer.isPending}>
            {v.send_invitation ? 'Créer et inviter' : 'Créer le compte'}
          </Button>
        </div>
      </form>

      <aside
        aria-label="Aperçu de l’e-mail"
        className="h-fit space-y-3 rounded-xl border bg-muted/30 p-5 text-sm"
      >
        <p className="font-medium">Aperçu de l’e-mail</p>
        <p className="text-muted-foreground">Objet : Votre compte Jàngu Bi</p>
        <p>Bonjour {v.first_name.trim() || '…'},</p>
        <p>
          Un compte a été créé pour vous
          {noeud ? ` (${noeud.name})` : ''}. Pour l’activer, choisissez votre
          mot de passe avec le lien ci-dessous.
        </p>
        <p className="font-medium text-primary">Activer mon compte</p>
        <p className="text-xs text-muted-foreground">
          Ce lien est valable 72 heures.
        </p>
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Le compte est créé à la fois dans Jàngu Bi et dans Keycloak. Si
          Keycloak est injoignable, rien n’est créé.
        </p>
      </aside>
    </div>
  );
}
