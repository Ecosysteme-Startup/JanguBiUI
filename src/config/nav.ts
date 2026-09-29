import type { IconName } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import type { Capacite } from '@/lib/capacites';

export type NavLeaf = { label: string; href: string; icon?: IconName; match?: 'exact' | 'prefix' };

/**
 * Espace fidèle (WEB-FID-*) : rubriques de la barre latérale (dont « Écouter », la sonothèque). Les sous-rubriques (Bible,
 * Chapelet, Annonces…) vivent dans la page (contrôle segmenté, onglets), plus dans la barre ;
 * `children` reste la liste de référence de la recherche rapide et du menu mobile.
 */
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
  { label: 'Écouter', href: paths.app.ecouter.root.getHref(), icon: 'ecouter' },
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
  { label: 'Intentions de messe', href: paths.app.intentions.getHref(), icon: 'calendrier-ok' },
  {
    label: 'Parler à un prêtre',
    href: paths.app.pretres.list.getHref(),
    icon: 'message',
    children: [
      { label: 'Conversations', href: paths.app.pretres.list.getHref() },
      { label: 'Rendez-vous de confession', href: paths.app.confession.getHref() },
    ],
  },
  {
    label: 'Dons',
    href: paths.app.dons.root.getHref(),
    icon: 'don',
    children: [
      { label: 'Donner', href: paths.app.dons.root.getHref(), match: 'exact' },
      { label: 'Mes dons', href: paths.app.dons.historique.getHref() },
    ],
  },
];

/** Rubriques de la barre latérale actives aussi sur ces chemins (Bible et Chapelet sont « La Parole »). */
export const FIDELE_ALIASES: Record<string, string[]> = {
  [paths.app.parole.getHref()]: [paths.app.bible.root.getHref(), paths.app.chapelet.getHref()],
  [paths.app.pretres.list.getHref()]: [paths.app.confession.getHref()],
};

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
      { label: 'Écouter', href: paths.app.ecouter.root.getHref() },
    ],
  },
  {
    title: 'Ma paroisse',
    items: [
      { label: 'Agenda paroissial', href: paths.app.paroisse.root.getHref('agenda') },
      { label: 'Mes rendez-vous', href: paths.app.confession.getHref() },
      { label: 'Intentions de messe', href: paths.app.intentions.getHref() },
      { label: 'Donner', href: paths.app.dons.root.getHref() },
      { label: 'Mes dons', href: paths.app.dons.historique.getHref() },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Rechercher', href: paths.app.recherche.getHref() },
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

/**
 * Barre latérale du back-office (WEB-PAR-*, WEB-DIO-*, WEB-PLA-*) : groupes séparés par un filet,
 * sans titre. Une entrée n'apparaît que si l'une de ses capacités est détenue.
 */
export const backofficeNav = (kind: BackofficeKind, nodeId: string): BackofficeGroup[] => {
  if (kind === 'plateforme') {
    return [
      {
        title: 'Plateforme',
        items: [
          { label: 'Tableau de bord', href: paths.plateforme.root.getHref(), icon: 'tableau-de-bord', match: 'exact', capacites: ['plateforme.admin'] },
          { label: 'Référentiels', href: paths.plateforme.referentiels.getHref(), icon: 'structure', capacites: ['plateforme.admin'] },
          { label: 'Comptes', href: paths.plateforme.comptes.getHref(), icon: 'utilisateurs', capacites: ['plateforme.admin'] },
          { label: 'Paiements', href: paths.plateforme.paiements.getHref(), icon: 'carte-bancaire', capacites: ['plateforme.admin'] },
          { label: 'Journal d’audit', href: paths.plateforme.audit.getHref(), icon: 'historique', capacites: ['plateforme.admin', 'audit.voir'] },
        ],
      },
    ];
  }
  const e = paths.espace;
  if (kind === 'diocese') {
    return [
      {
        title: 'Gouvernance',
        items: [
          { label: 'Tableau de bord', href: e.root.getHref(nodeId), icon: 'tableau-de-bord', match: 'exact', capacites: ['tableau_bord.voir'] },
          { label: 'Structure', href: e.structure.getHref(nodeId), icon: 'structure', capacites: ['structure.gerer'] },
          { label: 'Nominations', href: e.nominations.getHref(nodeId), icon: 'utilisateur-ok', capacites: ['offices.nommer'] },
          { label: 'Clergé', href: e.clerge.getHref(nodeId), icon: 'utilisateurs', capacites: ['personnes.verifier'] },
          { label: 'Quêtes impérées', href: e.quetesImperees.getHref(nodeId), icon: 'don', capacites: ['dons.definir_quete_imperee'] },
          { label: 'Dons', href: e.dons.analyse.getHref(nodeId), icon: 'activite', capacites: ['dons.voir_agregats'] },
        ],
      },
      {
        title: 'Administration',
        items: [{ label: 'Journal d’audit', href: e.audit.getHref(nodeId), icon: 'historique', capacites: ['audit.voir'] }],
      },
    ];
  }
  return [
    {
      title: 'Vie paroissiale',
      items: [
        { label: 'Aujourd’hui', href: e.root.getHref(nodeId), icon: 'aujourdhui', match: 'exact', capacites: ['tableau_bord.voir'] },
        { label: 'Demandes d’actes', href: e.demandes.list.getHref(nodeId), icon: 'document', capacites: ['actes.traiter'] },
        { label: 'Messagerie', href: e.messagerie.getHref(nodeId), icon: 'message', capacites: ['messagerie.recevoir_fideles'] },
        { label: 'Confessions', href: e.confessions.getHref(nodeId), icon: 'calendrier-horloge', capacites: ['confessions.gerer', 'confessions.voir_planning'] },
        { label: 'Annonces', href: e.annonces.list.getHref(nodeId), icon: 'annonce', capacites: ['annonces.publier'] },
        { label: 'Horaires et lieux', href: e.horaires.getHref(nodeId), icon: 'horloge', capacites: ['horaires.gerer'] },
        { label: 'Agenda', href: e.agenda.getHref(nodeId), icon: 'calendrier', capacites: ['evenements.gerer'] },
        { label: 'Intentions de messe', href: e.intentions.root.getHref(nodeId), icon: 'calendrier-ok', capacites: ['intentions.gerer'] },
        { label: 'Sonothèque', href: e.sonotheque.root.getHref(nodeId), icon: 'ecouter', capacites: ['audio.publier'] },
        {
          label: 'Dons et quêtes',
          href: e.dons.root.getHref(nodeId),
          icon: 'don',
          capacites: ['dons.voir_fonds', 'dons.gerer_fonds', 'dons.saisir_quete', 'dons.exporter'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Équipe', href: e.equipe.getHref(nodeId), icon: 'utilisateurs', capacites: ['offices.nommer', 'tableau_bord.voir'] },
        { label: 'Paramètres', href: e.parametres.getHref(nodeId), icon: 'reglages', capacites: ['horaires.gerer'] },
        { label: 'Journal d’audit', href: e.audit.getHref(nodeId), icon: 'historique', capacites: ['audit.voir'] },
      ],
    },
  ];
};
