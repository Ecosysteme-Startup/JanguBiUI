import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

const TOOLS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'calendrier', title: 'Annonces, horaires et agenda', text: 'Publiés une fois, visibles sur le web et l’application.' },
  { icon: 'document', title: 'File des demandes d’actes', text: 'Statuts, compléments et retards visibles d’un coup d’œil.' },
  { icon: 'bouclier', title: 'Accès du personnel protégé', text: 'Double authentification obligatoire, rôles par office.' },
];

/** Encart « Pour les paroisses et les diocèses » de l'accueil (WEB-Accueil). */
export const HomeOffer = () => (
  <section aria-labelledby="offre-titre" className="jb-container pt-16 md:pt-24">
    <div className="grid grid-cols-1 items-center gap-10 rounded-16 border border-line bg-surface p-6 md:p-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
      <div>
        <p className="m-0 text-15 font-semibold text-primary">Pour les paroisses et les diocèses</p>
        <h2 id="offre-titre" className="m-0 mt-2 text-28 font-semibold text-ink md:text-32">
          Un outil simple pour le secrétariat paroissial
        </h2>
        <p className="m-0 mt-4 text-17 leading-7 text-ink-2">La paroisse Saint-Dominique utilise Jàngu Bi en pilote avec l&apos;archidiocèse de Dakar.</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <NextLink href={paths.pourLesParoisses.getHref()} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-line-field')}>
            Présenter Jàngu Bi à ma paroisse
          </NextLink>
          <NextLink href={paths.contact.getHref()} className="hit text-16 font-semibold">
            Nous écrire
          </NextLink>
        </div>
      </div>
      <ul className="m-0 list-none rounded-16 border border-line bg-paper p-0">
        {TOOLS.map((tool, index) => (
          <li key={tool.title} className={cn('flex gap-4 px-6 py-5', index < TOOLS.length - 1 && 'border-b border-line')}>
            <Icon name={tool.icon} size={20} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <div className="text-16 font-semibold text-ink">{tool.title}</div>
              <div className="text-14 text-ink-2">{tool.text}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
