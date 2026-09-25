import NextLink from 'next/link';

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

export const LiturgicalColorPill = ({ color, compact }: { color: string; compact?: boolean }) => {
  const c = LITURGICAL_COLORS[color as LiturgicalColor] ?? LITURGICAL_COLORS.vert;
  return (
    <span
      title={`Couleur liturgique du jour : ${c.label.toLowerCase()}`}
      className={cn('inline-flex h-[22px] items-center gap-1.5 rounded-full border pl-2 pr-2.5', c.cls, compact && 'h-5')}
    >
      <span className={cn('inline-block size-2 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
};

/** Ex. « Jeudi de la 25e semaine… » : met le « e » des ordinaux en exposant. */
const Ordinals = ({ text }: { text: string }) => (
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
      <div className={cn('rule-double tnum flex h-9 items-center justify-between gap-3 px-4 text-meta text-ink', className)}>
        <span className="truncate">
          {dayjs(date).format('ddd D MMM')}
          {data && (
            <>
              {' · '}
              <Ordinals text={data.celebration} />
            </>
          )}
        </span>
        {data && <LiturgicalColorPill color={data.color} compact />}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'rule-double tnum flex shrink-0 items-center justify-between gap-6 text-meta text-ink',
        variant === 'desktop' ? 'h-10 px-16' : 'h-9 px-8',
        className,
      )}
    >
      <span className="flex items-center gap-4">
        <span>{longDate(date)}</span>
        <span className="text-ink-3">Jour {dayNumber(date)}</span>
      </span>
      {data && (
        <span className="hidden items-center gap-3 md:flex">
          <span>
            <Ordinals text={data.celebration} />
          </span>
          <LiturgicalColorPill color={data.color} />
        </span>
      )}
      {refs ? (
        <NextLink href={href} className="border-b border-tint-200 pb-px text-primary hover:border-primary-strong">
          {refs}
        </NextLink>
      ) : (
        <NextLink href={href} className="border-b border-tint-200 pb-px text-primary">
          La Parole du jour
        </NextLink>
      )}
    </div>
  );
};
