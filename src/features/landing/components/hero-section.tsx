import { type CSSProperties } from 'react';

import { HeroSweep } from '@/lib/motion/hero-sweep';
import { PressScale } from '@/lib/motion/press-scale';

import { PhoneShowcase } from './phone-showcase';
import { StarField } from './star-field';

// Délai d'apparition CSS (`.jb-rise`) : 250 ms comme le hero mobile, puis
// cascade de 80 ms.
const rise = (ms: number) => ({ '--jb-delay': `${ms}ms` }) as CSSProperties;

const AppleIcon = () => (
  <svg
    className="size-[26px] shrink-0"
    viewBox="-1 -1 28 28"
    fill="none"
    overflow="visible"
  >
    <path
      d="M21.5 19.2c-.5 1.1-1 2.1-1.8 3-.9 1.1-1.9 1.7-3 1.7-1 0-2-.5-3.1-.5-1.1 0-2.2.5-3.2.5-1.1 0-2-.6-2.9-1.7-2.2-2.7-3.5-6.8-3.5-10.7C4 6.5 6.8 4 9.5 4c1.1 0 2.2.5 3 .5.7 0 1.9-.6 3.2-.6 1.4 0 3.6.7 4.9 2.8-3.5 2.1-2.9 6.8.4 8.6-.5 1.3-1 2.8-1.5 3.9zM16.5 2c.1 1.3-.4 2.6-1.1 3.5-.8 1-2 1.8-3.1 1.7-.1-1.2.4-2.5 1.1-3.4.8-1 2.1-1.7 3.1-1.8z"
      fill="#1D1D1F"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg
    className="size-[26px] shrink-0"
    viewBox="-1 -1 28 28"
    fill="none"
    overflow="visible"
  >
    <path d="M3 4.5L14.2 13 3 21.5V4.5z" fill="#4285F4" />
    <path d="M3 4.5l13.5 8.5L23 8.5 7 2 3 4.5z" fill="#34A853" />
    <path d="M3 21.5l13.5-8.5L23 17.5 7 24l-4-2.5z" fill="#FBBC04" />
    <path d="M16.5 13L23 8.5v9L16.5 13z" fill="#EA4335" />
  </svg>
);

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(160deg,hsl(var(--background))_0%,hsl(var(--background-surface))_55%,hsl(var(--secondary))_100%)] pt-20 text-center dark:bg-[linear-gradient(160deg,#07101A_0%,#0D1C2B_60%,#122236_100%)]"
    >
      <StarField />
      <HeroSweep />

      {/* Blue glow above hero text */}
      <div className="pointer-events-none absolute left-1/2 top-[5%] h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-primary/12 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-10">
        <div className="mx-auto max-w-[780px] pb-12 pt-24">
          {/* Eyebrow */}
          <div
            style={rise(250)}
            className="jb-rise mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[.14em] text-primary"
          >
            <span className="inline-block size-[5px] animate-[twinkle_2s_ease-in-out_infinite] rounded-full bg-primary" />
            Nouveau · Disponible maintenant au Sénégal
          </div>

          {/* Headline */}
          {/* Titre révélé ligne par ligne (CSS : joue aussi sans JS). */}
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            <span style={rise(330)} className="jb-rise block">
              L&apos;Église du Sénégal
            </span>
            <span style={rise(410)} className="jb-rise block">
              dans votre <em className="italic text-primary">poche.</em>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={rise(490)}
            className="jb-rise mx-auto mb-11 max-w-[52ch] text-[1.125rem] leading-[1.75] text-foreground/60"
          >
            Bible, Liturgie, Actualités, Discussion avec les prêtres, Dons &amp;
            Quête en ligne — tout en une seule application.
          </p>

          {/* Store buttons */}
          <div
            style={rise(570)}
            className="jb-rise mb-11 flex flex-wrap justify-center gap-3.5"
          >
            <PressScale lift className="rounded-[14px]">
              <a
                href="#"
                className="flex min-w-[168px] items-center gap-3 rounded-[14px] border border-foreground/20 bg-white px-6 py-3 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(20,40,80,.12)] dark:hover:shadow-[0_16px_40px_rgba(255,255,255,.12)]"
              >
                <AppleIcon />
                <div className="flex flex-col text-left">
                  <span className="text-[0.625rem] font-medium leading-none text-gray-500">
                    Download on the
                  </span>
                  <span className="text-[0.9375rem] font-bold leading-none text-gray-900">
                    App Store
                  </span>
                </div>
              </a>
            </PressScale>
            <PressScale lift className="rounded-[14px]">
              <a
                href="#"
                className="flex min-w-[168px] items-center gap-3 rounded-[14px] border border-foreground/20 bg-white px-6 py-3 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(20,40,80,.12)] dark:hover:shadow-[0_16px_40px_rgba(255,255,255,.12)]"
              >
                <GoogleIcon />
                <div className="flex flex-col text-left">
                  <span className="text-[0.625rem] font-medium leading-none text-gray-500">
                    Get it on
                  </span>
                  <span className="text-[0.9375rem] font-bold leading-none text-gray-900">
                    Google Play
                  </span>
                </div>
              </a>
            </PressScale>
          </div>

          {/* Social proof */}
          <div
            style={rise(650)}
            className="jb-rise flex items-center justify-center gap-4"
          >
            <span className="text-[0.875rem] tracking-[.05em] text-accent">
              ★★★★★
            </span>
            <span className="text-[0.8125rem] text-muted-foreground">
              <strong className="text-foreground/80">4.8</strong> ·{' '}
              <strong className="text-foreground/80">2 400+</strong> fidèles ·{' '}
              <strong className="text-foreground/80">50+</strong> paroisses
            </span>
          </div>
        </div>

        {/* Phone showcase */}
        <div style={rise(730)} className="jb-rise">
          <PhoneShowcase />
        </div>
      </div>
    </section>
  );
}
