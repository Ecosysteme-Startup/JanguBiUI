import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { FideleShell } from '@/components/layouts/fidele-shell';

export const metadata: Metadata = { title: 'Mon espace', robots: { index: false } };

const FideleLayout = ({ children }: { children: ReactNode }) => <FideleShell>{children}</FideleShell>;

export default FideleLayout;
