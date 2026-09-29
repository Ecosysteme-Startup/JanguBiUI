'use client';

import { useId, useState } from 'react';

import { NoeudSelect, useNoeudActif } from '@/components/staff/noeud-actif';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import {
  PERIODES,
  type Periode,
  type TableauNoeud,
  useTableauNoeud,
} from '../api/get-node-dashboard';

const nf = (v: number | null | undefined, suffixe = '') =>
  v === null || v === undefined
    ? '—'
    : `${v.toLocaleString('fr-FR')}${suffixe}`;

const LIBELLE_PERIODE: Record<Periode, string> = {
  7: '7 derniers jours',
  30: '30 derniers jours',
  90: '3 derniers mois',
  365: '12 derniers mois',
};

function Bloc({
  titre,
  lignes,
}: {
  titre: string;
  lignes: [string, string][];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{titre}</h3>
      <dl className="space-y-1.5">
        {lignes.map(([label, valeur]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-serif text-base font-semibold tabular-nums">
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function IndicateursNoeud({ t }: { t: TableauNoeud }) {
  const enCours =
    (t.actes.counts?.submitted ?? 0) +
    (t.actes.counts?.under_verification ?? 0) +
    (t.actes.counts?.info_requested ?? 0);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Bloc
        titre="Fidèles"
        lignes={[
          ['Rattachés', nf(t.fideles.attached)],
          ['Actifs sur la période', nf(t.fideles.active)],
          ['Nouveaux', nf(t.fideles.new)],
        ]}
      />
      <Bloc
        titre="Demandes d’actes"
        lignes={[
          ['Reçues', nf(t.actes.received)],
          ['En cours', nf(enCours)],
          ['En retard', nf(t.actes.overdue)],
          ['Délai médian de retrait', nf(t.actes.median_days_to_collect, ' j')],
        ]}
      />
      <Bloc
        titre="Annonces"
        lignes={[
          ['Publiées', nf(t.annonces.published)],
          ['Lectures', nf(t.annonces.reads)],
          ['Lectures par annonce', nf(t.annonces.reads_per_article)],
        ]}
      />
      <Bloc
        titre="Événements"
        lignes={[
          ['À venir', nf(t.evenements.upcoming)],
          ['Inscriptions', nf(t.evenements.registrations)],
        ]}
      />
      <Bloc
        titre="Messagerie"
        lignes={[
          ['Conversations', nf(t.messagerie.conversations)],
          [
            'Première réponse (médiane)',
            nf(t.messagerie.median_first_reply_hours, ' h'),
          ],
          ['Sans réponse après 48 h', nf(t.messagerie.unanswered_48h)],
        ]}
      />
      <Bloc
        titre="Confessions"
        lignes={[
          ['Créneaux proposés', nf(t.confessions.slots_offered)],
          ['Réservés', nf(t.confessions.booked)],
          ['À venir', nf(t.confessions.upcoming_booked)],
        ]}
      />
    </div>
  );
}

/** Tableau de bord du nœud de travail (`tableau_bord.voir`). */
export function TableauNoeudSection() {
  const id = useId();
  const { noeud, noeuds, choisir } = useNoeudActif('tableau_bord.voir');
  const [periode, setPeriode] = useState<Periode>(30);
  const { data, isLoading, isError, error, refetch } = useTableauNoeud(
    noeud?.id,
    periode,
  );
  if (!noeud) return null;

  return (
    <section aria-labelledby={`${id}-t`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-t`} className="font-serif text-lg font-semibold">
          {noeud.name}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <NoeudSelect noeuds={noeuds} valeur={noeud.id} onChange={choisir} />
          <label htmlFor={`${id}-p`} className="sr-only">
            Période
          </label>
          <select
            id={`${id}-p`}
            value={periode}
            onChange={(e) => setPeriode(Number(e.target.value) as Periode)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {PERIODES.map((p) => (
              <option key={p} value={p}>
                {LIBELLE_PERIODE[p]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState
          description={
            error instanceof ApiError && error.code === 'mfa_required'
              ? 'Reconnectez-vous avec votre code de vérification pour ouvrir le tableau de bord.'
              : undefined
          }
          onRetry={() => refetch()}
        />
      ) : (
        <IndicateursNoeud t={data} />
      )}
    </section>
  );
}
