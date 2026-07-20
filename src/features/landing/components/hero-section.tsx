import NextLink from 'next/link';

import { paths } from '@/config/paths';

import { PhoneShowcase } from './phone-showcase';
import { StarField } from './star-field';

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(160deg,hsl(var(--background))_0%,hsl(var(--background-surface))_55%,hsl(var(--secondary))_100%)] pt-20 text-center dark:bg-[linear-gradient(160deg,#07101A_0%,#0D1C2B_60%,#122236_100%)]"
    >
      <StarField />

      {/* Blue glow above hero text */}
      <div className="pointer-events-none absolute left-1/2 top-[5%] h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-primary/12 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="mx-auto max-w-[780px] pb-12 pt-24">
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[.14em] text-primary">
            <span className="inline-block size-[5px] animate-[twinkle_2s_ease-in-out_infinite] rounded-full bg-primary" />
            Bêta · Ouverte aux paroisses du Sénégal
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            L&apos;Église du Sénégal
            <br />
            dans votre <em className="italic text-primary">poche.</em>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-11 max-w-[52ch] text-[1.125rem] leading-[1.75] text-foreground/60">
            Bible, Liturgie, Actualités, Discussion avec les prêtres, Dons &amp;
            Quête en ligne — tout en une seule application.
          </p>

          {/* Appels à l'action — l'application est un service WEB.
              Les badges App Store / Google Play ont été retirés avant
              l'ouverture beta : ils pointaient vers `#` et promettaient des
              applications mobiles qui n'existent pas. */}
          <div className="mb-11 flex flex-wrap justify-center gap-3.5">
            <NextLink
              href={paths.auth.register.getHref()}
              className="min-w-[168px] rounded-[14px] bg-primary px-7 py-3.5 text-center text-[0.9375rem] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(20,40,80,.18)]"
            >
              Créer mon compte
            </NextLink>
            <NextLink
              href={paths.auth.login.getHref()}
              className="min-w-[168px] rounded-[14px] border border-foreground/20 px-7 py-3.5 text-center text-[0.9375rem] font-bold text-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40"
            >
              Se connecter
            </NextLink>
          </div>

        </div>

        {/* Phone showcase */}
        <PhoneShowcase />
      </div>
    </section>
  );
}
