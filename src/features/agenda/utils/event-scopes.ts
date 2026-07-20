import type { User } from '@/lib/auth';

/**
 * Portées territoriales qu'un utilisateur peut réellement donner à un événement.
 *
 * Le backend fait défaut à `global` quand aucune portée n'est transmise
 * (`EventInputSerializer.scope_type`, default "global"), et
 * `_check_event_scope_authority` réserve `global` aux administrateurs province
 * ou national. Un prêtre, un diacre ou un évêque recevait donc un 400
 * systématique à la création d'un événement, alors que la matrice de
 * permissions leur accorde ce droit sur leur territoire.
 *
 * On dérive donc ici les portées légitimes depuis le rattachement de
 * l'utilisateur. Le backend reste l'autorité : il revalide chaque portée.
 */

export type EventScopeType = 'parish' | 'diocese' | 'global';

export interface EventScopeOption {
  value: EventScopeType;
  label: string;
  /** Id territorial à transmettre (`scope_id`) ; `null` pour la portée globale. */
  scopeId: number | null;
}

// ⚠️ `user.province` est DÉRIVÉE de l'appartenance principale : elle est
// renseignée pour tout le monde, y compris un simple fidèle. Elle ne prouve
// donc AUCUNE autorité provinciale — celle-ci vient d'une RoleAssignment
// (`accessible_province_ids`, apps/users/scoping.py). S'en servir pour ouvrir
// la portée globale rendrait le 400 à tous les utilisateurs.
const GLOBAL_CAPABLE_ROLES = ['super_admin', 'province_admin'] as const;
const GLOBAL_CAPABLE_PASTORAL_ROLES = ['archeveque'] as const;

export function availableEventScopes(
  user: User | null | undefined,
): EventScopeOption[] {
  if (!user) return [];

  const options: EventScopeOption[] = [];

  // `/me` renvoie la paroisse principale sous `profile`, pas à la racine.
  const primaryParish = user.profile?.primary_parish;
  if (primaryParish) {
    options.push({
      value: 'parish',
      label: `Ma paroisse — ${primaryParish.name}`,
      scopeId: primaryParish.id,
    });
  }

  if (user.diocese) {
    options.push({
      value: 'diocese',
      label: `Mon diocèse — ${user.diocese.name}`,
      scopeId: user.diocese.id,
    });
  }

  // `global` n'est accordé qu'aux administrateurs province/national — l'exposer
  // à un curé ne produirait qu'un 400 côté serveur.
  if (
    (GLOBAL_CAPABLE_ROLES as readonly string[]).includes(user.role) ||
    (user.pastoral_role != null &&
      (GLOBAL_CAPABLE_PASTORAL_ROLES as readonly string[]).includes(
        user.pastoral_role,
      ))
  ) {
    options.push({ value: 'global', label: 'Toute la plateforme', scopeId: null });
  }

  return options;
}

/**
 * Portée proposée par défaut : la plus étroite dont dispose l'utilisateur.
 * Un curé publie pour sa paroisse, pas pour la plateforme entière.
 */
export function defaultEventScope(
  user: User | null | undefined,
): EventScopeOption | null {
  return availableEventScopes(user)[0] ?? null;
}
