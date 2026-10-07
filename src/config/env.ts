import { z } from 'zod';

/**
 * Normalise une URL de store : les valeurs vides ou « placeholder » (gabarit de configuration non
 * remplacé : example/placeholder/changeme/todo/xxx, un identifiant d'app à zéros, « # ») sont
 * traitées comme absentes, pour afficher « Bientôt sur … » plutôt qu'un lien 404.
 */
export const storeUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/example|placeholder|changeme|change-me|à-remplir|a-remplir|todo|xxxx|id0000|^#$/i.test(trimmed)) return undefined;
  try {
    return new URL(trimmed).toString();
  } catch {
    return undefined;
  }
};

const PublicEnv = z.object({
  API_URL: z.string().url().default('http://localhost:8001/api/v1'),
  WS_URL: z.string().default('ws://localhost:8001'),
  SENTRY_DSN: z.string().optional(),
  /** Console d'administration Keycloak (lien externe de PLA-Comptes) ; absente : lien masqué. */
  KEYCLOAK_CONSOLE_URL: z.string().url().optional(),
  /** Fiches de l'application mobile dans les stores ; absentes : « Bientôt disponible ». */
  APP_STORE_URL: z.string().url().optional(),
  PLAY_STORE_URL: z.string().url().optional(),
  /**
   * Édition de la Bible réellement servie (ex. « Bible Crampon (1923) »). Absente : aucune mention
   * d'édition affichée (en recette, seul le texte AELF est servi — on ne revendique pas Crampon).
   */
  BIBLE_EDITION: z.string().optional(),
});

/** Variables publiques (intégrées au bundle au build). Aucun secret ici. */
export const env = PublicEnv.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || undefined,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  KEYCLOAK_CONSOLE_URL: process.env.NEXT_PUBLIC_KEYCLOAK_CONSOLE_URL || undefined,
  APP_STORE_URL: storeUrl(process.env.NEXT_PUBLIC_APP_STORE_URL),
  PLAY_STORE_URL: storeUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL),
  BIBLE_EDITION: process.env.NEXT_PUBLIC_BIBLE_EDITION || undefined,
});
