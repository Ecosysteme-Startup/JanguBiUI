import {
  ArrowLeftRight,
  CalendarClock,
  BarChart3,
  BookOpen,
  Calendar,
  Church,
  CreditCard,
  FileText,
  HandCoins,
  Headphones,
  Heart,
  Home,
  Library,
  Landmark,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  User,
  UsersRound,
} from 'lucide-react';

import { FEATURES, isFeatureEnabled } from '@/config/features';
import { User as UserType } from '@/lib/auth';
import {
  canViewDioceseDonsAggregates,
  canViewParishDonsAnalysis,
  canManageParishioners,
  canPublishAudio,
  canViewPlatformPayments,
  isAdmin,
  isClergy,
} from '@/lib/authorization';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  clergyOnly?: boolean;
}

const ITEM_ACCUEIL: NavItem = { label: 'Accueil', href: '/app', icon: Home };
const ITEM_ACTUS: NavItem = {
  label: 'Actus',
  href: '/app/actus',
  icon: Newspaper,
};
const ITEM_SPIRITUEL: NavItem = {
  label: 'Spirituel',
  href: '/app/spirituel',
  icon: BookOpen,
};
// Sonothèque (lot C5) : « Écouter » pour le fidèle, « Sonothèque » pour le
// staff qui a la capacité audio.publier.
const ITEM_ECOUTER: NavItem = {
  label: 'Écouter',
  href: '/app/ecouter',
  icon: Headphones,
};
const ITEM_SONOTHEQUE: NavItem = {
  label: 'Sonothèque',
  href: '/app/paroisse/sonotheque',
  icon: Library,
};
const ITEM_DOCUMENTS: NavItem = {
  label: 'Documents',
  href: '/app/documents',
  icon: FileText,
};
const ITEM_AGENDA: NavItem = {
  label: 'Agenda',
  href: '/app/agenda',
  icon: Calendar,
};
const ITEM_TRANSFERT: NavItem = {
  label: 'Transfert',
  href: '/app/transfert',
  icon: ArrowLeftRight,
};
const ITEM_CONFESSIONS: NavItem = {
  label: 'Confession',
  href: '/app/confessions',
  icon: CalendarClock,
};
// Transfert paroissial : aucune route backend (remplacé par les paroisses
// multiples) → seulement si l'indicateur `transfert` est actif.
const transfertItems = (): NavItem[] =>
  isFeatureEnabled(FEATURES.transfert) ? [ITEM_TRANSFERT] : [];
const ITEM_MESSAGES: NavItem = {
  label: 'Messages',
  href: '/app/messages',
  icon: MessageCircle,
};
const ITEM_PROFIL: NavItem = {
  label: 'Profil',
  href: '/app/profil',
  icon: User,
};
const ITEM_DONS: NavItem = {
  label: 'Dons',
  href: '/app/dons',
  icon: Heart,
};
const ITEM_CLERGE: NavItem = {
  label: 'Clergé',
  href: '/app/clerge',
  icon: Church,
  clergyOnly: true,
};
// Tableau de bord analytique (dons + fidèles) scopé au périmètre du responsable.
// Affiché pour tout le clergé ; la page gère le 403 (clergé sans périmètre) par un
// état vide — le back est la source de vérité de l'autorité territoriale.
const ITEM_ANALYTIQUE: NavItem = {
  label: 'Analytique',
  href: '/app/clerge/analytique',
  icon: BarChart3,
  clergyOnly: true,
};
// Admin "home" points directly to /app/admin to avoid the /app → /app/admin redirect flash
const ITEM_ACCUEIL_ADMIN: NavItem = {
  label: 'Accueil',
  href: '/app/admin',
  icon: Home,
  adminOnly: true,
};
// Passerelle vers les outils admin pour un membre du clergé qui est AUSSI
// administrateur digital (ex. curé = pretre + parish_admin). Sa home reste
// pastorale (cf. home-router) ; cette entrée lui donne accès à l'admin sans
// quitter sa nav clergé. Libellé distinct de l'« Accueil » admin.
const ITEM_ADMIN: NavItem = {
  label: 'Administration',
  href: '/app/admin',
  icon: ShieldCheck,
  adminOnly: true,
};

