import { cn } from '@/utils/cn';

export const TEXT_SIZES = {
  normal: { label: 'Texte normal', button: 'text-body', reading: 'text-body leading-[1.7]' },
  grand: { label: 'Texte grand', button: 'text-[21px]', reading: 'text-lead leading-[1.7]' },
  'tres-grand': { label: 'Texte très grand', button: 'text-[26px]', reading: 'text-[21px] leading-[1.7]' },
} as const;
export type TextSize = keyof typeof TEXT_SIZES;

/** Trois tailles de lecture (maquette FID-Parole) ; « grand » par défaut. */
export const TextSizeControl = ({ value, onChange }: { value: TextSize; onChange: (size: TextSize) => void }) => (
  <div className="flex items-center gap-2">
    <span id="parole-taille" className="tnum text-meta text-ink-3">
      Taille du texte
    </span>
    <div role="group" aria-labelledby="parole-taille" className="flex items-center gap-2">
      {(Object.keys(TEXT_SIZES) as TextSize[]).map((size) => {
        const pressed = size === value;
        return (
          <button
            key={size}
            type="button"
            aria-pressed={pressed}
            aria-label={TEXT_SIZES[size].label}
            onClick={() => onChange(size)}
            className={cn(
              'hit inline-flex size-10 items-center justify-center rounded border font-serif leading-none transition-colors',
              TEXT_SIZES[size].button,
              pressed ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:bg-surface-2',
            )}
          >
            A
          </button>
        );
      })}
    </div>
  </div>
);
