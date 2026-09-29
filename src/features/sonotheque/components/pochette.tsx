import { cn } from '@/utils/cn';

import { monogramme } from '../utils/format';

// Pochettes (spec C2 §1) : aplats de tokens avec un motif (arc, rosace, rayons,
// croix) et un monogramme. Le carême prend le violet liturgique. Les couleurs
// sont celles des maquettes : une pochette est une image, fixe en clair comme
// en sombre.
type Motif = 'arc' | 'rosace' | 'rayons' | 'croix';

const TEINTES: Record<string, { fond: string; encre: string; motif: Motif }> = {
  messe: { fond: '#06466C', encre: '#D9EBF7', motif: 'croix' },
  homelies: { fond: '#D9EBF7', encre: '#06466C', motif: 'rayons' },
  album: { fond: '#0A6BA3', encre: '#EEF6FC', motif: 'rosace' },
  retraite: { fond: '#052F49', encre: '#B3D8F0', motif: 'arc' },
  careme: { fond: '#5B3A7E', encre: '#EDE3F7', motif: 'arc' },
  chorale: { fond: '#0A6BA3', encre: '#EEF6FC', motif: 'rosace' },
  paroisse: { fond: '#06466C', encre: '#D9EBF7', motif: 'croix' },
  mouvement: { fond: '#EDF3F9', encre: '#06466C', motif: 'rayons' },
  playlist: { fond: '#052F49', encre: '#D9EBF7', motif: 'rayons' },
};

function MotifSvg({ motif, encre }: { motif: Motif; encre: string }) {
  const commun = {
    stroke: encre,
    strokeWidth: 1.2,
    fill: 'none',
    opacity: 0.35,
  };
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden
    >
      {motif === 'arc' &&
        [30, 42, 54, 66].map((r) => (
          <path
            key={r}
            d={`M ${50 - r} 100 A ${r} ${r} 0 0 1 ${50 + r} 100`}
            {...commun}
          />
        ))}
      {motif === 'rosace' &&
        [0, 30, 60, 90, 120, 150].map((a) => (
          <ellipse
            key={a}
            cx="50"
            cy="50"
            rx="34"
            ry="12"
            transform={`rotate(${a} 50 50)`}
            {...commun}
          />
        ))}
      {motif === 'rayons' &&
        Array.from({ length: 12 }, (_, i) => i * 15 - 82).map((a) => (
          <line
            key={a}
            x1="50"
            y1="110"
            x2={50 + 90 * Math.sin((a * Math.PI) / 180)}
            y2={110 - 90 * Math.cos((a * Math.PI) / 180)}
            {...commun}
          />
        ))}
      {motif === 'croix' && (
        <>
          <line x1="50" y1="14" x2="50" y2="86" {...commun} strokeWidth={2} />
          <line x1="28" y1="36" x2="72" y2="36" {...commun} strokeWidth={2} />
          <circle cx="50" cy="50" r="40" {...commun} />
        </>
      )}
    </svg>
  );
}

interface PochetteProps {
  titre: string;
  /** Genre d'album, de source, ou « playlist ». */
  genre?: string;
  /** Temps liturgique : « careme » force le violet liturgique. */
  temps?: string;
  className?: string;
  /** Taille du monogramme. */
  monoClassName?: string;
  imageUrl?: string | null;
}

export function Pochette({
  titre,
  genre = 'album',
  temps,
  className,
  monoClassName = 'text-lg',
  imageUrl,
}: PochetteProps) {
  const t = TEINTES[temps === 'careme' ? 'careme' : genre] ?? TEINTES.album;
  return (
    <span
      aria-hidden
      className={cn(
        'relative block shrink-0 overflow-hidden rounded-lg',
        className,
      )}
      style={{ background: t.fond, color: t.encre }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <MotifSvg motif={t.motif} encre={t.encre} />
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center font-serif font-semibold tracking-wide',
              monoClassName,
            )}
          >
            {monogramme(titre)}
          </span>
        </>
      )}
    </span>
  );
}