// Tableaux de bord des dons (staff) : chaque entrée n'apparaît qu'avec la
// capacité correspondante (cf. lib/authorization).
const ITEM_DONS_ANALYSE: NavItem = {
  label: 'Dons et quêtes',
  href: '/app/dons/analyse',
  icon: HandCoins,
};
const ITEM_DONS_DIOCESE: NavItem = {
  label: 'Dons du diocèse',
  href: '/app/diocese/dons',
  icon: Landmark,
};
const ITEM_PAIEMENTS: NavItem = {
  label: 'Paiements',
  href: '/app/plateforme/paiements',
  icon: CreditCard,
};

const donsStaffItems = (user: UserType | null | undefined): NavItem[] => [
  ...(canViewParishDonsAnalysis(user) ? [ITEM_DONS_ANALYSE] : []),
  ...(canViewDioceseDonsAggregates(user) ? [ITEM_DONS_DIOCESE] : []),
  ...(canViewPlatformPayments(user) ? [ITEM_PAIEMENTS] : []),
];

// Paroissiens (décisions 6-8) : liste nominative, retrait et rétablissement,
// seulement avec la capacité paroissiens.gerer.
const ITEM_PAROISSIENS: NavItem = {
  label: 'Paroissiens',
  href: '/app/paroisse/paroissiens',
  icon: UsersRound,
};

const sonothequeStaffItems = (user: UserType | null | undefined): NavItem[] => [
  ...(canPublishAudio(user) ? [ITEM_SONOTHEQUE] : []),
  ...(canManageParishioners(user) ? [ITEM_PAROISSIENS] : []),
];

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  // Les deux dimensions (role admin / pastoral_role) sont INDÉPENDANTES : un curé
  // peut être à la fois parish_admin et pretre. Le guard `!isClergy` est donc
  // porteur (pas « défensif ») — il aiguille un tel utilisateur vers la nav
  // clergé (home pastorale), tandis qu'il accède à l'admin via ITEM_ADMIN.
  if (isAdmin(user) && !isClergy(user)) {
    return [
      ITEM_ACCUEIL_ADMIN,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ...donsStaffItems(user),
      ...sonothequeStaffItems(user),
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  if (isClergy(user)) {
    return [
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_CLERGE,
      ITEM_ANALYTIQUE,
      ITEM_ECOUTER,
      ...donsStaffItems(user),
      ...sonothequeStaffItems(user),
      // Clergé qui est aussi admin digital → passerelle vers l'admin.
      ...(isAdmin(user) ? [ITEM_ADMIN] : []),
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  // Fidèle
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_ECOUTER,
    ITEM_DOCUMENTS,
    ITEM_DONS,
    ITEM_AGENDA,
    ITEM_CONFESSIONS,
    ...transfertItems(),
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};

/**
 * Logique d'activation d'un lien de nav (partagée par la sidebar et la
 * bottom-nav). Accueil/Admin = exact, le reste = préfixe.
 */
export const isNavActive = (pathname: string, href: string): boolean => {
  if (href === '/app' || href === '/app/admin') return pathname === href;
  return pathname.startsWith(href);
};

export const buildBottomNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  if (isAdmin(user) && !isClergy(user)) {
    return [
      ITEM_ACCUEIL_ADMIN,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  if (isClergy(user)) {
    return [
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_CLERGE,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  // Fidèle — Spirituel + Documents dans la bottom nav, le reste via « Plus »
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_DOCUMENTS,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};

/**
 * Items présents dans la sidebar mais PAS dans la bottom-nav → exposés via une
 * entrée « Plus » sur mobile pour éviter les routes orphelines (fidèle :
 * Dons, Agenda, Transfert).
 */
export const buildOverflowNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  const bottomHrefs = new Set(buildBottomNavItems(user).map((i) => i.href));
  return buildNavItems(user).filter((i) => !bottomHrefs.has(i.href));
};
