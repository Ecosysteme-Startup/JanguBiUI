import { dayjs } from '@/utils/dates';

const NBSP = '\u00a0';

/** « 1er juin 2026 », « lundi 21 septembre 2026 » : insécable entre jour et mois, ordinal en exposant. */
export const FrenchDate = ({
  value,
  format = 'D MMMM YYYY',
}: {
  value: string;
  format?: string;
}) => {
  const d = dayjs(value);
  const text = d.format(format).replace(/\b(\d{1,2}) (?=\D)/, `$1${NBSP}`);
  const [before, after] = text.split(new RegExp(`\\b1(?=${NBSP})`));
  if (d.date() !== 1 || after === undefined) return <>{text}</>;
  return (
    <>
      {before}1<sup className="text-[0.7em] leading-none">er</sup>
      {after}
    </>
  );
};
