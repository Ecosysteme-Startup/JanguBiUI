import { Ban, Heart, Lock, ShieldCheck } from 'lucide-react';
import NextLink from 'next/link';

import { paths } from '@/config/paths';

export function CtaSection() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-background-surface py-16 sm:py-20 lg:py-28 text-center"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -top-1/3 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-10">
        <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
          Rejoignez la communauté
          <br />
          <em className="text-primary">Jàngu Bi.</em>
        </h2>
        <p className="mx-auto mb-11 max-w-[52ch] text-[1.0625rem] leading-[1.7] text-foreground/60">
          Disponible pour les fidèles, les paroisses et les diocèses du Sénégal.
          Gratuit, sans publicité.
        </p>

        {/* Badges App Store / Google Play retirés avant l'ouverture beta :
            ils pointaient vers `#` et promettaient des applications mobiles
            inexistantes. Jàngu Bi est un service web. */}
        <div className="mb-8 flex flex-wrap justify-center gap-3.5">
          <NextLink
            href={paths.auth.register.getHref()}
            className="min-w-[168px] rounded-[14px] bg-primary px-7 py-3.5 text-center text-[0.9375rem] font-bold text-primary-foreground transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(20,40,80,.18)]"
          >
            Créer mon compte
          </NextLink>
          <NextLink
            href={paths.auth.login.getHref()}
            className="min-w-[168px] rounded-[14px] border border-foreground/20 px-7 py-3.5 text-center text-[0.9375rem] font-bold text-foreground transition-all hover:-translate-y-1 hover:border-foreground/40"
          >
            Se connecter
          </NextLink>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {[
            { Icon: ShieldCheck, label: 'Gratuit' },
            { Icon: Ban, label: 'Sans publicité' },
            { Icon: Lock, label: 'Chiffré' },
            { Icon: Heart, label: 'Catholique' },
          ].map(({ Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground"
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
