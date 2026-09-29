'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import {
  LIBELLES_ECART,
  type Passage,
  useEtatSync,
  useLancerReconciliation,
  usePassage,
  usePerimetre,
} from '../api/admin-comptes';

import { useCheminsComptes } from './chemins';
import {
  dateHeure,
  DialogueConfirmation,
  MessageErreur,
  nombre,
} from './commun';

const resultat = (p: Passage) => {
  if (!p.finished_at) return { l: 'En cours', v: 'info' as const };
  if (!p.success)
    return { l: `Échec${p.error ? ` : ${p.error}` : ''}`, v: 'err' as const };
  const ecarts = p.counts.ecarts ?? 0;
  return ecarts > 0
    ? { l: 'Terminé avec écarts', v: 'warn' as const }
    : { l: 'Terminé', v: 'ok' as const };
};

const DECLENCHEURS: Record<string, string> = {
  tache: 'Automatique',
  commande: 'Commande serveur',
  admin: 'Administrateur',
};
const declencheur = (t: string) => DECLENCHEURS[t] ?? t;

const CORRECTIONS: Record<string, string> = {
  cree: 'Créé',
  lie: 'Relié',
  mis_a_jour: 'Mis à jour',
  inchange: 'Inchangé',
  efface: 'Effacé',
  effacer: 'À effacer',
  desactive: 'Désactivé',
  conflit: 'Conflit',
  echec: 'Échec',
  creer_dans_keycloak: 'À créer dans Keycloak',
  seuil_suppressions_depasse: 'Seuil dépassé : rien n’est effacé',
};

