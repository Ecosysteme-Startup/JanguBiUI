import type { ReactNode } from 'react';

import { PublicShell } from '@/components/layouts/public-shell';

const PublicLayout = ({ children }: { children: ReactNode }) => <PublicShell>{children}</PublicShell>;

export default PublicLayout;
