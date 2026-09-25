import { z } from 'zod';

export const PALETTES = ['ciel', 'lumiere', 'atlantique', 'cathedrale'] as const;
export type Palette = (typeof PALETTES)[number];

const PublicEnv = z.object({
  API_URL: z.string().url().default('http://localhost:8001/api/v1'),
  WS_URL: z.string().default('ws://localhost:8001'),
  PALETTE: z.enum(PALETTES).default('ciel'),
  SENTRY_DSN: z.string().optional(),
});

/** Variables publiques (intégrées au bundle au build). Aucun secret ici. */
export const env = PublicEnv.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || undefined,
  PALETTE: process.env.NEXT_PUBLIC_PALETTE || undefined,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
});
