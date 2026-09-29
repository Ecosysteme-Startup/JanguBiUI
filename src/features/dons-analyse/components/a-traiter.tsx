import { ChevronRight } from 'lucide-react';

import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

import type { ElementATraiter } from '../api/get-analyse-dons';
import { formatHeure, formatJourMois } from '../utils/format';
import { trierParEcheance } from '../utils/ordre';

const BADGES: Record<
  ElementATraiter['type'],
  { label: string; tone: StatusTone }
> = {
  quete_a_confirmer: { label: 'À confirmer', tone: 'warning' },
  paiements_en_attente: { label: 'En attente', tone: 'warning' },
  depot_especes: { label: 'À déposer', tone: 'progress' },
  remise_curie: { label: 'À remettre', tone: 'progress' },
};

/** « 28 sept., 14:15 », ou « 4 oct. » quand l'échéance est une journée entière. */
export const formatEcheance = (iso: string): string => {
  const heure = formatHeure(iso);
  return heure === '0:00'
    ? formatJourMois(iso)
    : `${formatJourMois(iso)}, ${heure}`;
};

interface ATraiterProps {
  elements: ElementATraiter[];
  className?: string;
}

/**
 * Colonne « À traiter » : triée par échéance (la plus proche en premier),
 * échéance affichée sur chaque ligne (décision du 27/09).
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
          {tries.map((e) => {
            const badge = BADGES[e.type];
            return (
              <li
                key={e.id}
                data-a-traiter={e.type}
                className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-foreground">
                    {e.titre}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StatusBadge label={badge.label} tone={badge.tone} />
                    <span className="text-[13px] leading-[18px] text-foreground/80 tabular-nums">
                      Échéance : {formatEcheance(e.echeance)}
                    </span>
                  </div>
                  {e.detail && (
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">
                      {e.detail}
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
