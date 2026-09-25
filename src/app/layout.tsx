import type { ReactNode } from 'react';

import '@/styles/globals.css';

export const metadata = {
  title: 'Jàngu Bi',
  description: 'La Parole, la vie de votre paroisse et vos démarches, pour les fidèles catholiques du Sénégal.',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="fr" suppressHydrationWarning>
    <body>{children}</body>
  </html>
);

export default RootLayout;
