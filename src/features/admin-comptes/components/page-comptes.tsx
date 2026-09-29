'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { peut } from '@/lib/staff/capacites';

import { NavComptes } from './commun';

/** Coquille des écrans « Comptes » : garde `comptes.gerer` (ou plateforme)
 *  et onglets de la section. */
export function PageComptes({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPageLayout
      title={title}
      subtitle={subtitle}
      allow={peut('comptes.gerer', 'plateforme.admin')}
      width="full"
    >
      <NavComptes />
      {children}
    </AdminPageLayout>
  );
}
