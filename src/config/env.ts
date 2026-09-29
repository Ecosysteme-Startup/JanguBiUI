import * as z from 'zod';
import 'dotenv/config';

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: z.string().default('http://localhost:8001/api'),
    // Mode mocks (serveur de mocks MSW, comptes de démonstration) : jamais en
    // production, quelle que soit la variable.
    ENABLE_API_MOCKING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true' && process.env.NODE_ENV !== 'production')
      .optional(),
    APP_URL: z.string().optional().default('http://localhost:3000'),
    APP_MOCK_API_PORT: z.string().optional().default('8080'),
    // Keycloak (OIDC, client public `jangubi-web`, Authorization Code + PKCE).
    KEYCLOAK_URL: z.string().default('http://localhost:8180'),
    KEYCLOAK_REALM: z.string().default('jangubi'),
    KEYCLOAK_CLIENT_ID: z.string().default('jangubi-web'),
  });

  const envVars = {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    // NEXT_PUBLIC_API_MOCKING ; NEXT_PUBLIC_ENABLE_API_MOCKING reste lu (ancien nom).
    ENABLE_API_MOCKING:
      process.env.NEXT_PUBLIC_API_MOCKING ??
      process.env.NEXT_PUBLIC_ENABLE_API_MOCKING,
    APP_URL: process.env.NEXT_PUBLIC_URL,
    APP_MOCK_API_PORT: process.env.NEXT_PUBLIC_MOCK_API_PORT,
    KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || undefined,
    KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || undefined,
    KEYCLOAK_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || undefined,
  };

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
  The following variables are missing or invalid:
  ${Object.entries(parsedEnv.error.flatten().fieldErrors)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')}
  `,
    );
  }

  return parsedEnv.data ?? {};
};

export const env = createEnv();
