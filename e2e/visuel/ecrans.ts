/**
 * Registre des écrans à comparer : maquette Ciel (nom du PNG de docs/v1/maquettes-ciel/captures,
 * sans « Sombre- ») → route de l'app et compte de démo. Les lots de pages complètent ce registre
 * (ou passent un écran ad hoc au CLI : voir README.md).
 *
 * Trous de route : `{node}` = premier espace du compte ; les autres (`{demande}`…) sont résolus
 * en ouvrant `depuis` et en prenant le premier lien dont l'URL correspond à `motif` (groupe 1).
 */
import type { Page } from '@playwright/test';

export const COMPTES = {
  public: { email: '', entry: '/' },
  fidele: { email: 'fidele@demo.jangubi.sn', entry: '/app' },
  cure: { email: 'cure@demo.jangubi.sn', entry: '/espace' },
  admin_paroissial: { email: 'admin_paroissial@demo.jangubi.sn', entry: '/espace' },
  chancelier: { email: 'chancelier@demo.jangubi.sn', entry: '/espace' },
  plateforme: { email: 'plateforme@demo.jangubi.sn', entry: '/plateforme' },
} as const;
export type Compte = keyof typeof COMPTES;

export type Ecran = {
  /** Nom de la maquette (ex. `WEB-FID-Parole`) : captures/<maquette>.png et captures/Sombre-<maquette>.png. */
  maquette: string;
  route: string;
  compte: Compte;
  /** Dossier de sortie (défaut : le nom de la maquette). */
  nom?: string;
  trous?: Record<string, { depuis: string; motif: string }>;
  viewport?: { width: number; height: number };
  /** Action avant la capture (ouvrir un onglet, un menu…). */
  avant?: (page: Page) => Promise<void>;
};

const DEMANDE_FID = { depuis: '/app/demandes', motif: '^/app/demandes/(\\d+)$' };
const DEMANDE_PAR = { depuis: '/espace/{node}/demandes', motif: '/demandes/(\\d+)$' };

export const ECRANS: Ecran[] = [
  // Public
  { maquette: 'WEB-Accueil', route: '/', compte: 'public' },
  { maquette: 'WEB-Parole-du-jour', route: '/parole', compte: 'public' },
  { maquette: 'WEB-Paroisses', route: '/paroisses', compte: 'public' },
  {
    maquette: 'WEB-Fiche-Paroisse',
    route: '/paroisses/{paroisse}',
    compte: 'public',
    trous: { paroisse: { depuis: '/paroisses', motif: '^/paroisses/([^/?#]+)$' } },
  },
  { maquette: 'WEB-Pour-les-paroisses', route: '/pour-les-paroisses', compte: 'public' },
  { maquette: 'WEB-Erreur-404', route: '/cette-page-n-existe-pas', compte: 'public' },
  { maquette: 'WEB-Inscription-Paroisse', route: '/bienvenue', compte: 'fidele' },
  // Espace fidèle
  { maquette: 'WEB-FID-Accueil', route: '/app', compte: 'fidele' },
  { maquette: 'WEB-FID-Parole', route: '/app/parole', compte: 'fidele' },
  { maquette: 'WEB-FID-Bible', route: '/app/bible', compte: 'fidele' },
  { maquette: 'WEB-FID-Chapelet', route: '/app/chapelet', compte: 'fidele' },
  { maquette: 'WEB-FID-Ma-Paroisse', route: '/app/paroisse', compte: 'fidele' },
  {
    maquette: 'WEB-FID-Annonce',
    route: '/app/paroisse/annonces/{annonce}',
    compte: 'fidele',
    trous: { annonce: { depuis: '/app/paroisse', motif: '^/app/paroisse/annonces/(\\d+)$' } },
  },
  {
    maquette: 'WEB-FID-Evenement',
    route: '/app/paroisse/evenements/{evenement}',
    compte: 'fidele',
    trous: { evenement: { depuis: '/app/paroisse', motif: '^/app/paroisse/evenements/(\\d+)$' } },
  },
  { maquette: 'WEB-FID-Notifications', route: '/app/notifications', compte: 'fidele' },
  { maquette: 'WEB-FID-Demandes', route: '/app/demandes', compte: 'fidele' },
  { maquette: 'WEB-FID-Demande-Nouvelle', route: '/app/demandes/nouvelle', compte: 'fidele' },
  { maquette: 'WEB-FID-Demande-Suivi', route: '/app/demandes/{demande}', compte: 'fidele', trous: { demande: DEMANDE_FID } },
  { maquette: 'WEB-FID-Pretres', route: '/app/pretres', compte: 'fidele' },
  {
    maquette: 'WEB-FID-Conversation',
    route: '/app/pretres/conversations/{conversation}',
    compte: 'fidele',
    trous: { conversation: { depuis: '/app/pretres', motif: '^/app/pretres/conversations/([^/?#]+)$' } },
  },
  { maquette: 'WEB-FID-Confession-RDV', route: '/app/confession', compte: 'fidele' },
  { maquette: 'WEB-FID-Profil', route: '/app/profil', compte: 'fidele' },
  // Espace paroisse
  { maquette: 'WEB-PAR-Tableau-de-bord', route: '/espace/{node}', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Demandes', route: '/espace/{node}/demandes', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Demande-Detail', route: '/espace/{node}/demandes/{demande}', compte: 'admin_paroissial', trous: { demande: DEMANDE_PAR } },
  { maquette: 'WEB-PAR-Messagerie', route: '/espace/{node}/messagerie', compte: 'cure' },
  { maquette: 'WEB-PAR-Confessions', route: '/espace/{node}/confessions', compte: 'cure' },
  { maquette: 'WEB-PAR-Annonces', route: '/espace/{node}/annonces', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Annonce-Editeur', route: '/espace/{node}/annonces/nouvelle', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Horaires', route: '/espace/{node}/horaires', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Agenda', route: '/espace/{node}/agenda', compte: 'admin_paroissial' },
  { maquette: 'WEB-PAR-Equipe', route: '/espace/{node}/equipe', compte: 'cure' },
  { maquette: 'WEB-PAR-Parametres', route: '/espace/{node}/parametres', compte: 'cure' },
  // Espace diocèse
  { maquette: 'WEB-DIO-Tableau-de-bord', route: '/espace/{node}', compte: 'chancelier' },
  { maquette: 'WEB-DIO-Structure', route: '/espace/{node}/structure', compte: 'chancelier' },
  { maquette: 'WEB-DIO-Nominations', route: '/espace/{node}/nominations', compte: 'chancelier' },
  { maquette: 'WEB-DIO-Clerge', route: '/espace/{node}/clerge', compte: 'chancelier' },
  // Plateforme
  { maquette: 'WEB-PLA-Tableau-de-bord', route: '/plateforme', compte: 'plateforme' },
  { maquette: 'WEB-PLA-Referentiels', route: '/plateforme/referentiels', compte: 'plateforme' },
  { maquette: 'WEB-PLA-Comptes', route: '/plateforme/comptes', compte: 'plateforme' },
  { maquette: 'WEB-PLA-Audit', route: '/plateforme/audit', compte: 'plateforme' },
];

/** Écrans du registre dont la maquette contient l'un des filtres (séparés par des virgules). */
export const select = (filtre = ''): Ecran[] => {
  const parts = filtre
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? ECRANS.filter((e) => parts.some((p) => e.maquette.includes(p))) : ECRANS;
};
