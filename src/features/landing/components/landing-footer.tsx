import NextLink from 'next/link';

import { paths } from '@/config/paths';

const LogoMark = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 30 30"
    fill="none"
    aria-hidden
    className="text-primary"
  >
    <rect x="12.5" y="2" width="5" height="26" rx="2.5" fill="currentColor" />
    <rect x="3" y="9.5" width="24" height="5" rx="2.5" fill="currentColor" />
    <circle cx="15" cy="12" r="3" fill="hsl(var(--background))" />
  </svg>
);

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="mb-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
              <LogoMark />
              Jàngu Bi
            </div>
            <p className="max-w-[26ch] text-[0.875rem] leading-relaxed text-muted-foreground">
              L&apos;Église du Sénégal dans votre poche.
            </p>
          </div>

          {/* Fonctionnalités — destinations réelles (l'accès demande une
              connexion, le middleware redirige vers /auth/login). */}
          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-muted-foreground">
              Fonctionnalités
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'Bible', href: paths.app.bible.getHref() },
                { label: 'Rosaire', href: paths.app.chapelet.getHref() },
                { label: 'Liturgie', href: paths.app.spirituelLiturgie.getHref() },
                { label: 'Actualités', href: paths.app.actus.getHref() },
                { label: 'Messagerie', href: paths.app.messages.getHref() },
                { label: 'Dons & Quêtes', href: paths.app.dons.getHref() },
              ].map((item) => (
                <li key={item.label}>
                  <NextLink
                    href={item.href}
                    className="text-[0.875rem] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Paroisses & Légal — ces pages n'existent pas encore. Elles étaient
              rendues en `href="#"` : des liens d'apparence cliquable qui ne
              menaient nulle part. Tant qu'elles ne sont pas écrites, on les
              affiche en texte simple plutôt que de promettre une destination.
              ⚠️ Les CGU sont un cas sensible : la messagerie fait ACCEPTER des
              conditions que l'utilisateur ne peut donc pas lire. */}
          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-muted-foreground">
              Paroisses
            </p>
            <ul className="flex flex-col gap-2.5">
              {['Annuaire', 'Rejoindre', 'Contact'].map((item) => (
                <li
                  key={item}
                  className="text-[0.875rem] text-muted-foreground/60"
                >
                  {item} <span className="text-[0.75rem]">· bientôt</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[.1em] text-muted-foreground">
              Légal
            </p>
            <ul className="flex flex-col gap-2.5">
              {['CGU', 'Confidentialité', 'Mentions légales'].map((item) => (
                <li
                  key={item}
                  className="text-[0.875rem] text-muted-foreground/60"
                >
                  {item} <span className="text-[0.75rem]">· bientôt</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="mb-6 border-border" />
        <p className="text-[0.75rem] text-muted-foreground">
          © 2026 Jàngu Bi · Fait avec ❤️ pour l&apos;Église catholique du
          Sénégal
        </p>
      </div>
    </footer>
  );
}
