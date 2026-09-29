import type { Metadata } from 'next';

import { ChapeletView } from '@/features/chapelet/components/chapelet-view';
import { parseWeekday } from '@/features/chapelet/utils/rosary';

export const metadata: Metadata = { title: 'Chapelet' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// `?jour=0` à `6` (lundi = 0) : prier les mystères d'un autre jour ; sinon ceux du jour.
const ChapeletPage = async ({ searchParams }: Props) => {
  const { jour } = await searchParams;
  return <ChapeletView jour={parseWeekday(typeof jour === 'string' ? jour : undefined)} />;
};

export default ChapeletPage;
