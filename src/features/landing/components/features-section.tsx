import {
  BookOpen,
  CircleDot,
  FileText,
  HeartHandshake,
  MessageCircle,
  Newspaper,
  Sun,
  Tv2,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    Icon: BookOpen,
    title: 'Bible',
    description:
      '73 livres, texte du jour, recherche par verset et plans de lecture personnalisés.',
  },
  {
    Icon: Sun,
    title: 'Liturgie du jour',
    description:
      'Laudes, Messe, Vêpres, Complies — tous les offices mis à jour chaque matin.',
  },
  {
    Icon: CircleDot,
    title: 'Rosaire guidé',
    description:
      'Mystères et prières guidées, à votre rythme, partout où vous vous trouvez.',
  },
  {
    Icon: Tv2,
    title: 'TV Catholique',
    description:
      "Messes en direct et replays des grandes célébrations de l'Église du Sénégal.",
  },
  {
    Icon: Newspaper,
    title: 'Actualités',
    description:
      'Informations paroissiales, diocésaines et mondiales en temps réel, triées pour vous.',
  },
  {
    Icon: MessageCircle,
    title: 'Discussion prêtres',
    description:
      'Messagerie chiffrée et confidentielle avec les prêtres de votre communauté.',
  },
  {
    Icon: FileText,
    title: 'Demande de messe',
    description:
      "Sollicitez des messes, baptêmes et autres sacrements directement depuis l'app.",
  },
  {
    Icon: HeartHandshake,
    title: 'Dons & Quête',
    description:
      'Contribuez à la quête dominicale et aux projets paroissiaux en ligne, en sécurité.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <Reveal className="mb-14 text-center">
          <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[.12em] text-primary">
            Tout-en-un
          </p>
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
            Toutes les fonctionnalités
            <br />
            de votre vie catholique
          </h2>
        </Reveal>

        <Stagger className="grid grid-cols-1 divide-x divide-y divide-border overflow-hidden rounded-[28px] border border-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, description }) => (
            <StaggerItem
              key={title}
              className="bg-background-surface p-7 transition-colors hover:bg-background-subtle"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-[11px] border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-foreground/60">
                {description}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
