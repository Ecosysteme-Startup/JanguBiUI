import NextLink from 'next/link';

import { LiturgicalPill } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { dayNumber, dayjs, longDate } from '@/utils/dates';

/** Couleur liturgique du jour : pastille seule (DS-Fondations §01). */
export const LITURGICAL_COLORS = {
  vert: { label: 'Vert', cls: 'border-lit-green text-lit-green', dot: 'bg-lit-green' },
  violet: { label: 'Violet', cls: 'border-lit-violet text-lit-violet', dot: 'bg-lit-violet' },
  blanc: { label: 'Blanc', cls: 'border-lit-gold text-lit-gold-text', dot: 'bg-lit-gold' },
  rouge: { label: 'Rouge', cls: 'border-lit-red text-lit-red', dot: 'bg-lit-red' },
  rose: { label: 'Rose', cls: 'border-lit-rose text-lit-rose-text', dot: 'bg-lit-rose' },
} as const;
export type LiturgicalColor = keyof typeof LITURGICAL_COLORS;

export type LiturgicalBannerData = {
  date: string;
  celebration: string;
  color: string;
  references: string[];
};

/** Pastille de couleur liturgique (WEB-Design-System) : délègue à <LiturgicalPill>. */
export const LiturgicalColorPill = ({ color, compact }: { color: string; compact?: boolean }) => (
  <LiturgicalPill
    color={color}
    title={`Couleur liturgique du jour : ${(LITURGICAL_COLORS[color as LiturgicalColor] ?? LITURGICAL_COLORS.vert).label.toLowerCase()}`}
    className={compact ? 'h-[22px]' : undefined}
  />
);

/** Ex. « Jeudi de la 25e semaine… » : met le « e » des ordinaux en exposant. */
export const Ordinals = ({ text }: { text: string }) => (
  <>
    {text.split(/(\d+(?:e|re|er))/g).map((part, i) => {
      const m = /^(\d+)(e|re|er)$/.exec(part);
      return m ? (
        <span key={i}>
          {m[1]}
          <sup className="text-[0.62em]">{m[2]}</sup>
        </span>
      ) : (
        <span key={i}>{part}</span>
      );
    })}
  </>
);

/**
 * La signature (DS-Fondations §03) : date longue + jour de l'année, temps liturgique,
 * pastille de couleur, références vers la Parole, filet double de 3 px.
 * Variantes : desktop (40 px), mobile (36 px, abrégé), back-office (36 px).
 *
 * Responsive (A11Y-07, recette Chrome C1) : hauteur minimale et non fixe, éléments sur une
 * ligne (`whitespace-nowrap`) ; sous `md`, date abrégée et temps liturgique masqué ; les
 * références et le temps liturgique se tronquent (texte complet en infobulle et dans le nom
 * accessible) plutôt que de passer sur deux lignes ou de chevaucher le filet.
 */
export const LiturgicalBanner = ({
  data,
  href,
  variant = 'desktop',
  className,
}: {
  data?: LiturgicalBannerData | null;
  href: string;
  variant?: 'desktop' | 'mobile' | 'backoffice';
  className?: string;
}) => {
  const date = data?.date ?? dayjs().format('YYYY-MM-DD');
  const refs = data?.references?.filter(Boolean).join(' · ');
  if (variant === 'mobile') {
    return (
      <div className={cn('rule-double tnum flex min-h-9 items-center justify-between gap-3 px-4 text-meta text-ink', className)}>
        <span className="min-w-0 truncate">
          {dayjs(date).format('ddd D MMM')}
          {data && (
            <>
              {' · '}
              <Ordinals text={data.celebration} />
            </>
          )}
        </span>
        {data && (
          <span className="shrink-0">
            <LiturgicalColorPill color={data.color} compact />
          </span>
        )}
      </div>
    );
  }
  const label = refs || 'La Parole du jour';
  return (
    <div
      className={cn(
        'rule-double tnum flex shrink-0 items-center justify-between gap-4 whitespace-nowrap py-1 text-meta text-ink md:gap-6',
        variant === 'desktop' ? 'min-h-10 px-16' : 'min-h-9 px-8',
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-4">
        <span className="md:hidden">{dayjs(date).format('ddd D MMM')}</span>
        <span className="hidden md:inline">{longDate(date)}</span>
        <span className="hidden text-ink-3 sm:inline">Jour {dayNumber(date)}</span>
      </span>
      {data && (
        <span className="hidden min-w-0 items-center gap-3 md:flex">
          <span className="min-w-0 truncate" title={data.celebration}>
            <Ordinals text={data.celebration} />
          </span>
          <span className="shrink-0">
            <LiturgicalColorPill color={data.color} />
          </span>
        </span>
      )}
      <NextLink href={href} title={refs ? label : undefined} className="hit group flex min-w-0 items-center text-primary">
        <span className="truncate border-b border-tint-200 pb-px group-hover:border-primary-strong">{label}</span>
      </NextLink>
    </div>
  );
};
