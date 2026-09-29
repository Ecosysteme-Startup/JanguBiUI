import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type FeedPage, feedPageSchema } from '../types/feed';

// Fil « Ma paroisse » (EF-PAROI-04, backend `apps/news/urls_me.py`) :
// `GET /me/feed/?limit=&offset=` — contenus globaux, de la paroisse
// principale et de ses ancêtres (doyenné, diocèse…), du plus récent au plus
// ancien. Les paroisses secondaires ont leur propre fil
// (`get-feed-secondaires.ts`).

export const getMeFeed = async ({
  limit = 20,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<FeedPage> =>
  feedPageSchema.parse(
    await api.get<unknown>('/v1/me/feed/', { params: { limit, offset } }),
  );

export const useMeFeed = ({ limit = 20, offset = 0 } = {}) =>
  useQuery({
    queryKey: ['articles', 'me-feed', { limit, offset }],
    queryFn: () => getMeFeed({ limit, offset }),
    placeholderData: keepPreviousData,
  });
