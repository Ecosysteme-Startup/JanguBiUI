import NextLink from 'next/link';

import { Brand } from '@/components/layouts/brand';
import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { paths } from '@/config/paths';

const COLUMNS = [
  {
    title: 'Fidèles',
    links: [
      { label: 'La Parole du jour', href: paths.parole.getHref() },
      { label: 'Trouver une paroisse', href: paths.paroisses.list.getHref() },
      { label: 'Application mobile', href: paths.applicationMobile.getHref() },
    ],
  },
  {
    title: 'Paroisses et diocèses',
    links: [
      { label: 'Rejoindre Jàngu Bi', href: paths.pourLesParoisses.getHref() },
      { label: 'Le pilote Saint-Dominique', href: `${paths.pourLesParoisses.getHref()}#pilote` },
      { label: 'Nous contacter', href: paths.contact.getHref() },
    ],
  },
  {
    title: 'Informations',
    links: [
      { label: 'Confidentialité', href: paths.confidentialite.getHref() },
      { label: 'Conditions d’utilisation', href: paths.conditions.getHref() },
      { label: 'Aide', href: paths.aide.getHref() },
    ],
  },
];

/**
 * Pied de page public (WEB-Accueil, WEB-Erreur-404) : fond surface, filet haut, 4 colonnes
 * (logotype et devise, Fidèles, Paroisses et diocèses, Informations), puis mentions légales.
 */
export const PublicFooter = () => (
  <footer className="border-t border-line bg-surface">
    <div className="jb-container grid grid-cols-1 gap-8 pb-8 pt-12 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2.5">
        <Brand href={paths.home.getHref()} label="Jàngu Bi, accueil" className="self-start" />
        <p className="m-0 max-w-[40ch] text-14 text-ink-2">La Parole, votre paroisse et vos démarches, au même endroit. Une application Numerisen.</p>
      </div>
      {COLUMNS.map((column) => (
        <div key={column.title} className="flex flex-col gap-2 text-14">
          <p className="m-0 font-semibold text-ink">{column.title}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {column.links.map((link) => (
              <li key={link.label}>
                <NextLink href={link.href} className="text-ink-2 hover:text-ink">
                  {link.label}
                </NextLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="jb-container">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pb-6 pt-4 text-13 text-ink-3">
        <span>© {new Date().getFullYear()} Numerisen, Dakar</span>
        <ThemeToggle />
        <span>Protection des données personnelles&nbsp;: loi n°&nbsp;2008-12</span>
      </div>
    </div>
  </footer>
);
