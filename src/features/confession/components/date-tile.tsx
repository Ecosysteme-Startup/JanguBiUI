import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

/**
 * Pavé de date (FID-Pretres, FID-Confession-RDV, FID-Conversation) : jour abrégé, numéro, mois.
 * `lg` 64 × 72 (sam. / 26 / sept.), `sm` 44 × 48 sans le mois.
 */
export const DateTile = ({ date, size = 'lg', className }: { date: string; size?: 'sm' | 'lg'; className?: string }) => {
  const d = dayjs(date);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 flex-col items-center justify-center border border-line bg-paper text-tint-800',
        size === 'lg' ? 'h-[72px] w-16 rounded-12' : 'h-12 w-11 rounded-10',
        className,
      )}
    >
      <span className={size === 'lg' ? 'text-12' : 'text-11'}>{d.format('ddd')}</span>
      <span className={cn('tnum font-semibold', size === 'lg' ? 'text-24 leading-7' : 'text-17 leading-5')}>{d.format('D')}</span>
      {size === 'lg' && <span className="text-12">{d.format('MMM')}</span>}
    </span>
  );
};
