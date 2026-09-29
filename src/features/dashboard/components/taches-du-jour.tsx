'use client';

import { CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { NoeudSelect, useNoeudActif } from '@/components/staff/noeud-actif';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { type Capacite } from '@/lib/staff/capacites';
import { cn } from '@/lib/utils';

import { useTachesDuJour } from '../api/get-taches-du-jour';

/** Capacités qui ouvrent au moins une rubrique (API-V1-COMPLEMENTS §2.5). */
export const CAPACITES_TACHES: Capacite[] = [
  'actes.traiter',
  'dons.saisir_quete',
  'dons.gerer_fonds',
  'annonces.publier',
  'intentions.gerer',
  'confessions.gerer',
  'confessions.voir_planning',
];

const TYPES_PAROISSE = ['paroisse', 'quasi_paroisse'];

const LIENS: Record<string, string> = {
  demandes_a_traiter: paths.app.admin.documents.getHref(),
  demandes_complement: paths.app.admin.documents.getHref(),
  quetes_a_confirmer: paths.app.paroisse.dons.getHref('quetes'),
  annonces_a_publier: paths.app.admin.articles.getHref(),
  annonces_du_dimanche: paths.app.admin.articles.getHref(),
  intentions_a_planifier: paths.app.paroisse.intentions.getHref(),
  intentions_du_jour: paths.app.paroisse.intentions.getHref(),
  confessions_du_jour: paths.app.paroisse.confessions.getHref(),
};

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

function Taches({ node }: { node: string }) {
  const { data, isLoading, isError, refetch } = useTachesDuJour(node);
  if (isLoading) return <SkeletonList count={3} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  const faites = data.tasks.filter((t) => t.count === 0).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {faites} sur {data.tasks.length} à jour
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {data.tasks.map((t) => {
          const ok = t.count === 0;
          const contenu = (
            <>
              {ok ? (
                <CheckCircle2
                  className="size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {t.count}
                </span>
              )}
              <span
                className={cn('flex-1 text-sm', ok && 'text-muted-foreground')}
              >
                {t.label}
                {ok && <span className="sr-only"> : rien à faire</span>}
              </span>
              {!ok && LIENS[t.code] && (
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </>
          );
          return (
            <li key={t.code}>
              {!ok && LIENS[t.code] ? (
                <Link
                  href={LIENS[t.code]}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
                >
                  {contenu}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  {contenu}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {data.confessions && data.confessions.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Confessions du jour
          </h3>
          <ul className="space-y-1 text-sm">
            {data.confessions.map((c) => (
              <li key={c.slot_id} className="flex justify-between gap-3">
                <span>
                  {heure(c.starts_at)}–{heure(c.ends_at)} · {c.place_name}
                  {c.priest_name && ` · ${c.priest_name}`}
                </span>
                <span className="text-muted-foreground">
                  {c.reserved ? 'Réservé' : 'Libre'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** « Reste à faire aujourd'hui » du tableau de bord paroisse. */
export function TachesDuJourSection() {
  const { noeuds: tous, choisir, noeud } = useNoeudActif(...CAPACITES_TACHES);
  const noeuds = tous.filter((n) => TYPES_PAROISSE.includes(n.type));
  const actif = noeuds.find((n) => n.id === noeud?.id) ?? noeuds[0];
  if (!actif) return null;
  return (
    <section aria-labelledby="taches-du-jour" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="taches-du-jour"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Reste à faire aujourd’hui
        </h2>
        <NoeudSelect noeuds={noeuds} valeur={actif.id} onChange={choisir} />
      </div>
      <Taches node={actif.id} />
    </section>
  );
}
