'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { fonctionnaliteActive } from '@/config/fonctionnalites';
import { EspacesStaff } from '@/features/dashboard/components/espaces-staff';
import { TableauNoeudSection } from '@/features/dashboard/components/tableau-noeud';
import { PastoralReflectionComposer } from '@/features/reflexion-pastorale/components/pastoral-reflection-composer';
import { useUser } from '@/lib/auth';
import { aCapacite } from '@/lib/staff/capacites';

import { WelcomeBanner } from './welcome-banner';

/**
 * Accueil du clergé (prêtre, évêque) : espaces ouverts par ses nominations et
 * tableau de bord du nœud. Les anciennes sections (intentions de messe,
 * messagerie inter-clergé) attendent leurs routes (docs/BRANCHEMENT-STAFF.md).
 */
export function AccueilClerge() {
  const { data: user } = useUser();
  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-8">
        <WelcomeBanner />
        <EspacesStaff />
        {aCapacite(user, 'tableau_bord.voir') && <TableauNoeudSection />}
        {fonctionnaliteActive('reflexionPastorale') && (
          <PastoralReflectionComposer />
        )}
      </div>
    </ContentContainer>
  );
}
