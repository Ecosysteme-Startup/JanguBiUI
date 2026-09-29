import { cn } from '@/utils/cn';

const RATIOS = { '16:9': 'aspect-video', '4:3': 'aspect-[4/3]', '3:2': 'aspect-[3/2]', '1:1': 'aspect-square', '3:4': 'aspect-[3/4]' } as const;

/**
 * Emplacement photo art-dirigé (spec §1) : un dessin au trait en attendant de vraies
 * photos. `data-photo-slot` sert à les remplacer. Jamais de photo factice.
 */
export const PhotoSlot = ({
  slot,
  caption,
  ratio = '16:9',
  className,
  showCaption = true,
}: {
  slot: string;
  caption: string;
  ratio?: keyof typeof RATIOS;
  className?: string;
  showCaption?: boolean;
}) => (
  <figure data-photo-slot={slot} className={cn('m-0', className)}>
    <div role="img" aria-label={`Emplacement photo : ${caption}`} className={cn('relative overflow-hidden border border-line bg-tint-50', RATIOS[ratio])}>
      <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden="true">
        <path d="M44 90V52a36 36 0 0 1 72 0v38" fill="none" stroke="var(--jb-tint-200)" strokeWidth="0.8" />
        <path d="M54 90V52a26 26 0 0 1 52 0v38" fill="none" stroke="var(--jb-tint-200)" strokeWidth="0.5" />
        <path d="M80 18v72" stroke="var(--jb-tint-200)" strokeWidth="0.5" />
        <path d="M74 30h12" stroke="var(--jb-tint-300)" strokeWidth="0.6" />
      </svg>
    </div>
    {showCaption && (
      <figcaption className="tnum mt-2 flex justify-between gap-4 text-meta text-ink-3">
        <span>PHOTO · {caption}</span>
        <span>{ratio}</span>
      </figcaption>
    )}
  </figure>
);
