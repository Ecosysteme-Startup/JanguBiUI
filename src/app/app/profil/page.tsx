import type { Metadata } from 'next';
import { connection } from 'next/server';

import { ProfilePage } from '@/features/profil/components/profile-page';
import { keycloakIssuer } from '@/lib/keycloak-token';

export const metadata: Metadata = { title: 'Mon profil' };

/**
 * La console de compte Keycloak (mot de passe, 2FA, sessions) se déduit de l'issuer, lu au
 * moment de la requête côté serveur : aucune variable publique supplémentaire.
 */
const ProfilPage = async () => {
  await connection();
  return <ProfilePage accountUrl={`${keycloakIssuer()}/account`} />;
};

export default ProfilPage;
