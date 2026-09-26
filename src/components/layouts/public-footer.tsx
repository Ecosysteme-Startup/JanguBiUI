import NextLink from 'next/link';

import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { paths } from '@/config/paths';

const COLUMNS = [
  {
    title: 'Application',
    span: 'md:col-span-2',
    links: [
      { label: 'La Parole du jour', href: paths.parole.getHref() },
      { label: 'Trouver une paroisse', href: paths.paroisses.list.getHref() },
      { label: 'Créer mon compte', href: paths.auth.inscription.getHref() },
      { label: 'Se connecter', href: paths.auth.connexion.getHref() },
    ],
  },
  {
    title: 'Paroisses et diocèses',
    span: 'md:col-span-3',
    links: [
      { label: 'Pour les paroisses', href: paths.pourLesParoisses.getHref() },
      { label: 'Demander une présentation', href: paths.contact.getHref() },
      { label: 'Espace paroisse', href: paths.auth.connexion.getHref('/espace') },
      { label: 'Espace diocèse', href: paths.auth.connexion.getHref('/espace') },
    ],
  },
  {
    title: 'Informations',
    span: 'md:col-span-2',
    links: [
      { label: 'Confidentialité', href: paths.confidentialite.getHref() },
      { label: 'Conditions d’utilisation', href: paths.conditions.getHref() },
      { label: 'Contact', href: paths.contact.getHref() },
    ],
  },
];

/** Pied de page « nuit » (Main) : quatre colonnes, filet et devise. */
export const PublicFooter = () => (
  <footer className="bg-night text-on-night">
    <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-16 md:px-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-5">
          <p className="m-0 font-serif text-h2 text-on-primary">Jàngu Bi</p>
          <p className="mb-0 mt-4 max-w-[40ch] text-base leading-relaxed text-on-night-muted">
            « La Leçon », en wolof. La Parole du jour, votre paroisse, vos demandes d&apos;actes et vos prêtres, pour les
            catholiques du Sénégal. Une application éditée par Numerisen.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className={column.span}>
            <p className="tnum mb-4 mt-0 text-meta text-on-night-muted">{column.title}</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 text-base">
              {column.links.map((link) => (
                <li key={link.label}>
                  <NextLink href={link.href} className="hit text-on-night hover:text-on-primary">
                    {link.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="tnum mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-night-2 pt-4 text-meta text-on-night-muted">
        <span>© {new Date().getFullYear()} Numerisen · Dakar, Sénégal</span>
        <ThemeToggle tone="night" />
        <span>Jàmm ak jàmm</span>
      </div>
    </div>
  </footer>
);
