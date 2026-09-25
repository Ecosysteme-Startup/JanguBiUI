import { cn } from '@/utils/cn';

/**
 * Titre de section « à la une » : filet d'encre au-dessus, numéro bleu en légende,
 * indication à droite (DS-Composants, en-têtes de planches et de blocs).
 */
export const SectionHeading = ({
  id,
  number,
  title,
  aside,
  className,
  as: Tag = 'h2',
}: {
  id?: string;
  number?: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}) => (
  <div className={cn('tnum mb-3 flex items-baseline justify-between gap-4 border-t border-line-strong pt-2 text-meta text-ink-2', className)}>
    <Tag id={id} className="m-0 text-meta font-normal">
      {number && <span className="text-primary">{number}</span>}
      {number && ' — '}
      {title}
    </Tag>
    {aside && <span>{aside}</span>}
  </div>
);

/** Légende 12 px en chiffres tabulaires (ex. « Étape 1 sur 3 », dates, références). */
export const Meta = ({ className, children, tone = 'muted' }: { className?: string; children: React.ReactNode; tone?: 'muted' | 'primary' | 'ink' | 'err' }) => (
  <p
    className={cn(
      'tnum m-0 text-meta',
      { muted: 'text-ink-3', primary: 'text-primary', ink: 'text-ink', err: 'text-err' }[tone],
      className,
    )}
  >
    {children}
  </p>
);
