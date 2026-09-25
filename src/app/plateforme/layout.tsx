import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BackofficeShell } from '@/components/layouts/backoffice-shell';

export const metadata: Metadata = { title: 'Plateforme', robots: { index: false } };

const PlateformeLayout = ({ children }: { children: ReactNode }) => <BackofficeShell nodeId={null}>{children}</BackofficeShell>;

export default PlateformeLayout;
