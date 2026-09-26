import { AUDIT_OUT } from '../playwright.audit.config';

export const PERSONAS = {
  fidele: { email: 'fidele@demo.jangubi.sn', entry: '/app' },
  mineur: { email: 'mineur@demo.jangubi.sn', entry: '/app' },
  cure: { email: 'cure@demo.jangubi.sn', entry: '/espace' },
  chancelier: { email: 'chancelier@demo.jangubi.sn', entry: '/espace' },
  plateforme: { email: 'plateforme@demo.jangubi.sn', entry: '/plateforme' },
} as const;
export type Persona = keyof typeof PERSONAS | 'anonyme';

export const statePath = (p: string) => `${AUDIT_OUT}/state-${p}.json`;

/** Identifiants réels de la base de dev (découverts par specs/00-discover.spec.ts le 26/09/2026). */
export const IDS = {
  paroisse: 'c64e06b7-cc45-498c-b4c7-a72a5d798756', // Saint-Dominique (cure@)
  diocese: 'b7116274-cb2d-49ef-a9cb-98c1475c5af1', // Archidiocèse de Dakar (chancelier@)
  annonce: 'edd10687-e0d4-4480-8ba5-5b3dbce897f3',
  annonceBo: 'f98dd0ea-b2b9-46ca-95a0-16b6f8c1f034',
  evenement: '1',
  demande: '13ab946a-df8e-428a-b3e5-a6a8964c9b1d',
};

export interface Screen {
  id: string;
  persona: Persona;
  path: string;
  label: string;
}

const P = `/espace/${IDS.paroisse}`;
const D = `/espace/${IDS.diocese}`;

