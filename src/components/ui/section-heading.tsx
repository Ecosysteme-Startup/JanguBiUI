import { cn } from '@/utils/cn';

/**
 * Titre de section (WEB-Design-System, « Typographie ») : Section 24/32 (`lg`) ou sous-section
 * 20/28 (`md`), Libre Franklin 600 ; indication ou action discrète à droite (« Tout voir »).
 * Plus de filet d'encre ni de numérotation « 01 — » (retirés de la charte Ciel).
 */
export const SectionHeading = ({
  id,
  title,
  aside,
  size = 'lg',
  className,
  as: Tag = 'h2',
}: {
  id?: string;
  /** @deprecated Numérotation retirée de la charte Ciel ; ignoré. */
  number?: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  size?: 'lg' | 'md';
  className?: string;
  as?: 'h2' | 'h3';
}) => (
  <div className={cn('mb-4 flex items-baseline justify-between gap-4', className)}>
    <Tag id={id} className={cn('m-0 font-semibold text-ink', size === 'lg' ? 'text-24' : 'text-20')}>
      {title}
    </Tag>
    {aside && <span className="shrink-0 text-14 text-ink-2">{aside}</span>}
  </div>
);

/** Méta 13/18 en chiffres tabulaires (références, dates, « Étape 1 sur 3 »). */
export const Meta = ({ className, children, tone = 'muted' }: { className?: string; children: React.ReactNode; tone?: 'muted' | 'primary' | 'ink' | 'err' }) => (
  <p
    className={cn(
      'tnum m-0 text-13',
      { muted: 'text-ink-3', primary: 'text-primary', ink: 'text-ink', err: 'text-err' }[tone],
      className,
    )}
  >
    {children}
  </p>
);
