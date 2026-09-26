/**
 * Toutes les routes de l'application (spec §2). Ne jamais écrire une URL en dur :
 * `paths.app.demandes.detail.getHref(id)`.
 */
const enc = encodeURIComponent;

export const paths = {
  home: { getHref: () => '/' },
  parole: { getHref: (date?: string) => (date ? `/parole?date=${enc(date)}` : '/parole') },
  paroisses: {
    list: { getHref: () => '/paroisses' },
    detail: { getHref: (code: string) => `/paroisses/${enc(code)}` },
  },
  pourLesParoisses: { getHref: () => '/pour-les-paroisses' },
  confidentialite: { getHref: () => '/confidentialite' },
  conditions: { getHref: () => '/conditions' },
  contact: { getHref: () => '/pour-les-paroisses#contact' },

  auth: {
    connexion: {
      getHref: (redirectTo?: string | null, options?: { reauth?: boolean }) => {
        const params = new URLSearchParams();
        if (redirectTo) params.set('redirectTo', redirectTo);
        if (options?.reauth) params.set('reauth', '1');
        const query = params.toString();
        return `/connexion${query ? `?${query}` : ''}`;
      },
    },
    inscription: { getHref: () => '/inscription' },
    bienvenue: { getHref: () => '/bienvenue' },
  },

  app: {
    root: { getHref: () => '/app' },
    parole: { getHref: (date?: string) => (date ? `/app/parole?date=${enc(date)}` : '/app/parole') },
    bible: {
      root: { getHref: () => '/app/bible' },
      chapitre: { getHref: (livre: string, chapitre: number) => `/app/bible/${enc(livre)}/${chapitre}` },
    },
    chapelet: { getHref: () => '/app/chapelet' },
    paroisse: {
      root: { getHref: (section?: 'annonces' | 'horaires' | 'agenda') => `/app/paroisse${section ? `#${section}` : ''}` },
      annonce: { getHref: (id: number | string) => `/app/paroisse/annonces/${id}` },
      evenement: { getHref: (id: number | string) => `/app/paroisse/evenements/${id}` },
    },
    notifications: { getHref: () => '/app/notifications' },
    demandes: {
      list: { getHref: () => '/app/demandes' },
      nouvelle: { getHref: () => '/app/demandes/nouvelle' },
      detail: { getHref: (id: number | string) => `/app/demandes/${id}` },
    },
    pretres: {
      list: { getHref: () => '/app/pretres' },
      conversation: { getHref: (id: string) => `/app/pretres/conversations/${enc(id)}` },
    },
    confession: { getHref: () => '/app/confession' },
    profil: { getHref: () => '/app/profil' },
    etatDeVie: { getHref: () => '/app/profil#etat-de-vie' },
  },

  espace: {
    root: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}` },
    demandes: {
      list: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/demandes` },
      detail: { getHref: (nodeId: string, id: number | string) => `/espace/${enc(nodeId)}/demandes/${id}` },
    },
    annonces: {
      list: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/annonces` },
      nouvelle: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/annonces/nouvelle` },
      detail: { getHref: (nodeId: string, id: number | string) => `/espace/${enc(nodeId)}/annonces/${id}` },
      feuille: {
        getHref: (nodeId: string, sunday?: string) =>
          `/espace/${enc(nodeId)}/annonces/feuille${sunday ? `?date=${encodeURIComponent(sunday)}` : ''}`,
      },
    },
    horaires: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/horaires` },
    agenda: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/agenda` },
    messagerie: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/messagerie` },
    confessions: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/confessions` },
    equipe: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/equipe` },
    parametres: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/parametres` },
    structure: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/structure` },
    nominations: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/nominations` },
    clerge: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/clerge` },
    audit: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/audit` },
  },

  plateforme: {
    root: { getHref: () => '/plateforme' },
    referentiels: { getHref: () => '/plateforme/referentiels' },
    comptes: { getHref: () => '/plateforme/comptes' },
    audit: { getHref: () => '/plateforme/audit' },
  },
} as const;
