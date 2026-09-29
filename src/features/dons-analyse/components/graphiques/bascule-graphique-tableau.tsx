import { cn } from '@/utils/cn';

export type Vue = 'graphique' | 'tableau';

interface BasculeGraphiqueTableauProps {
  vue: Vue;
  onChange: (vue: Vue) => void;
  /** Nom de la figure, pour lever l'ambiguïté des lecteurs d'écran. */
  titre: string;
  className?: string;
}

const OPTIONS: { vue: Vue; libelle: string }[] = [
  { vue: 'graphique', libelle: 'Graphique' },
  { vue: 'tableau', libelle: 'Tableau' },
];

/** Segmented control « Graphique · Tableau » (spec 03 §5.8). */
export function BasculeGraphiqueTableau({
  vue,
  onChange,
  titre,
  className,
}: BasculeGraphiqueTableauProps) {
  return (
    <div
      role="group"
      aria-label={`Affichage : ${titre}`}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[10px] bg-surface-2 p-[3px]',
        className,
      )}
    >
      {OPTIONS.map((o) => {
        const actif = o.vue === vue;
        return (
          <button
            key={o.vue}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(o.vue)}
            className={cn(
              'h-[26px] rounded-lg px-2.5 text-13 font-medium transition-colors',
              actif
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}
