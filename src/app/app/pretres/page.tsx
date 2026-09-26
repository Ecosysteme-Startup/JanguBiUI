'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { ConfessionNotice } from '@/components/signature/confession-notice';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { NextConfessionCard } from '@/features/confession/components/next-confession-card';
import { useConversations } from '@/features/messagerie/api/get-conversations';
import { MessagingPrivacyNote } from '@/features/messagerie/components/messaging-privacy-note';
import { usePriests } from '@/features/pretres/api/get-priests';
import { PriestList } from '@/features/pretres/components/priest-list';
import { useMe } from '@/hooks/use-me';
import { parishLabel } from '@/utils/parish-name';

import { FideleConversations } from './_components/fidele-conversations';
import { CONVERSATIONS_VIEW, conversationsHref, PretresTabs } from './_components/pretres-tabs';

/** Prêtre → conversation déjà ouverte (« Reprendre la conversation »). */
const useConversationByPriest = (meId: string | undefined) => {
  const conversations = useConversations();
  const byPriest = new Map<string, string>();
  (conversations.data ?? []).forEach((c) => {
    const peer = c.participant_a.id === meId ? c.participant_b : c.participant_a;
    if (!byPriest.has(peer.id)) byPriest.set(peer.id, c.id);
  });
  return (priestUserId: string) => {
    const id = byPriest.get(priestUserId);
    return id ? paths.app.pretres.conversation.getHref(id) : undefined;
  };
};

// Prêtres joignables (FID-Pretres).
const PriestsView = () => {
  const me = useMe();
  const priests = usePriests();
  const parish = me.data?.paroisse_suivie ?? null;
  const conversationHrefOf = useConversationByPriest(me.data?.id);
  const count = priests.data?.length;

  return (
    <>
      <TopbarContent
        start={<Breadcrumbs items={[{ label: 'Parler à un prêtre', href: conversationsHref() }, { label: 'Prêtres joignables' }]} />}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">Prêtres joignables</h1>
          <p className="m-0 mt-2 flex flex-wrap items-center gap-x-1.5 text-16 text-ink-2">
            <Icon name="pin" size={18} className="shrink-0 text-ink-3" />
            <span>
              {parish ? parishLabel(parish.name) : 'Aucune paroisse suivie'}
              {count !== undefined && ` · ${count} prêtre${count > 1 ? 's' : ''}`}
            </span>
            <NextLink href={`${paths.app.profil.getHref()}#paroisse`} className="ml-2 inline-flex min-h-11 items-center text-15 font-medium no-underline hover:underline">
              {parish ? 'Changer' : 'Choisir ma paroisse'}
            </NextLink>
          </p>
        </div>
        <PretresTabs current="pretres" className="w-full sm:w-80" />
      </div>

      <ConfessionNotice className="mt-6 lg:mt-8" bookingHref={paths.app.confession.getHref()} />

      <div className="mt-6">
        <PriestList conversationHrefOf={conversationHrefOf} />
      </div>

      <div className="mt-8">
        <NextConfessionCard nodeId={parish?.id ?? null} />
      </div>

      <MessagingPrivacyNote className="mt-6" />
    </>
  );
};

const PretresContent = () => {
  const params = useSearchParams();
  return params.get('vue') === CONVERSATIONS_VIEW ? <FideleConversations activeId={null} /> : <PriestsView />;
};

// Parler à un prêtre : prêtres joignables, ou la liste des conversations (`?vue=conversations`).
const PretresPage = () => (
  <Suspense>
    <PretresContent />
  </Suspense>
);

export default PretresPage;
