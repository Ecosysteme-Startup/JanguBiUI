'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { lireLienBible } from '../utils/liens';

import { BibleBooksTab } from './bible-books-tab';
import { HeuresTab } from './heures-tab';
import { LectioDivina } from './lectio-divina';
import { MasseTab } from './masse-tab';
import { ReadingPlanList } from './reading-plan-list';
import { TodayTab } from './today-tab';

const VALID_TABS = [
  'aujourdhui',
  'bible',
  'messe',
  'heures',
  'lectio',
  'parcours',
] as const;
type TabValue = (typeof VALID_TABS)[number];

function resolveTab(tab: string | null): TabValue {
  if (tab && (VALID_TABS as readonly string[]).includes(tab)) {
    return tab as TabValue;
  }
  return 'aujourdhui';
}

export function BibleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = resolveTab(searchParams.get('tab'));
  // Lien profond (« Reprendre », référence d'un verset) : livre, chapitre, verset.
  const cible = lireLienBible((cle) => searchParams.get(cle));
  const cleCible = cible
    ? `${cible.livreId}-${cible.chapitre}-${cible.verset ?? ''}`
    : 'aucune';

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    ['livre', 'chapitre', 'verset'].forEach((cle) => params.delete(cle));
    router.replace(`/app/bible?${params.toString()}`);
  }

  useRegisterPageMeta({
    title: 'Bible & Liturgie',
    subtitle: 'Parole de Dieu au quotidien',
  });

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl p-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-between">
            <TabsTrigger value="aujourdhui">Aujourd&apos;hui</TabsTrigger>
            <TabsTrigger value="bible">Bible</TabsTrigger>
            <TabsTrigger value="messe">Messe</TabsTrigger>
            <TabsTrigger value="heures">Heures</TabsTrigger>
            <TabsTrigger value="lectio">Lectio</TabsTrigger>
            <TabsTrigger value="parcours">Parcours</TabsTrigger>
          </TabsList>

          <TabsContent value="aujourdhui">
            <TodayTab />
          </TabsContent>
          <TabsContent value="bible">
            <BibleBooksTab key={cleCible} cible={cible} />
          </TabsContent>
          <TabsContent value="messe">
            <MasseTab />
          </TabsContent>
          <TabsContent value="heures">
            <HeuresTab />
          </TabsContent>
          <TabsContent value="lectio">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Méditez la Parole en 4 étapes. Sélectionnez un passage depuis
                l&apos;onglet Bible pour démarrer une session sur ce texte
                précis, ou utilisez le passage du jour (id&nbsp;0 = liturgie du
                jour).
              </p>
              <LectioDivina passageId={0} />
            </div>
          </TabsContent>
          <TabsContent value="parcours">
            <ReadingPlanList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
