'use client';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import { FaireUnDon } from '@/features/dons/components/faire-un-don';
import { MesDons } from '@/features/dons/components/mes-dons';
import { Onglets } from '@/features/dons-analyse/components/onglets-dons';
import { useUser } from '@/lib/auth';
import { canViewParishDonsAnalysis } from '@/lib/authorization';

/**
 * Dons du fidèle : donner à l'une de ses paroisses (page de don publique,
 * checkout de l'agrégateur) et retrouver ses dons et reçus.
 * Routes : docs/BRANCHEMENT-FIDELE.md (§ Dons).
 */
export default function DonsPage() {
  const { data: user } = useUser();

  useRegisterPageMeta({ title: 'Dons & Quêtes' });

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto p-4 lg:max-w-3xl">
        {/* Staff paroissial : bascule vers l'analyse des dons (décisions du 27/09). */}
        {canViewParishDonsAnalysis(user) && (
          <Onglets
            actif="operations"
            onglets={[
              {
                cle: 'operations',
                libelle: 'Opérations',
                href: paths.app.dons.getHref(),
              },
              {
                cle: 'analyse',
                libelle: 'Analyse',
                href: paths.app.donsAnalyse.getHref(),
              },
            ]}
          />
        )}

        <Tabs defaultValue="donner" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="donner">Donner</TabsTrigger>
            <TabsTrigger value="mes-dons">Mes dons</TabsTrigger>
          </TabsList>
          <TabsContent value="donner">
            <FaireUnDon />
          </TabsContent>
          <TabsContent value="mes-dons">
            <MesDons />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
