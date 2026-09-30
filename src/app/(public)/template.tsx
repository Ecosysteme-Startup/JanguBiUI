import type { ReactNode } from 'react';

import { PageTransition } from '@/lib/motion/page-transition';

// Recréé à chaque navigation dans les pages publiques : fondu d'entrée de 180 ms (opacité seule).
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
