import type { Metadata } from 'next';

import { PourVousAujourdhui } from '@/features/bible/components/pour-vous';
import { ParoleView } from '@/features/parole/components/parole-view';
import { parseIsoDate } from '@/features/parole/utils/liturgy';

export const metadata: Metadata = { title: 'Lectures du jour' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// La date est dans l'URL (`?date=AAAA-MM-JJ`) : une date invalide sert le jour courant.
const ParolePage = async ({ searchParams }: Props) => {
  const { date } = await searchParams;
  return (
    <>
      <ParoleView date={parseIsoDate(typeof date === 'string' ? date : undefined)} />
      {/* « Pour vous aujourd'hui » (API-PAROLE-POUR-VOUS §5) : seulement pour le jour même. */}
      {typeof date !== 'string' && (
        <div className="mx-auto mt-10 w-full max-w-parole">
          <PourVousAujourdhui />
        </div>
      )}
    </>
  );
};

export default ParolePage;
