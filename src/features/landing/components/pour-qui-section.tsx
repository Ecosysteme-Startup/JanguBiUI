import { ArrowRight, Building2, Landmark, UserRound } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

import { PressScale } from '@/lib/motion/press-scale';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

interface Card {
  Icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
}

const CARDS: Card[] = [
  {
    Icon: UserRound,
    title: 'Fidèles',
    description:
      'Priez, lisez, faites vos dons, discutez avec les prêtres et restez connecté à votre communauté.',
    cta: "Je m'inscris",
  },
  {
    Icon: Building2,
    title: 'Paroisses',
    description:
      'Publiez vos actualités, gérez les demandes de documents et recevez les dons de vos fidèles.',
    cta: 'Ma paroisse',
  },
  {
    Icon: Landmark,
    title: 'Diocèses',
    description:
      'Fédérez vos paroisses, pilotez les contributions et coordonnez la pastorale diocésaine.',
    cta: 'Mon diocèse',
  },
];

export function PourQuiSection() {
  return (
    <section id="pour-qui" className="bg-background-surface py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <Reveal className="mb-14 text-center">
          <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
            Pour qui ?
          </p>
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
            Une plateforme pour toute l&apos;Église
          </h2>
        </Reveal>

        <Stagger className="grid gap-5 sm:grid-cols-3">
          {CARDS.map(({ Icon, title, description, cta }) => (
            <StaggerItem key={title} className="h-full">
              <PressScale
                lift
                className="group h-full rounded-[20px] border border-border bg-background p-8 transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(20,40,80,.12)] dark:hover:shadow-[0_0_48px_rgba(112,203,255,.25)]"
              >
                <div className="mb-5 flex size-[52px] items-center justify-center rounded-[14px] border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-3 font-serif text-[1.1875rem] font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mb-6 text-[0.9375rem] leading-[1.65] text-foreground/60">
                  {description}
                </p>
                <a
                  href="#cta"
                  className="group/cta inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-primary/30 px-4 py-1.5 text-[0.875rem] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10"
                >
                  {cta}
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </a>
              </PressScale>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
