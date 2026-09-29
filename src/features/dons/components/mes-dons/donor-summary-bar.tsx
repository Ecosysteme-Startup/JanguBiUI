import { Icon } from '@/components/ui/icon';
import { SkeletonLine } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { atParish, parishLabel } from '@/utils/parish-name';
import { pluralWord } from '@/utils/plural';

import type { DonorSummary } from '../../types/schemas';
import { amount, fcfa } from '../../utils/format';

const NBSP = '\u00a0';

/** « confirmés, à la paroisse Saint-Dominique » (ou « dans 2 paroisses »). */
const where = (summary: DonorSummary) => {
  const parishes = [...new Set(summary.by_fund.map((f) => f.parish))];
  const confirmed = pluralWord(summary.count, 'confirmé', 'confirmés');
  if (parishes.length === 1)
    return `${confirmed}, ${atParish(parishLabel(parishes[0]))}`;
  if (parishes.length > 1)
    return `${confirmed}, dans ${parishes.length} paroisses`;
  return confirmed;
};

/** Total de l'année, visible par le seul fidèle (WEB-FID-Mes-Dons) : jamais de classement. */
export const DonorSummaryBar = ({
  year,
  summary,
  isPending,
  className,
}: {
  year: number;
  summary: DonorSummary | undefined;
  isPending: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-16 border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
      className,
    )}
  >
    {isPending || !summary ? (
      <p className="m-0 w-full max-w-md" role="status">
        <span className="sr-only">Chargement du total de l’année…</span>
        <SkeletonLine width="w-full" />
      </p>
    ) : (
      <p className="tnum m-0 text-17 text-ink">
        {summary.count === 0 ? (
          <span className="font-semibold">
            {year}
            {NBSP}: aucun don confirmé
          </span>
        ) : (
          <>
            <span className="font-semibold">
              {year}
              {NBSP}: {fcfa(summary.total)}, {amount(summary.count)}
              {NBSP}
              {pluralWord(summary.count, 'don', 'dons')}
            </span>{' '}
            <span className="text-15 text-ink-2">{where(summary)}</span>
          </>
        )}
      </p>
    )}
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-14 text-ink-2">
      <Icon name="cadenas" size={16} className="text-ink-3" />
      Visible par vous seul.
    </span>
  </div>
);
