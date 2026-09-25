import type { SVGProps } from 'react';

/**
 * Jeu d'icônes des maquettes (DS-Fondations §04) : 24 px, trait 1,5, currentColor.
 * Décoratives par défaut ; passer `label` pour une icône porteuse de sens.
 */
const PATHS = {
  'menu': (
    <><path d="M4 7h16M4 12h16M4 17h16" /></>
  ),
  'accueil': (
    <><path d="M3.5 10.5 12 4l8.5 6.5V20h-5.5v-6h-6v6H3.5z" /></>
  ),
  'parole': (
    <><path d="M12 6.5C10 5 7.5 4.5 3.5 4.5v13c4 0 6.5.5 8.5 2 2-1.5 4.5-2 8.5-2v-13c-4 0-6.5.5-8.5 2z" /><path d="M12 6.5v13" /></>
  ),
  'bible': (
    <><path d="M5.5 3.5h13v17h-13A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5z" /><path d="M4 17.5h14.5M11.5 7v6.5M9 9.5h5" /></>
  ),
  'chapelet': (
    <><circle cx="12" cy="8.5" r="5.5" strokeDasharray="0.1 2.6" strokeWidth="2.2" /><path d="M12 14v7.5M9.5 17.5h5" /></>
  ),
  'paroisse': (
    <><path d="M12 2.5v4M10 4.5h4M5.5 21v-8.5L12 8l6.5 4.5V21M3 21h18M10 21v-3.5a2 2 0 0 1 4 0V21" /></>
  ),
  'annonce': (
    <><path d="M4 5.5h13V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 19z" /><path d="M17 9h3v10a1.5 1.5 0 0 1-3 0M7.5 9h6M7.5 12.5h6M7.5 16h4" /></>
  ),
  'calendrier': (
    <><rect x="3.5" y="5" width="17" height="15.5" rx="1" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>
  ),
  'document': (
    <><path d="M6 3h8.5L19 7.5V21H6z" /><path d="M14.5 3v4.5H19M9 12h7M9 15.5h7M9 18.5h4" /></>
  ),
  'message': (
    <><path d="M4 5h16v11h-9l-4.5 3.5V16H4z" /></>
  ),
  'confession': (
    <><path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17" /><path d="M9.5 7.5h5v4h-5zM12 7.5v4M15 15v1.5" /></>
  ),
  'profil': (
    <><circle cx="12" cy="8" r="3.75" /><path d="M4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5" /></>
  ),
  'cloche': (
    <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>
  ),
  'recherche': (
    <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5.5 5.5" /></>
  ),
  'filtre': (
    <><path d="M4 6h16M7 12h10M10 18h4" /></>
  ),
  'plus': (
    <><path d="M12 5v14M5 12h14" /></>
  ),
  'fleche-droite': (
    <><path d="M4.5 12h15M13.5 6l6 6-6 6" /></>
  ),
  'fleche-gauche': (
    <><path d="M19.5 12h-15M10.5 6l-6 6 6 6" /></>
  ),
  'chevron-bas': (
    <><path d="m6 9 6 6 6-6" /></>
  ),
  'chevron-droite': (
    <><path d="m9 6 6 6-6 6" /></>
  ),
  'chevron-gauche': (
    <><path d="m15 6-6 6 6 6" /></>
  ),
  'check': (
    <><path d="m5 12.5 4.5 4.5L19 7.5" /></>
  ),
  'x': (
    <><path d="M6 6l12 12M18 6 6 18" /></>
  ),
  'alerte': (
    <><path d="M12 3.5 21 19.5H3z" /><path d="M12 10v4.5M12 17.2v.1" /></>
  ),
  'info': (
    <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.1" /></>
  ),
  'cadenas': (
    <><rect x="5" y="10.5" width="14" height="10" rx="1" /><path d="M8 10.5v-3a4 4 0 0 1 8 0v3M12 14.5v2.5" /></>
  ),
  'cle': (
    <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16.5 6.5 19 9M14.5 8.5l2 2" /></>
  ),
  'pin': (
    <><path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>
  ),
  'horloge': (
    <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>
  ),
  'utilisateurs': (
    <><circle cx="9" cy="8.5" r="3.25" /><path d="M3 19.5c.8-3.2 3.2-4.8 6-4.8s5.2 1.6 6 4.8M15.5 5.5a3.25 3.25 0 0 1 0 6.3M17.5 14.9c1.8.6 3 2.1 3.5 4.6" /></>
  ),
  'structure': (
    <><rect x="9" y="3" width="6" height="4.5" /><rect x="3" y="16.5" width="6" height="4.5" /><rect x="15" y="16.5" width="6" height="4.5" /><path d="M12 7.5V12M6 16.5V12h12v4.5" /></>
  ),
  'import': (
    <><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 16.5v4h15v-4" /></>
  ),
  'export': (
    <><path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8M4.5 16.5v4h15v-4" /></>
  ),
  'reglages': (
    <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>
  ),
  'deconnexion': (
    <><path d="M14 4.5H5.5v15H14M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" /></>
  ),
  'oeil': (
    <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>
  ),
  'crayon': (
    <><path d="M15.5 4.5l4 4-11 11h-4v-4z" /><path d="m13.5 6.5 4 4" /></>
  ),
  'corbeille': (
    <><path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10.5V17M14 10.5V17" /></>
  ),
  'telephone': (
    <><path d="M5 3.5h3.5L10 8 7.75 9.5a11 11 0 0 0 6.75 6.75L16 14l4.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16 16 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z" /></>
  ),
  'mail': (
    <><rect x="3.5" y="5.5" width="17" height="13" rx="1" /><path d="m3.5 7 8.5 6.5L20.5 7" /></>
  ),
  'bouclier': (
    <><path d="M12 3 19 6v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z" /><path d="m9 12 2 2 4-4" /></>
  ),
  'envoyer': (
    <><path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" /></>
  ),
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: IconName;
  size?: number;
  label?: string;
};

export const Icon = ({ name, size = 20, label, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
    aria-label={label}
    focusable="false"
    {...props}
  >
    {PATHS[name]}
  </svg>
);
