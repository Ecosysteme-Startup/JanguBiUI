import { ChevronRight } from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/ui/badge';

import type { ElementATraiter } from '../api/get-analyse-dons';
import { formatFcfa, formatHeure, formatJourMois } from '../utils/format';
import { trierParEcheance } from '../utils/ordre';

const BADGES: Record<string, { label: string; tone: BadgeTone }> = {
  quete_a_confirmer: { label: 'À confirmer', tone: 'warn' },
  paiements_en_attente: { label: 'En attente', tone: 'warn' },
  paiement_tardif: { label: 'À régulariser', tone: 'warn' },
  especes_a_deposer: { label: 'À déposer', tone: 'info' },
  remise_curie: { label: 'À remettre', tone: 'info' },
  remise_a_confirmer: { label: 'Remise à confirmer', tone: 'info' },
  cloture_mois: { label: 'Mois à clore', tone: 'neutral' },
};
const BADGE_INCONNU = { label: 'À traiter', tone: 'neutral' as BadgeTone };

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
      className={`rounded-16 border border-line bg-surface p-5 shadow-card ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="titre-a-traiter"
            className="font-sans text-20 font-semibold leading-7"
          >
            À traiter
          </h2>
          <p className="mt-0.5 text-14 text-ink-3">
            Par échéance, la plus proche en premier
          </p>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-2 px-2 text-13 font-semibold text-ink-2 tabular-nums">
          {tries.length}
        </span>
      </div>
      {tries.length === 0 ? (
        <p className="mt-4 text-14 text-ink-3">
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
                className="flex items-center gap-3 border-t border-line py-3 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-14 font-semibold leading-5 text-ink">
                    {e.libelle}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <span className="text-13 leading-[18px] text-ink-2 tabular-nums">
                      Échéance : {formatEcheance(e.echeance)}
                    </span>
                  </div>
                  {precision && (
                    <p className="mt-0.5 text-13 leading-[18px] text-ink-3 tabular-nums">
                      {precision}
                    </p>
                  )}
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-3"
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
