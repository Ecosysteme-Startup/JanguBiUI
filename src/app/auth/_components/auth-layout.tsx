'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';
import { safeRedirect } from '@/utils/safe-redirect';

type LayoutProps = {
  children: ReactNode;
};

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="10" y="2" width="4" height="20" rx="2" />
      <rect x="2" y="8" width="20" height="4" rx="2" />
    </svg>
  );
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/auth/login': { title: 'Connexion', subtitle: 'Heureux de vous revoir' },
  '/auth/register': { title: 'Créer un compte', subtitle: 'Rejoignez la communauté' },
  '/auth/forgot-password': { title: 'Mot de passe oublié', subtitle: 'Réinitialisez votre accès' },
  '/auth/reset-password': { title: 'Nouveau mot de passe', subtitle: 'Choisissez un mot de passe sécurisé' },
  '/auth/verify-email': { title: 'Vérification email', subtitle: 'Confirmez votre adresse' },
  '/auth/revert-email': { title: 'Annulation email', subtitle: 'Rétablissez votre ancienne adresse' },
};

export const AuthLayout = ({ children }: LayoutProps) => {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { title, subtitle } = PAGE_TITLES[pathname ?? ''] ?? {
    title: 'Connexion',
    subtitle: 'Heureux de vous revoir',
  };

  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  // Owner unique de la redirection post-auth : on aligne sur getRoleHomePath
  // (même destination que LoginPage → plus de course vers app.root).
  useEffect(() => {
    if (user.data) {
      // safeRedirect neutralise les destinations externes (`?redirectTo=https://…`) ;
      // son repli est l'accueil du rôle, comme quand aucune destination n'est fournie.
      router.replace(safeRedirect(redirectTo, getRoleHomePath(user.data)));
    }
  }, [user.data, router, redirectTo]);

  // Évite le flash du formulaire pour un utilisateur déjà connecté (ou en cours
  // de résolution de session).
  if (user.isLoading || user.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — always dark */}
      <div className="dark relative hidden overflow-hidden lg:flex lg:w-[42%] lg:flex-col bg-background">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-gold/10" />

        {/* Decorative cross grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex h-full flex-col p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20">
              <CrossIcon className="size-5 text-primary" />
            </div>
            <span className="font-serif text-lg font-bold text-foreground tracking-tight">
              Jàngu Bi
            </span>
          </div>

          {/* Center content */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <CrossIcon className="size-16 text-primary/30 mb-8" />
            <p className="font-serif text-4xl font-bold italic text-foreground leading-tight text-center">
              Plateforme catholique
              <br />
              du Sénégal
            </p>
            <p className="mt-4 text-sm text-foreground/50 tracking-wide">
              Bible · Liturgie · Communauté
            </p>
          </div>

          {/* Quote */}
          <blockquote className="border-l-2 border-gold/50 pl-4">
            <p className="font-serif italic text-foreground/60 text-sm leading-relaxed">
              « Je suis le chemin, la vérité et la vie. »
            </p>
            <cite className="mt-1 block text-xs text-foreground/35 not-italic">
              — Jean 14:6
            </cite>
          </blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <CrossIcon className="size-6 text-primary" />
          </div>
          <span className="font-serif text-lg font-bold text-foreground tracking-tight">
            Jàngu Bi
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
