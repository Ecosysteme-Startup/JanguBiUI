import type { ReactNode } from 'react';

import { PageTransition } from '@/lib/motion/page-transition';

// Recréé à chaque navigation dans /plateforme : fondu d'entrée de 180 ms (opacité seule).
export default function PlateformeTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
