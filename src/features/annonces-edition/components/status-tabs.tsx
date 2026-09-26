import { cn } from '@/utils/cn';

export type TabItem<K extends string> = { key: K; label: string; count?: number };

/**
 * Onglets d'état de PAR-Annonces : 44 px, écart 28, soulignement b600 de 2 px, compteur en
 * pilule 20 px (b100 / b800 actif, surface2 / ink2 sinon). Composition locale : la primitive
 * `Tabs` n'a pas encore le compteur en pilule (demande aux fondations, lot F).
 */
export const StatusTabs = <K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) => (
  <div role="tablist" aria-label={label} className="flex gap-7 overflow-x-auto border-b border-line">
    {items.map((t) => {
      const active = value === t.key;
      return (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-0.5 text-15 transition-colors',
            active ? 'border-primary font-semibold text-ink' : 'border-transparent font-medium text-ink-3 hover:text-primary-strong',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                'tnum inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-12 font-semibold',
                active ? 'bg-tint-100 text-tint-800' : 'bg-surface-2 text-ink-2',
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
