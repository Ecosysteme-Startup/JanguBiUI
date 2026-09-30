import type { ReactNode } from 'react';

import { PageTransition } from '@/lib/motion/page-transition';

// Recréé à chaque navigation dans le back-office : fondu d'entrée de 180 ms (opacité seule).
export default function EspaceTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
