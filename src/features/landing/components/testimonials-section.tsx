import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

interface Testimonial {
  quote: string;
  avatar: string;
  name: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Jàngu Bi a changé ma façon de vivre ma foi. La liturgie du jour est ma première lecture chaque matin, et je contribue à la quête même en voyage.',
    avatar: '👩🏾',
    name: 'Marie-Claire Diop',
    role: 'Fidèle · Paroisse Saint-Joseph, Dakar',
  },
  {
    quote:
      "L'app nous a permis de toucher trois fois plus de fidèles. La gestion des documents et des dons est un gain de temps remarquable pour notre équipe pastorale.",
    avatar: '👨🏾',
    name: 'Père Augustin Ndiaye',
    role: 'Curé · Paroisse Notre-Dame, Saint-Louis',
  },
  {
    quote:
      "Notre diocèse a adopté Jàngu Bi il y a six mois. L'impact sur la communion entre nos paroisses est remarquable — et les contributions en ligne ont augmenté de 40 %.",
    avatar: '⛪',
    name: 'Mgr Jean-Baptiste Mendy',
    role: 'Évêque · Diocèse de Thiès',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <Reveal className="mb-14 text-center">
          <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
            Témoignages
          </p>
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
            Ce que disent les fidèles
          </h2>
        </Reveal>

        <Stagger className="grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map(({ quote, avatar, name, role }) => (
            <StaggerItem
              key={name}
              className="rounded-[20px] border border-border bg-background-surface p-8 transition-colors hover:border-primary/25"
            >
              <span className="mb-3 block font-serif text-6xl leading-[0.7] text-primary/30">
                &ldquo;
              </span>
              <p className="mb-6 font-serif text-[1.0625rem] italic leading-[1.7] text-foreground/80">
                {quote}
              </p>
              <div className="flex items-center gap-3.5">
                <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-lg">
                  {avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-[0.6875rem] text-foreground/40">{role}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-accent">★★★★★</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
