import { ChevronRight } from 'lucide-react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

import type { ElementATraiter } from '../api/get-analyse-dons';
import { formatFcfa, formatHeure, formatJourMois } from '../utils/format';
import { trierParEcheance } from '../utils/ordre';

const BADGES: Record<string, { label: string; tone: StatusTone }> = {
  quete_a_confirmer: { label: 'À confirmer', tone: 'warning' },
  paiements_en_attente: { label: 'En attente', tone: 'warning' },
  paiement_tardif: { label: 'À régulariser', tone: 'warning' },
  especes_a_deposer: { label: 'À déposer', tone: 'progress' },
  remise_curie: { label: 'À remettre', tone: 'progress' },
  remise_a_confirmer: { label: 'Remise à confirmer', tone: 'progress' },
  cloture_mois: { label: 'Mois à clore', tone: 'neutral' },
};
const BADGE_INCONNU = { label: 'À traiter', tone: 'neutral' as StatusTone };

/**
 * « 4 oct. » : l'échéance du contrat est une date ; un instant garde son heure
 * (« 28 sept., 14:15 »).
 */
export const formatEcheance = (iso: string): string => {
  if (iso.length === 10) return formatJourMois(iso);
  const heure = formatHeure(iso);
  return heure === '0:00'
    ? formatJourMois(iso)
    : `${formatJourMois(iso)}, ${heure}`;
};

const detail = (e: ElementATraiter): string | null => {
  const morceaux = [
    e.montant !== null ? formatFcfa(e.montant) : null,
    e.depuis ? `depuis le ${formatHorodatageCourt(e.depuis)}` : null,
  ].filter(Boolean);
  return morceaux.length ? morceaux.join(' · ') : null;
};

const formatHorodatageCourt = (iso: string) =>
  `${formatJourMois(iso)}, ${formatHeure(iso)}`;

interface ATraiterProps {
  elements: ElementATraiter[];
  className?: string;
}

/**
 * Colonne « À traiter » : triée par échéance (la plus proche en premier),
 * échéance affichée sur chaque ligne (décision du 27/09). À échéance égale,
 * l'ordre du serveur (ordre des types du contrat §2.4) est conservé.
 */
export function ATraiter({ elements, className }: ATraiterProps) {
  const tries = trierParEcheance(elements);
  return (
    <section
      aria-labelledby="titre-a-traiter"
      className={`rounded-2xl border border-border bg-card p-5 shadow-soft-sm ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="titre-a-traiter"
            className="font-sans text-xl font-semibold leading-7 tracking-normal"
          >
            À traiter
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Par échéance, la plus proche en premier
          </p>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-xs font-semibold text-secondary-foreground tabular-nums">
          {tries.length}
        </span>
      </div>
      {tries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Rien à traiter pour le moment.
        </p>
      ) : (
        <ol className="mt-3">
          {tries.map((e, i) => {
            const badge = BADGES[e.type] ?? BADGE_INCONNU;
            const precision = detail(e);
            return (
              <li
                key={`${e.type}-${e.objet_id ?? ''}-${e.paroisse?.id ?? ''}-${i}`}
                data-a-traiter={e.type}
                className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-foreground">
                    {e.libelle}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StatusBadge label={badge.label} tone={badge.tone} />
                    <span className="text-[13px] leading-[18px] text-foreground/80 tabular-nums">
                      Échéance : {formatEcheance(e.echeance)}
                    </span>
                  </div>
                  {precision && (
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground tabular-nums">
                      {precision}
                    </p>
                  )}
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
