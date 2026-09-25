import { SectionHeading } from '@/components/ui/section-heading';

// Accueil public complet (maquette Main) : lot F4.
const HomePage = () => (
  <section aria-labelledby="accueil-titre">
    <h1 id="accueil-titre" className="m-0 max-w-[16ch] font-serif text-h1 font-normal text-ink">
      Chaque jour la Parole, et votre paroisse à portée de main.
    </h1>
    <SectionHeading className="mt-16" number="I" title="La Parole du jour" />
  </section>
);

export default HomePage;
