import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { Brand, Logo } from '@/components/layouts/brand';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

const LEGAL = [
  { label: 'Confidentialité', href: paths.confidentialite.getHref() },
  { label: 'Conditions d’utilisation', href: paths.conditions.getHref() },
  { label: 'Aide', href: paths.aide.getHref() },
];

/** Pied de page mince (64 px) du parcours d'inscription et de la connexion. */
export const AuthFooter = ({ withLaw = true, tone = 'surface' }: { withLaw?: boolean; tone?: 'surface' | 'transparent' }) => (
  <footer className={cn('border-t border-line', tone === 'surface' && 'bg-surface')}>
    <div className="jb-container flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-13 text-ink-3">
      <span>
        © {new Date().getFullYear()} Numerisen, Dakar{withLaw && <> · Protection des données personnelles&nbsp;: loi n°&nbsp;2008-12</>}
      </span>
      <nav aria-label="Informations" className="flex flex-wrap items-center gap-6">
        {LEGAL.map((link) => (
          <NextLink key={link.label} href={link.href} className="text-ink-2 hover:text-ink">
            {link.label}
          </NextLink>
        ))}
      </nav>
    </div>
  </footer>
);

type AuthShellProps = {
  /** Action à droite de l'en-tête ; défaut : « Déjà un compte ? » + « Se connecter » (contour). */
  headerAction?: ReactNode;
  /** Panneau de droite (colonne de 624 px sur fond surface) ; la page peut aussi composer sa propre grille. */
  aside?: ReactNode;
  /** @deprecated Texte sous le panneau (ancienne charte) : rendu sous le panneau `aside`. */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * Coquille du parcours d'inscription (WEB-Inscription-Compte, -Paroisse, -Consentement) :
 * en-tête 72 px (logotype, action à droite), <main> 1200 px (padding 32/48), pied de page mince.
 */
export const AuthShell = ({ headerAction, aside, footer, children }: AuthShellProps) => (
  <div className="flex min-h-dvh flex-col bg-paper">
    <header className="border-b border-line bg-paper">
      <div className="jb-container flex h-18 items-center justify-between gap-4">
        <Brand href={paths.home.getHref()} label="Jàngu Bi, accueil" />
        {headerAction ?? (
          <div className="flex items-center gap-3 text-15 text-ink-2">
            <span className="hidden sm:inline">Déjà un compte&nbsp;?</span>
            <Button asChild variant="outline">
              <a href={paths.auth.connexion.getHref()}>Se connecter</a>
            </Button>
          </div>
        )}
      </div>
    </header>
    <main id="contenu" className="jb-container flex-1 pb-12 pt-8">
      {aside ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,624px)] lg:justify-between">
          <div className="min-w-0">{children}</div>
          <aside className="self-start rounded-16 border border-line bg-surface p-6 lg:p-10">
            {aside}
            {footer && <div className="mt-6 text-14 text-ink-2">{footer}</div>}
          </aside>
        </div>
      ) : (
        children
      )}
    </main>
    <AuthFooter />
  </div>
);

/** Citation de l'Écriture (Source Serif 4 italique 18/28, référence en Libre Franklin). */
export const AsideVerse = ({ eyebrow, verse, reference, children }: { eyebrow: string; verse: string; reference: string; children?: ReactNode }) => (
  <figure className="m-0">
    <p className="m-0 text-14 text-ink-3">{eyebrow}</p>
    <blockquote className="m-0 mt-3 font-serif text-18 italic text-ink">« {verse} »</blockquote>
    <figcaption className="mt-2 text-14 text-ink-2">{reference}</figcaption>
    {children && <div className="mt-6 border-t border-line pt-4 text-15 text-ink-2">{children}</div>}
  </figure>
);

/**
 * Page centrée (WEB-Connexion) : fond surface, logotype 40 px, carte de 440 px (rayon 16, padding
 * 40, ombre carte), pied de page mince. Pour les écrans hors coquille (erreurs de connexion…).
 */
export const CenteredShell = ({ children, below }: { children: ReactNode; below?: ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-surface">
    <div className="flex flex-1 flex-col items-center px-4 pb-10 pt-10">
      <NextLink href={paths.home.getHref()} aria-label="Jàngu Bi, retour à l’accueil" className="hover:text-ink">
        <Logo size="lg" />
      </NextLink>
      <main id="contenu" className="mt-6 w-full max-w-[440px] rounded-16 border border-line bg-paper p-6 shadow-card sm:p-10">
        {children}
      </main>
      {below && <div className="mt-6 text-13 text-ink-2">{below}</div>}
    </div>
    <AuthFooter withLaw={false} tone="transparent" />
  </div>
);
