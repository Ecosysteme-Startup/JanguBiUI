import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Carte (WEB-Design-System) : rayon 16, bordure line, ombre carte, fond paper, padding 20.
 * `interactive` : survol bordure b200 (carte cliquable entière, rendue en lien via `asChild`
 * côté appelant ou en enveloppant un <a>). `tone="surface"` : panneau sur fond surface, sans ombre.
 */
export const cardClasses = ({
  interactive = false,
  tone = 'paper',
  padding = 'md',
}: { interactive?: boolean; tone?: 'paper' | 'surface'; padding?: 'none' | 'sm' | 'md' | 'lg' } = {}) =>
  cn(
    'block rounded-16 border border-line text-ink',
    tone === 'paper' ? 'bg-paper shadow-card' : 'bg-surface',
    { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding],
    // Survol : élévation de 2 px et pression 0,97 du mobile (coupées si l'on réduit les animations).
    interactive &&
      'transition-[color,border-color,transform] duration-150 ease-[cubic-bezier(0.33,1,0.68,1)] hover:border-line-active hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99]',
  );

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
  interactive?: boolean;
  tone?: 'paper' | 'surface';
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

export const Card = ({ as: Tag = 'div', interactive, tone, padding, className, ...props }: CardProps) => (
  <Tag className={cn(cardClasses({ interactive, tone, padding }), className)} {...props} />
);

/**
 * En-tête de carte : titre 20/28 (`md`), 18/26 (`aside` : encarts latéraux DIO/PLA) ou 17/24 (`sm`) et action discrète à droite (« Tout voir »).
 * Le titre est un <h2> par défaut ; passer `as="h3"` sous une section titrée.
 */
export const CardHeader = ({
  title,
  action,
  description,
  size = 'md',
  as: Tag = 'h2',
  id,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'aside' | 'md';
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}) => (
  <div className={cn('flex items-start justify-between gap-4', className)}>
    <div className="min-w-0">
      <Tag id={id} className={cn('m-0 font-semibold text-ink', { md: 'text-20', aside: 'text-18 leading-[26px]', sm: 'text-17' }[size])}>
        {title}
      </Tag>
      {description && <p className="m-0 mt-1 text-14 text-ink-2">{description}</p>}
    </div>
    {action && <div className="shrink-0 text-14 font-semibold">{action}</div>}
  </div>
);
