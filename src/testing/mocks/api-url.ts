import { env } from '@/config/env';

/** URL absolue d'un endpoint, comme la construit `api-client`. */
export const apiUrl = (path: string) => `${env.API_URL}${path}`;