/** État de la synchronisation Keycloak et réconciliations (plateforme). */
export function Synchronisation() {
  const chemins = useCheminsComptes();
  const { data: perimetre, isLoading: chargePerimetre } = usePerimetre();
  const plateforme = !!perimetre?.is_platform_admin;
  const { data, isLoading, isError, refetch } = useEtatSync(plateforme);
  const lancer = useLancerReconciliation();
  const [runId, setRunId] = useState<number | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const dernier = data?.reconciliations[0];
  const { data: rapport } = usePassage(runId ?? dernier?.id);

  if (chargePerimetre) return <Skeleton className="h-64 rounded-xl" />;
  if (!plateforme)
    return (
      <ErrorState
        title="Réservé à la plateforme"
        description="La synchronisation avec Keycloak est réservée aux administrateurs de la plateforme."
      />
    );
  if (isError)
    return (
      <ErrorState
        description="L’état de la synchronisation n’a pas pu être chargé."
        onRetry={() => refetch()}
      />
    );
  if (isLoading || !data) return <Skeleton className="h-64 rounded-xl" />;

  const ecartsRapport = rapport?.report ?? [];
  const kc = (k: string) => data.ecarts_par_type[k] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-24 font-semibold">
            Synchronisation avec Keycloak
          </h2>
          <p className="text-14 text-ink-3">
            Comparez les comptes de Jàngu Bi et de Keycloak, puis corrigez les
            écarts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            loading={lancer.isPending && lancer.variables === true}
            onClick={() =>
              lancer.mutate(true, { onSuccess: (r) => setRunId(r.id) })
            }
          >
            Lancer une réconciliation
          </Button>
          <Button onClick={() => setConfirmer(true)}>
            Corriger les écarts
          </Button>
        </div>
      </div>
      {!confirmer && <MessageErreur error={lancer.error} />}

      {!data.enabled && (
        <p className="rounded-md border border-warn-dot bg-warn-bg px-3 py-2 text-14">
          La synchronisation est désactivée sur ce serveur.
        </p>
      )}

      <section
        aria-label="Résumé"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-xl border bg-surface p-4">
          <p className="text-14 text-ink-3">Dernier passage</p>
          <p className="mt-1 text-24 font-semibold">
            {dernier ? dateHeure(dernier.started_at) : '—'}
          </p>
          <p className="mt-1 text-13 text-ink-3">
            {dernier?.counts.keycloak != null
              ? `${nombre(dernier.counts.keycloak)} comptes Keycloak comparés`
              : `${nombre(data.evenements.traites_24h)} événements traités en 24 h`}
          </p>
        </div>
        {[
          ['application_seule', 'absent de Keycloak'],
          ['keycloak_seul', 'aucun profil dans l’application'],
          ['champs_differents', 'e-mail, nom ou statut'],
        ].map(([k, d]) => (
          <div key={k} className="rounded-xl border bg-surface p-4">
            <p className="text-14 text-ink-3">{LIBELLES_ECART[k]}</p>
            <p className="mt-1 text-24 font-semibold">{nombre(kc(k))}</p>
            <p className="mt-1 text-13 text-ink-3">{d}</p>
          </div>
        ))}
      </section>

      <p className="text-14">
        <NextLink
          href={`${chemins.liste.getHref()}?sync=non_lie`}
          className="text-primary hover:underline"
        >
          {nombre(data.comptes_non_lies)} compte(s) non relié(s)
        </NextLink>{' '}
        ·{' '}
        <NextLink
          href={`${chemins.liste.getHref()}?sync=ecart`}
          className="text-primary hover:underline"
        >
          {nombre(data.comptes_en_ecart)} compte(s) en écart
        </NextLink>{' '}
        · lecture des événements {data.events_polling ? 'active' : 'arrêtée'}
        {data.evenements.echecs > 0
          ? ` · ${nombre(data.evenements.echecs)} événement(s) en échec`
          : ''}
      </p>

      <section
        aria-labelledby="s-ecarts"
        className="rounded-xl border bg-surface"
      >
        <h3 id="s-ecarts" className="border-b px-5 py-3 text-18 font-semibold">
          Écarts du rapport{rapport ? ` n° ${rapport.id}` : ''} ·{' '}
          {ecartsRapport.length}
          {rapport?.dry_run ? ' (simulation, rien n’a été corrigé)' : ''}
        </h3>
        {ecartsRapport.length === 0 ? (
          <p className="px-5 py-4 text-14 text-ink-3">
            Aucun écart dans ce rapport.
          </p>
        ) : (
          <table className="w-full text-14">
            <caption className="sr-only">Écarts à examiner</caption>
            <thead className="text-left text-13 text-ink-3">
              <tr>
                <th scope="col" className="px-5 py-2">
                  Compte
                </th>
                <th scope="col" className="px-5 py-2">
                  Type
                </th>
                <th scope="col" className="px-5 py-2">
                  Détail
                </th>
                <th scope="col" className="px-5 py-2">
                  Correction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ecartsRapport.map((e, i) => (
                <tr key={i}>
                  <td className="px-5 py-2">
                    {e.user_id ? (
                      <NextLink
                        href={chemins.fiche.getHref(e.user_id)}
                        className="hover:text-primary"
                      >
                        {e.email ?? e.user_id}
                      </NextLink>
                    ) : (
                      (e.email ?? e.keycloak_id ?? '—')
                    )}
                  </td>
                  <td className="px-5 py-2">
                    {LIBELLES_ECART[e.kind] ?? e.kind}
                  </td>
                  <td className="px-5 py-2 text-ink-3">
                    {e.fields?.length ? e.fields.join(', ') : '—'}
                  </td>
                  <td className="px-5 py-2">
                    {e.correction
                      ? (CORRECTIONS[e.correction] ?? e.correction)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        aria-labelledby="s-historique"
        className="rounded-xl border bg-surface"
      >
        <h3
          id="s-historique"
          className="border-b px-5 py-3 text-18 font-semibold"
        >
          Historique des passages
        </h3>
        <table className="w-full text-14">
          <caption className="sr-only">Historique des passages</caption>
          <thead className="text-left text-13 text-ink-3">
            <tr>
              <th scope="col" className="px-5 py-2">
                Date
              </th>
              <th scope="col" className="px-5 py-2">
                Déclenché par
              </th>
              <th scope="col" className="px-5 py-2">
                Écarts
              </th>
              <th scope="col" className="px-5 py-2">
                Erreurs
              </th>
              <th scope="col" className="px-5 py-2">
                Résultat
              </th>
              <th scope="col" className="px-5 py-2">
                <span className="sr-only">Rapport</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.reconciliations.map((p) => {
              const r = resultat(p);
              return (
                <tr key={p.id}>
                  <td className="px-5 py-2">{dateHeure(p.started_at)}</td>
                  <td className="px-5 py-2">
                    {declencheur(p.trigger)}
                    {p.dry_run ? ' · simulation' : ''}
                  </td>
                  <td className="px-5 py-2">{nombre(p.counts.ecarts)}</td>
                  <td className="px-5 py-2">{nombre(p.counts.erreurs)}</td>
                  <td className="px-5 py-2">
                    <Badge tone={r.v}>{r.l}</Badge>
                  </td>
                  <td className="px-5 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRunId(p.id)}
                    >
                      Voir le rapport
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-13 text-ink-3">
        Une correction ne supprime jamais l’historique d’audit. Chaque
        réconciliation est inscrite au journal avec son auteur.
      </p>

      <DialogueConfirmation
        open={confirmer}
        onClose={() => {
          lancer.reset();
          setConfirmer(false);
        }}
        titre="Corriger les écarts maintenant ?"
        description="La réconciliation aligne Jàngu Bi et Keycloak. Au plus quelques comptes supprimés dans Keycloak sont effacés par passage ; au-delà, rien n’est effacé et l’écart est signalé."
        libelle="Corriger"
        isPending={lancer.isPending}
        error={lancer.error}
        onConfirm={() =>
          lancer.mutate(false, {
            onSuccess: (r) => {
              setRunId(r.id);
              setConfirmer(false);
            },
          })
        }
      />
    </div>
  );
}
