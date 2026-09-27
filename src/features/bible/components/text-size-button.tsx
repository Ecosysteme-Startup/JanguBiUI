import { IconButton } from '@/components/ui/icon-button';

export const TEXT_SIZES = {
  normal: { label: 'normal', reading: 'text-20 leading-[1.7]' },
  grand: { label: 'grand', reading: 'text-22 leading-[1.65]' },
  'tres-grand': { label: 'très grand', reading: 'text-24 leading-[1.6]' },
} as const;
export type TextSize = keyof typeof TEXT_SIZES;

const ORDER = Object.keys(TEXT_SIZES) as TextSize[];

/** Bouton « Taille du texte » (FID-Bible) : normal → grand → très grand → normal. */
export const TextSizeButton = ({ value, onChange }: { value: TextSize; onChange: (size: TextSize) => void }) => (
  <IconButton
    icon="taille-texte"
    label={`Taille du texte : ${TEXT_SIZES[value].label}`}
    className="text-ink-2"
    onClick={() => onChange(ORDER[(ORDER.indexOf(value) + 1) % ORDER.length])}
  />
);
