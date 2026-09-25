import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { LiturgyBannerSlot } from '@/components/layouts/liturgy-banner-slot';
import { paths } from '@/config/paths';

type AuthShellProps = { aside: ReactNode; footer?: ReactNode; children: ReactNode };

/**
 * Shell des pages d'inscription (PUB-Inscription-*) : bandeau, panneau éditorial « nuit »
 * de 480 px, formulaire. La connexion et l'étape 1 vivent dans le thème Keycloak (même charte).
 */
export const AuthShell = ({ aside, footer, children }: AuthShellProps) => (
  <div className="flex min-h-dvh flex-col bg-paper">
    <LiturgyBannerSlot href={paths.parole.getHref()} className="px-4 md:px-8" />
    <div className="grid flex-1 lg:grid-cols-[480px_minmax(0,1fr)]">
      <aside className="flex flex-col justify-between gap-10 bg-night px-6 py-10 text-on-night lg:px-14 lg:py-12">
        <NextLink href={paths.home.getHref()} aria-label="Jàngu Bi, page d’accueil" className="flex items-baseline gap-3 text-on-primary hover:text-on-primary">
          <span className="font-serif text-[36px] leading-none tracking-[-0.01em]">Jàngu Bi</span>
          <span className="tnum text-meta text-on-night-muted">La Leçon</span>
        </NextLink>
        <div>{aside}</div>
        {footer && <div className="text-base text-tint-200">{footer}</div>}
      </aside>
      <main id="contenu" className="px-4 py-8 lg:px-16 lg:pb-8 lg:pt-10">
        <div className="mx-auto max-w-[832px]">{children}</div>
      </main>
    </div>
  </div>
);

/** Citation de l'Écriture du panneau éditorial. */
export const AsideVerse = ({ eyebrow, verse, reference, children }: { eyebrow: string; verse: string; reference: string; children?: ReactNode }) => (
  <figure className="m-0">
    <p className="tnum m-0 text-meta text-on-night-muted">{eyebrow}</p>
    <blockquote className="m-0 mt-5 font-serif text-h2 italic leading-[1.12] text-on-primary">« {verse} »</blockquote>
    <figcaption className="tnum mt-5 text-xs text-tint-200">{reference}</figcaption>
    {children && <div className="mt-12 border-t border-night-2 pt-4 text-base leading-relaxed text-on-night">{children}</div>}
  </figure>
);
