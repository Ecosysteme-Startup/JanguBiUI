'use client';

import { KeycloakRedirect } from '@/features/auth/components/keycloak-redirect';

// Mot de passe, vérification et changement d'e-mail relèvent de Keycloak : sa
// page de connexion propose « Mot de passe oublié ? ». Ancien lien : on y va.
const LegacyAuthPage = () => <KeycloakRedirect action="login" />;

export default LegacyAuthPage;
