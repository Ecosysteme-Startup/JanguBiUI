import { z } from 'zod';

const PublicEnv = z.object({
  API_URL: z.string().url().default('http://localhost:8001/api/v1'),
  WS_URL: z.string().default('ws://localhost:8001'),
  SENTRY_DSN: z.string().optional(),
  /** Console d'administration Keycloak (lien externe de PLA-Comptes) ; absente : lien masqué. */
  KEYCLOAK_CONSOLE_URL: z.string().url().optional(),
  /** Fiches de l'application mobile dans les stores ; absentes : « Bientôt disponible ». */
  APP_STORE_URL: z.string().url().optional(),
  PLAY_STORE_URL: z.string().url().optional(),
});

/** Variables publiques (intégrées au bundle au build). Aucun secret ici. */
export const env = PublicEnv.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || undefined,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  KEYCLOAK_CONSOLE_URL: process.env.NEXT_PUBLIC_KEYCLOAK_CONSOLE_URL || undefined,
  APP_STORE_URL: process.env.NEXT_PUBLIC_APP_STORE_URL || undefined,
  PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL || undefined,
});
