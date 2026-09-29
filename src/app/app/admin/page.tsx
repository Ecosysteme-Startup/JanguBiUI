'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { EspacesStaff } from '@/features/dashboard/components/espaces-staff';
import { TableauNoeudSection } from '@/features/dashboard/components/tableau-noeud';
import { TableauPlateformeSection } from '@/features/dashboard/components/tableau-plateforme';
import { useUser } from '@/lib/auth';
import { aCapacite } from '@/lib/staff/capacites';

/** Accueil du staff : espaces ouverts par les capacités, puis indicateurs. */
export default function AdminDashboardPage() {
  const { data: user } = useUser();
  return (
    <AdminPageLayout
      title="Administration"
      subtitle="Espaces de travail et tableau de bord"
      allow={(u) => (u?.capabilities?.length ?? 0) > 0}
    >
      <div className="space-y-8">
        <EspacesStaff />
        {aCapacite(user, 'tableau_bord.voir') && <TableauNoeudSection />}
        {aCapacite(user, 'plateforme.admin') && <TableauPlateformeSection />}
      </div>
    </AdminPageLayout>
  );
}
