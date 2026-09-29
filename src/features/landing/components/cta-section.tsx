import { Ban, Heart, Lock, ShieldCheck } from 'lucide-react';

import { PressScale } from '@/lib/motion/press-scale';
import { Reveal } from '@/lib/motion/reveal';

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

export function CtaSection() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-background-surface py-28 text-center"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -top-1/3 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />

      <Reveal className="relative mx-auto max-w-[1180px] px-5 sm:px-10">
        <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
          Rejoignez la communauté
          <br />
          <em className="text-primary">Jàngu Bi.</em>
        </h2>
        <p className="mx-auto mb-11 max-w-[52ch] text-[1.0625rem] leading-[1.7] text-foreground/60">
          Disponible pour les fidèles, les paroisses et les diocèses du Sénégal.
          Gratuit, sans publicité.
        </p>

        <div className="mb-8 flex flex-wrap justify-center gap-3.5">
          <PressScale lift className="rounded-[14px]">
            <a
              href="#"
              className="flex min-w-[168px] items-center gap-3 rounded-[14px] border border-foreground/20 bg-white px-6 py-3.5 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(20,40,80,.12)] dark:hover:shadow-[0_16px_40px_rgba(255,255,255,.12)]"
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
              className="flex min-w-[168px] items-center gap-3 rounded-[14px] border border-foreground/20 bg-white px-6 py-3.5 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(20,40,80,.12)] dark:hover:shadow-[0_16px_40px_rgba(255,255,255,.12)]"
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
      </Reveal>
    </section>
  );
}
