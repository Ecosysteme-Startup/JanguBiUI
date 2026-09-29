import type { Metadata } from 'next';

import { SourceVue } from '@/features/sonotheque/components/source-vue';

export const metadata: Metadata = { title: 'Source', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

const SourcePage = async ({ params }: Props) => (
  <SourceVue sourceId={decodeURIComponent((await params).id)} />
);

export default SourcePage;
