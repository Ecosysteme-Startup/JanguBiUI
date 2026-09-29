import { ADMIN_ROLES, CLERGY_ROLES, User, UserRole } from './auth';

export const isAdmin = (user: User | null | undefined): boolean => {
  return user ? ADMIN_ROLES.includes(user.role) : false;
};

export const isSuperAdmin = (user: User | null | undefined): boolean => {
  return user?.role === 'super_admin';
};

export const isProvinceAdminOrAbove = (
  user: User | null | undefined,
): boolean => {
  return user
    ? (['super_admin', 'province_admin'] as UserRole[]).includes(user.role)
    : false;
};

export const isDioceseAdminOrAbove = (
  user: User | null | undefined,
): boolean => {
  return user
    ? (
        ['super_admin', 'province_admin', 'diocese_admin'] as UserRole[]
      ).includes(user.role)
    : false;
};

export const isParishLevelAdmin = (user: User | null | undefined): boolean => {
  return user
    ? (['parish_admin', 'church_admin'] as UserRole[]).includes(user.role)
    : false;
};

export const isFidele = (user: User | null | undefined): boolean => {
  return user?.role === 'fidele';
};

// Articles
export const canCreateArticle = (user: User | null | undefined): boolean =>
  isAdmin(user);

export const canPublishArticle = (user: User | null | undefined): boolean =>
  isAdmin(user);

// church_admin cannot unpublish — only parish_admin and above
export const canUnpublishArticle = (user: User | null | undefined): boolean => {
  return user
    ? (
        [
          'super_admin',
          'province_admin',
          'diocese_admin',
          'parish_admin',
        ] as UserRole[]
      ).includes(user.role)
    : false;
};

// Document requests
export const canProcessDocuments = (user: User | null | undefined): boolean =>
  isAdmin(user);

// User management (diocese level and above)
export const canManageUsers = (user: User | null | undefined): boolean =>
  isDioceseAdminOrAbove(user);

// TV content (super admin only)
export const canManageTV = (user: User | null | undefined): boolean =>
  isSuperAdmin(user);

// Clergy checks — l'identité pastorale vit dans `pastoral_role` (jamais `role`).
export const isClergy = (user: User | null | undefined): boolean => {
  const pastoral = user?.pastoral_role;
  return pastoral ? CLERGY_ROLES.includes(pastoral) : false;
};

export const isPretre = (user: User | null | undefined): boolean =>
  user?.pastoral_role === 'pretre';

export const isDiacre = (user: User | null | undefined): boolean =>
  user?.pastoral_role === 'diacre';

export const isEvequeOrAbove = (user: User | null | undefined): boolean =>
  user?.pastoral_role === 'eveque' || user?.pastoral_role === 'archeveque';

// Pastoral = clergé (via pastoral_role) OU fidèle laïc (via role, dimension
// admin où 'fidele' = « pas un administrateur »). Les deux sous-helpers lisent
// désormais le bon champ, donc la composition reste correcte.
export const isPastoralRole = (user: User | null | undefined): boolean =>
  isClergy(user) || isFidele(user);

// Can invite clergy members (eveque, archeveque via pastoral_role, or super_admin)
export const canManageClergy = (user: User | null | undefined): boolean =>
  isSuperAdmin(user) || isEvequeOrAbove(user);

// Tableaux de bord des dons (décisions du 27/09). Si /me expose les capacités,
// elles font foi ; sinon on se replie sur les rôles. Le back reste la source de
// vérité (403 → état « vue non ouverte »).
const capabilityOr = (
  user: User | null | undefined,
  capability: string,
  fallback: (u: User | null | undefined) => boolean,
): boolean => {
  if (!user) return false;
  if (Array.isArray(user.capabilities)) {
    return user.capabilities.includes(capability);
  }
  return fallback(user);
};

/** Analyse des dons d'une paroisse : curé, économe (dons.voir_fonds). */
export const canViewParishDonsAnalysis = (
  user: User | null | undefined,
): boolean =>
  capabilityOr(
    user,
    'dons.voir_fonds',
    (u) => isParishLevelAdmin(u) || isPretre(u) || isSuperAdmin(u),
  );

/** Agrégats diocésains des dons (dons.voir_agregats). */
export const canViewDioceseDonsAggregates = (
  user: User | null | undefined,
): boolean =>
  capabilityOr(
    user,
    'dons.voir_agregats',
    (u) => isDioceseAdminOrAbove(u) || isEvequeOrAbove(u),
  );

/** Santé des paiements côté plateforme Numerisen (plateforme.admin). */
export const canViewPlatformPayments = (
  user: User | null | undefined,
): boolean => capabilityOr(user, 'plateforme.admin', isSuperAdmin);
