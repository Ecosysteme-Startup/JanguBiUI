import { z } from 'zod';

/**
 * Comptes de la plateforme (GET /platform/accounts/…). Contrat défini dans le brief F8b :
 * pas encore dans schema.yml, d'où un schéma écrit à la main (à remplacer par les types
 * générés dès que l'endpoint est publié).
 */
export const REALM_ROLES = ['fidele', 'staff', 'platform_admin'] as const;
export const MFA_KINDS = ['totp', 'webauthn', 'facultative'] as const;
export const ACCOUNT_STATUSES = ['actif', 'verrouille', 'a_confirmer'] as const;

export const accountSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  realm_role: z.enum(REALM_ROLES),
  mfa: z.enum(MFA_KINDS),
  last_login: z.string().nullable(),
  status: z.enum(ACCOUNT_STATUSES),
  node_label: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;

export const accountDetailSchema = accountSchema.extend({
  keycloak_id: z.string().nullable(),
  email_verified: z.boolean(),
  offices: z.array(
    z.object({ office_label: z.string(), node_name: z.string(), start_date: z.string(), capabilities: z.array(z.string()) }),
  ),
  sessions: z.array(z.object({ id: z.string(), client: z.string(), ip: z.string(), started_at: z.string() })),
});
export type AccountDetail = z.infer<typeof accountDetailSchema>;

export const MFA_LABEL: Record<Account['mfa'], string> = { totp: 'TOTP', webauthn: 'Clé de sécurité', facultative: 'Facultative' };
export const STATUS_LABEL: Record<Account['status'], string> = { actif: 'Actif', verrouille: 'Verrouillé', a_confirmer: 'À confirmer' };

export const accountKeys = {
  all: ['comptes'] as const,
  list: (filters: object) => ['comptes', 'list', filters] as const,
  detail: (id: string) => ['comptes', 'detail', id] as const,
};
