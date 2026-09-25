import type { Metadata } from 'next';

import { ParoleView } from '@/features/parole/components/parole-view';
import { parseIsoDate } from '@/features/parole/utils/liturgy';

export const metadata: Metadata = { title: 'Lectures du jour' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// La date est dans l'URL (`?date=AAAA-MM-JJ`) : une date invalide sert le jour courant.
const ParolePage = async ({ searchParams }: Props) => {
  const { date } = await searchParams;
  return <ParoleView date={parseIsoDate(typeof date === 'string' ? date : undefined)} />;
};

export default ParolePage;
