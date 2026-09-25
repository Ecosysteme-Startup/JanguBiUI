import type { IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import type { Capacite } from '@/lib/capacites';

export type NavLeaf = { label: string; href: string; icon?: IconName; match?: 'exact' | 'prefix' };

/** Espace fidèle (FID-Accueil) : rubriques et sous-rubriques de la sidebar. */
export const FIDELE_NAV: (NavLeaf & { children?: NavLeaf[] })[] = [
  { label: 'Accueil', href: paths.app.root.getHref(), icon: 'accueil', match: 'exact' },
  {
    label: 'La Parole',
    href: paths.app.parole.getHref(),
    icon: 'parole',
    children: [
      { label: 'Lectures du jour', href: paths.app.parole.getHref() },
      { label: 'Bible', href: paths.app.bible.root.getHref() },
      { label: 'Chapelet', href: paths.app.chapelet.getHref() },
    ],
  },
  {
    label: 'Ma paroisse',
    href: paths.app.paroisse.root.getHref(),
    icon: 'paroisse',
    children: [
      { label: 'Annonces', href: paths.app.paroisse.root.getHref('annonces'), match: 'exact' },
      { label: 'Horaires', href: paths.app.paroisse.root.getHref('horaires'), match: 'exact' },
      { label: 'Agenda', href: paths.app.paroisse.root.getHref('agenda'), match: 'exact' },
    ],
  },
  { label: 'Mes demandes', href: paths.app.demandes.list.getHref(), icon: 'document' },
  {
    label: 'Parler à un prêtre',
    href: paths.app.pretres.list.getHref(),
    icon: 'message',
    children: [
      { label: 'Conversations', href: paths.app.pretres.list.getHref() },
      { label: 'Rendez-vous de confession', href: paths.app.confession.getHref() },
    ],
  },
  { label: 'Profil', href: paths.app.profil.getHref(), icon: 'profil' },
];

/** Barre mobile (MOB-Accueil) : cinq entrées fixes ; le reste est dans le menu « Plus ». */
export const MOBILE_TABS: NavLeaf[] = [
  { label: 'Accueil', href: paths.app.root.getHref(), icon: 'accueil', match: 'exact' },
  { label: 'Parole', href: paths.app.parole.getHref(), icon: 'parole' },
  { label: 'Paroisse', href: paths.app.paroisse.root.getHref(), icon: 'paroisse' },
  { label: 'Demandes', href: paths.app.demandes.list.getHref(), icon: 'document' },
  { label: 'Prêtre', href: paths.app.pretres.list.getHref(), icon: 'message' },
];

/** Menu « Plus » (MOB-Menu). */
export const MOBILE_MENU: { title: string; items: NavLeaf[] }[] = [
  {
    title: 'La Parole',
    items: [
      { label: 'Bible', href: paths.app.bible.root.getHref() },
      { label: 'Chapelet', href: paths.app.chapelet.getHref() },
    ],
  },
  {
    title: 'Ma paroisse',
    items: [
      { label: 'Agenda paroissial', href: paths.app.paroisse.root.getHref('agenda') },
      { label: 'Mes rendez-vous', href: paths.app.confession.getHref() },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Notifications', href: paths.app.notifications.getHref() },
      { label: 'Paramètres', href: paths.app.profil.getHref() },
      { label: 'Aide et contact', href: paths.contact.getHref() },
    ],
  },
];

export type BackofficeKind = 'paroisse' | 'diocese' | 'plateforme';

/** Type de nœud → type d'espace (maquettes PAR-*, DIO-*, PLA-*). */
export const backofficeKindOf = (nodeType: string): BackofficeKind => {
  if (nodeType === 'plateforme') return 'plateforme';
  if (['paroisse', 'quasi_paroisse', 'aumonerie'].includes(nodeType)) return 'paroisse';
  return 'diocese';
};

export const BACKOFFICE_LABEL: Record<BackofficeKind, string> = {
  paroisse: 'Espace paroisse',
  diocese: 'Espace diocèse',
  plateforme: 'Espace plateforme',
};

export type BackofficeItem = NavLeaf & { capacites: Capacite[] };
export type BackofficeGroup = { title: string; items: BackofficeItem[] };

/** Sidebar du back-office : une entrée n'apparaît que si l'une de ses capacités est détenue. */
export const backofficeNav = (kind: BackofficeKind, nodeId: string): BackofficeGroup[] => {
  if (kind === 'plateforme') {
    return [
      {
        title: 'Pilotage',
        items: [
          { label: 'Tableau de bord', href: paths.plateforme.root.getHref(), icon: 'accueil', match: 'exact', capacites: ['plateforme.admin'] },
        ],
      },
      {
        title: 'Paramétrage',
        items: [
          { label: 'Référentiels', href: paths.plateforme.referentiels.getHref(), icon: 'structure', capacites: ['plateforme.admin'] },
          { label: 'Comptes', href: paths.plateforme.comptes.getHref(), icon: 'utilisateurs', capacites: ['plateforme.admin'] },
        ],
      },
      {
        title: 'Conformité',
        items: [
          { label: 'Journal d’audit', href: paths.plateforme.audit.getHref(), icon: 'bouclier', capacites: ['plateforme.admin', 'audit.voir'] },
        ],
      },
    ];
  }
  const e = paths.espace;
  const pilotage: BackofficeGroup = {
    title: 'Pilotage',
    items: [{ label: 'Tableau de bord', href: e.root.getHref(nodeId), icon: 'accueil', match: 'exact', capacites: ['tableau_bord.voir'] }],
  };
  if (kind === 'diocese') {
    return [
      pilotage,
      {
        title: 'Gouvernance',
        items: [
          { label: 'Structure', href: e.structure.getHref(nodeId), icon: 'structure', capacites: ['structure.gerer'] },
          { label: 'Nominations', href: e.nominations.getHref(nodeId), icon: 'utilisateurs', capacites: ['offices.nommer'] },
          { label: 'Annuaire du clergé', href: e.clerge.getHref(nodeId), icon: 'bouclier', capacites: ['personnes.verifier'] },
        ],
      },
    ];
  }
  return [
    pilotage,
    {
      title: 'Vie paroissiale',
      items: [
        { label: 'Annonces', href: e.annonces.list.getHref(nodeId), icon: 'annonce', capacites: ['annonces.publier'] },
        { label: 'Horaires et lieux de culte', href: e.horaires.getHref(nodeId), icon: 'horloge', capacites: ['horaires.gerer'] },
        { label: 'Agenda', href: e.agenda.getHref(nodeId), icon: 'calendrier', capacites: ['evenements.gerer'] },
      ],
    },
    {
      title: 'Sacrements et accueil',
      items: [
        { label: 'Demandes d’actes', href: e.demandes.list.getHref(nodeId), icon: 'document', capacites: ['actes.traiter'] },
        { label: 'Messagerie', href: e.messagerie.getHref(nodeId), icon: 'message', capacites: ['messagerie.recevoir_fideles'] },
        { label: 'Confessions', href: e.confessions.getHref(nodeId), icon: 'confession', capacites: ['confessions.gerer', 'confessions.voir_planning'] },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Équipe et nominations', href: e.equipe.getHref(nodeId), icon: 'utilisateurs', capacites: ['offices.nommer', 'tableau_bord.voir'] },
        { label: 'Paramètres', href: e.parametres.getHref(nodeId), icon: 'reglages', capacites: ['horaires.gerer'] },
      ],
    },
  ];
};
