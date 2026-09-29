'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { useAnnouncements } from '../api/get-announcements';
import { useEvents } from '../api/get-events';
import { useParish } from '../api/get-parish';
import { useParishSheet } from '../api/get-parish-sheet';
import { useParishWeek } from '../api/get-parish-week';
import { useHashTab } from '../hooks/use-hash-tab';

import { ActsCard } from './acts-card';
import { AgendaSection } from './agenda-section';
import { AnnouncementsSection } from './announcements-section';
import { ClergySection } from './clergy-section';
import { ConfessionCard } from './confession-card';
import { ContactCard } from './contact-card';
import { NextMasses } from './next-masses';
import { ParishBanner } from './parish-banner';
import { ParishHeader } from './parish-header';
import { RecentAnnouncements } from './recent-announcements';
import { ScheduleSection } from './schedule-section';
import type { ParishTab } from './tab-link';
import { UpcomingEvents } from './upcoming-events';
import { WorshipPlaces } from './worship-places';

const TABS = ['apercu', 'horaires', 'annonces', 'agenda'] as const satisfies readonly ParishTab[];

/** Aperçu : prochaines messes, annonces récentes, événements, lieux de culte. */
const Overview = ({ nodeId, onSelectTab }: { nodeId: string; onSelectTab: (tab: ParishTab) => void }) => {
  const week = useParishWeek(nodeId);
  const announcements = useAnnouncements(nodeId);
  const events = useEvents(nodeId);
  const loading = week.isPending || announcements.isPending || events.isPending;
  const failed = announcements.isError;

  if (loading) return <LoadingBlock label="Chargement de votre paroisse…" lines={4} />;
  const empty = !week.data?.occurrences.length && !announcements.data?.results.length && !events.data?.results.length;

  return (
    <div className="flex flex-col gap-10">
      <NextMasses week={week.data} onSelectTab={onSelectTab} />
      {failed ? (
        <EmptyState tone="err" title="Les annonces n’ont pas pu être chargées." />
      ) : (
        <RecentAnnouncements items={announcements.data?.results ?? []} total={announcements.data?.count ?? 0} onSelectTab={onSelectTab} />
      )}
      <UpcomingEvents events={(events.data?.results ?? []).filter((e) => !e.is_cancelled)} onSelectTab={onSelectTab} />
      <WorshipPlaces places={week.data?.places ?? []} />
      {empty && !failed && (
        <EmptyState icon="paroisse" title="Rien de publié pour le moment.">
          Les horaires, annonces et événements de votre paroisse apparaîtront ici dès leur publication.
        </EmptyState>
      )}
    </div>
  );
};

/** Colonne de droite : confessions, clergé, contact, demande d'extrait d'acte (+ bloc injecté par la page). */
const Aside = ({ nodeId, extra }: { nodeId: string; extra?: ReactNode }) => {
  const { data: parish } = useParish(nodeId);
  const { data: sheet } = useParishSheet(parish?.code);
  const { data: week } = useParishWeek(nodeId);
  const address = [parish?.address, parish?.city].filter(Boolean).join(', ');
  return (
    <aside aria-label="Informations pratiques" className="flex min-w-0 flex-col gap-6">
      <ConfessionCard week={week} />
      <ClergySection nodeId={nodeId} sheet={sheet} />
      <ContactCard secretariat={sheet?.secretariat} address={address} />
      <ActsCard />
      {extra}
    </aside>
  );
};

/** Ma paroisse (FID-Ma-Paroisse) : la paroisse suivie, onglets Aperçu, Horaires, Annonces, Agenda (#ancre). */
export const ParishOverview = ({
  renderAsideExtra,
}: {
  /** Bloc ajouté en fin de colonne droite par la page (ex. « Soutenir la paroisse », feature dons). */
  renderAsideExtra?: (nodeId: string) => ReactNode;
} = {}) => {
  const { data: me, isPending, isError } = useMe();
  const [tab, setTab] = useHashTab(TABS, 'apercu');
  const paroisse = me?.paroisse_suivie ?? null;
  const { data: week } = useParishWeek(paroisse?.id ?? null);
  const { data: announcements } = useAnnouncements(paroisse?.id ?? null);

  if (isPending) return <LoadingBlock label="Chargement de votre paroisse…" lines={4} />;
  if (isError) {
    return (
      <EmptyState tone="err" title="Votre paroisse n’a pas pu être chargée.">
        Vérifiez votre connexion puis rechargez la page.
      </EmptyState>
    );
  }
  if (!paroisse) {
    return (
      <EmptyState
        icon="paroisse"
        title="Vous ne suivez encore aucune paroisse."
        action={
          <NextLink href={paths.app.profil.getHref()} className="font-medium">
            Choisir ma paroisse
          </NextLink>
        }
      >
        Choisissez la paroisse que vous fréquentez pour recevoir ses annonces, ses horaires et son agenda.
      </EmptyState>
    );
  }

  const secondPlace = week?.places.find((p) => !p.is_main && week.places.some((q) => q.is_main))?.name;

  return (
    <div>
      <ParishBanner name={paroisse.name} secondPlace={secondPlace} />
      <ParishHeader nodeId={paroisse.id} name={paroisse.name} className="mt-6" />
      <Tabs value={tab} onValueChange={(value) => setTab(value as ParishTab)} className="mt-6">
        <TabsList id="mp-onglets" size="lg" aria-label="Sections de la paroisse" className="scroll-mt-20">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="horaires">Horaires</TabsTrigger>
          <TabsTrigger value="annonces" count={announcements?.count}>
            Annonces
          </TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="min-w-0">
            <TabsContent value="apercu">
              <Overview nodeId={paroisse.id} onSelectTab={setTab} />
            </TabsContent>
            <TabsContent value="horaires">
              <ScheduleSection nodeId={paroisse.id} />
            </TabsContent>
            <TabsContent value="annonces">
              <AnnouncementsSection nodeId={paroisse.id} />
            </TabsContent>
            <TabsContent value="agenda">
              <AgendaSection nodeId={paroisse.id} />
            </TabsContent>
          </div>
          <Aside nodeId={paroisse.id} extra={renderAsideExtra?.(paroisse.id)} />
        </div>
      </Tabs>
    </div>
  );
};
