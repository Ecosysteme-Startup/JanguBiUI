import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BackofficeShell } from '@/components/layouts/backoffice-shell';

export const metadata: Metadata = { title: 'Back-office', robots: { index: false } };

type Props = { children: ReactNode; params: Promise<{ nodeId: string }> };

const EspaceLayout = async ({ children, params }: Props) => {
  const { nodeId } = await params;
  return <BackofficeShell nodeId={decodeURIComponent(nodeId)}>{children}</BackofficeShell>;
};

export default EspaceLayout;
