// Clés react-query de la sonothèque (une seule source de vérité pour
// l'invalidation après un like, un ajout en playlist ou un envoi).
export const sonoKeys = {
  all: ['sonotheque'] as const,
  sources: (kind?: string) => ['sonotheque', 'sources', kind ?? 'all'] as const,
  source: (id: string) => ['sonotheque', 'source', id] as const,
  albums: (params: { kind?: string; source?: string }) =>
    ['sonotheque', 'albums', params] as const,
  album: (id: string) => ['sonotheque', 'album', id] as const,
  playlist: (id: string) => ['sonotheque', 'playlist', id] as const,
  bibliotheque: ['sonotheque', 'bibliotheque'] as const,
  recherche: (q: string) => ['sonotheque', 'recherche', q] as const,
  pourVous: ['sonotheque', 'pour-vous'] as const,
  ensuite: (trackId: string) => ['sonotheque', 'ensuite', trackId] as const,
  staffSources: ['sonotheque', 'staff', 'sources'] as const,
  staffTracks: (sourceId: string) =>
    ['sonotheque', 'staff', 'pistes', sourceId] as const,
  upload: (id: string) => ['sonotheque', 'upload', id] as const,
};

export const AUDIO = '/v1/audio';
