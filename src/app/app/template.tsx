import type { ReactNode } from 'react';

import { PageTransition } from '@/lib/motion/page-transition';

// Recréé à chaque navigation dans /app : fondu d'entrée de 180 ms (opacité).
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
