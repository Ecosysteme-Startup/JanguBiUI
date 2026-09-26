import { Libre_Franklin, Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';

import '@/styles/globals.css';

// Polices auto-hébergées par next/font : aucune requête vers Google au runtime (ADR-F05).
// Source Serif 4 : la Parole, les citations bibliques et le logotype. Libre Franklin : toute l'interface.
const serif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-serif',
});

const sans = Libre_Franklin({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: { default: 'Jàngu Bi', template: '%s · Jàngu Bi' },
  description: 'La Parole, la vie de votre paroisse et vos démarches, pour les fidèles catholiques du Sénégal.',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="fr" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
    <body>
      <AppProvider>{children}</AppProvider>
    </body>
  </html>
);

export default RootLayout;
