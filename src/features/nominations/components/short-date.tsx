import { dayjs } from '@/utils/dates';

/** « 1er oct. 2026 » (ordinal en exposant), « 30 sept. 2029 » : dates courtes des maquettes DIO. */
export const ShortDate = ({ iso }: { iso: string }) => {
  const d = dayjs(iso);
  return (
    <time dateTime={d.format('YYYY-MM-DD')} className="whitespace-nowrap">
      {d.date() === 1 ? (
        <>
          1<sup className="text-11 leading-none">er</sup>&nbsp;
          {d.format('MMM YYYY')}
        </>
      ) : (
        d.format('D MMM YYYY')
      )}
    </time>
  );
};
