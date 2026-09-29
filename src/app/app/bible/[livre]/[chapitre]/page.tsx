import type { Metadata } from 'next';

import { ChapterReader } from '@/features/bible/components/chapter-reader';

export const metadata: Metadata = { title: 'Bible' };

type Props = { params: Promise<{ livre: string; chapitre: string }> };

const BibleChapterPage = async ({ params }: Props) => {
  const { livre, chapitre } = await params;
  return <ChapterReader livre={decodeURIComponent(livre)} chapitre={Number(chapitre)} />;
};

export default BibleChapterPage;
