import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

/** Ancienne adresse : invitations et validation réunies (`comptes.valider`). */
export default function Page() {
  redirect(paths.app.admin.users.clerge.getHref());
}
