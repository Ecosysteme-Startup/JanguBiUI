import NextLink from 'next/link';
import type * as React from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { paths } from '@/config/paths';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';

import type { FundStatus } from '../../types/schemas';

/** Carte des écrans Dons (maquettes WEB-PAR-Dons*) : rayon 16, bordure line, ombre carte. */
export const panelClasses =
  'rounded-16 border border-line bg-paper shadow-card';

export const Panel = ({
  labelledBy,
  className,
  children,
  id,
}: {
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={cn(panelClasses, className)}
  >
    {children}
  </section>
);

export const PanelTitle = ({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 id={id} className={cn('m-0 text-20 font-semibold text-ink', className)}>
    {children}
  </h2>
);

/** Tableau des maquettes : en-tête surface 13/500 ink3, rangées filetées, marges 24. */
export const DataTable = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <ScrollRegion label={`${label}, défilement horizontal`}>
    <table className={cn('w-full border-collapse text-14 text-ink', className)}>
      {children}
    </table>
  </ScrollRegion>
);

export const DTh = ({
  className,
  children,
  align,
}: {
  className?: string;
  children?: React.ReactNode;
  align?: 'right';
}) => (
  <th
    scope="col"
    className={cn(
      'whitespace-nowrap border-t border-line bg-surface px-2 py-2 text-left text-13 font-medium text-ink-3 first:pl-6 last:pr-6',
      align === 'right' && 'text-right',
      className,
    )}
  >
    {children}
  </th>
);

export const DTd = ({
  className,
  children,
  align,
}: {
  className?: string;
  children?: React.ReactNode;
  align?: 'right';
}) => (
  <td
    className={cn(
      'border-t border-line px-2 py-2 align-middle first:pl-6 last:pr-6',
      align === 'right' && 'text-right',
      className,
    )}
  >
    {children}
  </td>
);

/** Échec d'un chargement : 403 → accès réservé, sinon le message du serveur. */
export const QueryFailure = ({
  error,
  nodeId,
  what,
}: {
  error: unknown;
  nodeId: string;
  what: string;
}) =>
  isForbidden(error) ? (
    <EmptyState icon="cadenas" title={`${what} : accès réservé`}>
      Vos nominations sur ce nœud ne donnent pas accès à cette information.{' '}
      <NextLink href={paths.espace.root.getHref(nodeId)}>
        Revenir au tableau de bord
      </NextLink>
    </EmptyState>
  ) : (
    <EmptyState
      icon="erreur"
      tone="err"
      title={`${what} : chargement impossible`}
    >
      {apiErrorMessage(error)}
    </EmptyState>
  );

const FUND_STATUS: Record<FundStatus, { label: string; tone: BadgeTone }> = {
  brouillon: { label: 'Brouillon', tone: 'neutral' },
  ouvert: { label: 'Ouvert', tone: 'ok' },
  clos: { label: 'Clos', tone: 'muted' },
};

export const FundStatusBadge = ({
  status,
}: {
  status: FundStatus | undefined;
}) => {
  const s = FUND_STATUS[status ?? 'brouillon'];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
};

/** Étiquette de type (22 px, rayon 6, surface2, 12/500). */
export const KindTag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-5.5 items-center whitespace-nowrap rounded-6 bg-surface-2 px-2 text-12 font-medium text-ink-2">
    {children}
  </span>
);

/** Libellé d'un champ obligatoire : astérisque rouge des maquettes, masqué au lecteur d'écran (Field annonce « obligatoire »). */
export const Req = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <span aria-hidden="true" className="text-err">
      {' '}
      *
    </span>
  </>
);
