import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

// Ancienne liste « Comptes de la plateforme » : remplacée par
// l'administration des comptes synchronisée avec Keycloak.
export default function AdminUsersPage() {
  redirect(paths.app.admin.comptes.liste.getHref());
}
