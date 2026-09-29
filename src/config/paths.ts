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
  /** Aide (en-tête et pied de page publics) : pas encore de page dédiée, renvoie au contact. */
  aide: { getHref: () => '/pour-les-paroisses#contact' },
  applicationMobile: { getHref: () => '/#application' },
  /** Dons sans compte (WEB-Don-Paroisse) et retour de l'agrégateur (DONATIONS_RETURN_URL du backend). */
  dons: {
    paroisse: { getHref: (code: string, fundId?: string) => `/paroisses/${enc(code)}/don${fundId ? `?fonds=${enc(fundId)}` : ''}` },
    /** Redirection vers l'agrégateur, parcours sans compte (même écran que WEB-FID-Don-Redirection). */
    redirection: { getHref: (donationId: string) => `/dons/redirection?don=${enc(donationId)}` },
    retour: { getHref: (donationId: string) => `/dons/retour?don=${enc(donationId)}` },
  },

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
    erreur: {
      getHref: (error?: string | null, redirectTo?: string | null) => {
        const params = new URLSearchParams();
        if (error) params.set('error', error);
        if (redirectTo) params.set('redirectTo', redirectTo);
        const query = params.toString();
        return `/connexion/erreur${query ? `?${query}` : ''}`;
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
    /** `jour` : 0 (dimanche) à 6, mystères d'un autre jour. */
    chapelet: { getHref: (jour?: number) => (jour === undefined ? '/app/chapelet' : `/app/chapelet?jour=${jour}`) },
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
    dons: {
      /** WEB-FID-Donner ; `fonds` présélectionne un fonds. */
      root: { getHref: (fundId?: string) => (fundId ? `/app/dons?fonds=${enc(fundId)}` : '/app/dons') },
      redirection: { getHref: (donationId: string) => `/app/dons/redirection?don=${enc(donationId)}` },
      confirmation: { getHref: (donationId: string) => `/app/dons/confirmation?don=${enc(donationId)}` },
      historique: { getHref: (year?: number) => (year ? `/app/dons/historique?annee=${year}` : '/app/dons/historique') },
      campagne: { getHref: (fundId: string) => `/app/dons/campagnes/${enc(fundId)}` },
    },
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
    dons: {
      /** WEB-PAR-Dons ; `mois` (AAAA-MM) : mois affiché, sinon le mois courant. */
      root: { getHref: (nodeId: string, mois?: string) => `/espace/${enc(nodeId)}/dons${mois ? `?mois=${enc(mois)}` : ''}` },
      nouvelleCampagne: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/dons/campagnes/nouvelle` },
      campagne: { getHref: (nodeId: string, fundId: string) => `/espace/${enc(nodeId)}/dons/campagnes/${enc(fundId)}` },
      quetes: { getHref: (nodeId: string) => `/espace/${enc(nodeId)}/dons/quetes` },
      /** `section` : ancre de la page (« reversements »). */
      export: { getHref: (nodeId: string, section?: 'reversements') => `/espace/${enc(nodeId)}/dons/export${section ? `#${section}` : ''}` },
    },
    quetesImperees: {
      getHref: (nodeId: string, queteId?: string) => `/espace/${enc(nodeId)}/quetes-imperees${queteId ? `?quete=${enc(queteId)}` : ''}`,
    },
  },

  plateforme: {
    root: { getHref: () => '/plateforme' },
    referentiels: { getHref: () => '/plateforme/referentiels' },
    comptes: { getHref: () => '/plateforme/comptes' },
    paiements: { getHref: () => '/plateforme/paiements' },
    audit: { getHref: () => '/plateforme/audit' },
  },
} as const;
