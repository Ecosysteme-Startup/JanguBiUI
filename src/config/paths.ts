export const paths = {
  home: {
    getHref: () => '/app',
  },

  onboarding: {
    getHref: () => '/onboarding',
  },

  auth: {
    register: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    login: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    forgotPassword: {
      getHref: () => '/auth/forgot-password',
    },
    resetPassword: {
      getHref: (token?: string) =>
        token
          ? `/auth/reset-password?token=${encodeURIComponent(token)}`
          : '/auth/reset-password',
    },
    verifyEmail: {
      getHref: (token?: string) =>
        token
          ? `/auth/verify-email?token=${encodeURIComponent(token)}`
          : '/auth/verify-email',
    },
  },

  app: {
    root: { getHref: () => '/app' },
    actus: { getHref: () => '/app/actus' },
    article: { getHref: (id: string) => `/app/actus/${id}` },
    spirituel: { getHref: () => '/app/spirituel' },
    spirituelLiturgie: { getHref: () => '/app/spirituel/liturgie' },
    spirituelHeures: { getHref: () => '/app/spirituel/heures' },
    bible: { getHref: () => '/app/bible' },
    chapelet: { getHref: () => '/app/chapelet' },
    dons: { getHref: () => '/app/dons' },
    donsRetour: {
      getHref: (donId?: string) =>
        donId
          ? `/dons/retour?don=${encodeURIComponent(donId)}`
          : '/dons/retour',
    },
    donsAnalyse: { getHref: () => '/app/dons/analyse' },
    diocese: {
      dons: { getHref: () => '/app/diocese/dons' },
    },
    plateforme: {
      paiements: { getHref: () => '/app/plateforme/paiements' },
    },
    tv: { getHref: () => '/app/tv' },
    ecouter: {
      root: { getHref: () => '/app/ecouter' },
      album: { getHref: (id: string) => `/app/ecouter/albums/${id}` },
      source: { getHref: (id: string) => `/app/ecouter/sources/${id}` },
      playlist: { getHref: (id: string) => `/app/ecouter/playlists/${id}` },
      recherche: {
        getHref: (q?: string) =>
          q
            ? `/app/ecouter/recherche?q=${encodeURIComponent(q)}`
            : '/app/ecouter/recherche',
      },
      bibliotheque: { getHref: () => '/app/ecouter/bibliotheque' },
    },
    paroisse: {
      paroissiens: { getHref: () => '/app/paroisse/paroissiens' },
      sonotheque: { getHref: () => '/app/paroisse/sonotheque' },
      sonothequeAjouter: {
        getHref: (album?: string) =>
          album
            ? `/app/paroisse/sonotheque/ajouter?album=${encodeURIComponent(album)}`
            : '/app/paroisse/sonotheque/ajouter',
      },
    },
    messages: { getHref: () => '/app/messages' },
    conversation: { getHref: (id: string) => `/app/messages/${id}` },
    documents: { getHref: () => '/app/documents' },
    newDocument: { getHref: () => '/app/documents/new' },
    document: { getHref: (id: string) => `/app/documents/${id}` },
    agenda: { getHref: () => '/app/agenda' },
    confessions: { getHref: () => '/app/confessions' },
    agendaEvent: { getHref: (id: number | string) => `/app/agenda/${id}` },
    profil: { getHref: () => '/app/profil' },
    transfert: { getHref: () => '/app/transfert' },
    clerge: {
      root: { getHref: () => '/app/clerge' },
      analytique: { getHref: () => '/app/clerge/analytique' },
      intentions: { getHref: () => '/app/clerge/intentions' },
      messages: { getHref: () => '/app/clerge/messages' },
      transferts: { getHref: () => '/app/clerge/transferts' },
    },
    admin: {
      root: { getHref: () => '/app/admin' },
      agenda: { getHref: () => '/app/admin/agenda' },
      articles: { getHref: () => '/app/admin/articles' },
      articleNew: { getHref: () => '/app/admin/articles/new' },
      articleEdit: {
        getHref: (id: string) => `/app/admin/articles/${id}/edit`,
      },
      documents: { getHref: () => '/app/admin/documents' },
      tv: { getHref: () => '/app/admin/tv' },
      org: { getHref: () => '/app/admin/org' },
      users: {
        list: { getHref: () => '/app/admin/users' },
        invitations: { getHref: () => '/app/admin/users/invitations' },
        invite: { getHref: () => '/app/admin/users/invite' },
        validation: { getHref: () => '/app/admin/users/validation' },
      },
    },
  },

  acceptInvitation: {
    getHref: (token?: string) =>
      token
        ? `/accept-invitation?token=${encodeURIComponent(token)}`
        : '/accept-invitation',
  },
} as const;