export const SCREENS: Screen[] = [
  // Public
  { id: 'pub-accueil', persona: 'anonyme', path: '/', label: 'Accueil public' },
  { id: 'pub-paroisses', persona: 'anonyme', path: '/paroisses', label: 'Annuaire des paroisses' },
  { id: 'pub-fiche-paroisse', persona: 'anonyme', path: '/paroisses/DAK-SAINT-DOMINIQUE', label: 'Fiche paroisse' },
  { id: 'pub-parole', persona: 'anonyme', path: '/parole', label: 'Parole du jour (public)' },
  { id: 'pub-offre', persona: 'anonyme', path: '/pour-les-paroisses', label: 'Pour les paroisses' },
  { id: 'pub-confidentialite', persona: 'anonyme', path: '/confidentialite', label: 'Confidentialité' },
  { id: 'pub-conditions', persona: 'anonyme', path: '/conditions', label: 'Conditions' },
  { id: 'pub-404', persona: 'anonyme', path: '/page-inconnue', label: 'Page 404' },
  // Keycloak (thème Jàngu Bi)
  { id: 'kc-connexion', persona: 'anonyme', path: '/connexion', label: 'Keycloak — connexion' },
  { id: 'kc-inscription', persona: 'anonyme', path: '/inscription', label: 'Keycloak — inscription' },
  // Espace fidèle
  { id: 'app-accueil', persona: 'fidele', path: '/app', label: 'Fidèle — accueil' },
  { id: 'app-parole', persona: 'fidele', path: '/app/parole', label: 'Fidèle — lectures du jour' },
  { id: 'app-bible', persona: 'fidele', path: '/app/bible', label: 'Fidèle — Bible (index)' },
  { id: 'app-bible-chapitre', persona: 'fidele', path: '/app/bible/genese/1', label: 'Fidèle — Bible chapitre' },
  { id: 'app-chapelet', persona: 'fidele', path: '/app/chapelet', label: 'Fidèle — chapelet' },
  { id: 'app-paroisse', persona: 'fidele', path: '/app/paroisse', label: 'Fidèle — ma paroisse' },
  { id: 'app-annonce', persona: 'fidele', path: `/app/paroisse/annonces/${IDS.annonce}`, label: 'Fidèle — annonce' },
  { id: 'app-evenement', persona: 'fidele', path: `/app/paroisse/evenements/${IDS.evenement}`, label: 'Fidèle — événement' },
  { id: 'app-notifications', persona: 'fidele', path: '/app/notifications', label: 'Fidèle — notifications' },
  { id: 'app-demandes', persona: 'fidele', path: '/app/demandes', label: 'Fidèle — mes demandes' },
  { id: 'app-demande-nouvelle', persona: 'fidele', path: '/app/demandes/nouvelle', label: 'Fidèle — nouvelle demande' },
  { id: 'app-demande-suivi', persona: 'fidele', path: `/app/demandes/${IDS.demande}`, label: 'Fidèle — suivi de demande' },
  { id: 'app-pretres', persona: 'fidele', path: '/app/pretres', label: 'Fidèle — parler à un prêtre' },
  { id: 'app-pretres-mineur', persona: 'mineur', path: '/app/pretres', label: 'Mineur — messagerie refusée' },
  { id: 'app-confession', persona: 'fidele', path: '/app/confession', label: 'Fidèle — RDV de confession' },
  { id: 'app-profil', persona: 'fidele', path: '/app/profil', label: 'Fidèle — profil et sécurité' },
  { id: 'app-bienvenue', persona: 'fidele', path: '/bienvenue', label: 'Bienvenue (inscription 2-3/3)' },
  // Back-office paroisse (curé)
  { id: 'bo-tableau-de-bord', persona: 'cure', path: P, label: 'Paroisse — tableau de bord' },
  { id: 'bo-demandes', persona: 'cure', path: `${P}/demandes`, label: 'Paroisse — file des demandes' },
  { id: 'bo-demande-detail', persona: 'cure', path: `${P}/demandes/${IDS.demande}`, label: 'Paroisse — traitement demande' },
  { id: 'bo-annonces', persona: 'cure', path: `${P}/annonces`, label: 'Paroisse — annonces' },
  { id: 'bo-annonce-nouvelle', persona: 'cure', path: `${P}/annonces/nouvelle`, label: 'Paroisse — éditeur (nouvelle)' },
  { id: 'bo-annonce-edition', persona: 'cure', path: `${P}/annonces/${IDS.annonceBo}`, label: 'Paroisse — éditeur (existante)' },
  { id: 'bo-feuille', persona: 'cure', path: `${P}/annonces/feuille?date=2026-09-27`, label: 'Paroisse — feuille dominicale' },
  { id: 'bo-horaires', persona: 'cure', path: `${P}/horaires`, label: 'Paroisse — horaires et lieux' },
  { id: 'bo-agenda', persona: 'cure', path: `${P}/agenda`, label: 'Paroisse — agenda' },
  { id: 'bo-messagerie', persona: 'cure', path: `${P}/messagerie`, label: 'Paroisse — messagerie' },
  { id: 'bo-confessions', persona: 'cure', path: `${P}/confessions`, label: 'Paroisse — créneaux de confession' },
  { id: 'bo-equipe', persona: 'cure', path: `${P}/equipe`, label: 'Paroisse — équipe' },
  { id: 'bo-parametres', persona: 'cure', path: `${P}/parametres`, label: 'Paroisse — paramètres' },
  { id: 'bo-audit', persona: 'cure', path: `${P}/audit`, label: 'Paroisse — journal' },
  // Back-office diocèse (chancelier)
  { id: 'dio-tableau-de-bord', persona: 'chancelier', path: D, label: 'Diocèse — tableau de bord' },
  { id: 'dio-structure', persona: 'chancelier', path: `${D}/structure`, label: 'Diocèse — structure (arbre)' },
  { id: 'dio-nominations', persona: 'chancelier', path: `${D}/nominations`, label: 'Diocèse — nominations' },
  { id: 'dio-clerge', persona: 'chancelier', path: `${D}/clerge`, label: 'Diocèse — clergé' },
  { id: 'dio-audit', persona: 'chancelier', path: `${D}/audit`, label: 'Diocèse — journal' },
  // Plateforme
  { id: 'pla-tableau-de-bord', persona: 'plateforme', path: '/plateforme', label: 'Plateforme — tableau de bord' },
  { id: 'pla-referentiels', persona: 'plateforme', path: '/plateforme/referentiels', label: 'Plateforme — référentiels' },
  { id: 'pla-comptes', persona: 'plateforme', path: '/plateforme/comptes', label: 'Plateforme — comptes' },
  { id: 'pla-audit', persona: 'plateforme', path: '/plateforme/audit', label: 'Plateforme — audit' },
];
