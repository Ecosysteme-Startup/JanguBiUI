'use client';

import NextLink from 'next/link';

import { ShellLayout } from '@/components/layouts/shell-slots';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { NextBookingCard } from '@/features/confession/components/next-booking-card';
import { useConversations } from '@/features/messagerie/api/get-conversations';
import { ConversationList } from '@/features/messagerie/components/conversation-list';
import { ConversationThread } from '@/features/messagerie/components/conversation-thread';
import { MessagingPrivacyNote } from '@/features/messagerie/components/messaging-privacy-note';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';

import { conversationsHref, PretresTabs } from './pretres-tabs';


/** Colonne « Parler à un prêtre » : titre, bascule, prochain rendez-vous, conversations. */
const ConversationsColumn = ({ activeId }: { activeId: string | null }) => {
  const me = useMe();
  const conversations = useConversations();
  const list = (conversations.data ?? []).filter((c) => !c.is_archived);

  return (
    <section aria-labelledby="liste-titre" className="flex min-h-0 min-w-0 flex-1 flex-col border-line bg-paper lg:border-r">
      <div className="px-4 pb-4 pt-6 lg:px-5">
        <div className="flex items-center justify-between">
          <h1 id="liste-titre" className="m-0 text-24 font-semibold text-ink">
            Parler à un prêtre
          </h1>
          <NextLink href={paths.app.pretres.list.getHref()} aria-label="Nouvelle conversation" className={iconButtonClasses()}>
            <Icon name="crayon" size={20} />
          </NextLink>
        </div>
        <PretresTabs current="conversations" size="xs" className="mt-4" />
      </div>
      <div className="px-4 pb-2 lg:px-5">
        <NextBookingCard />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2 lg:px-3">
        {conversations.isPending ? (
          <LoadingBlock label="Chargement de vos conversations…" />
        ) : conversations.isError ? (
          <p role="alert" className="m-0 p-3 text-14 text-err">
            Vos conversations n’ont pas pu être chargées. Rechargez la page.
          </p>
        ) : list.length === 0 ? (
          <p className="m-0 p-3 text-15 text-ink-2">
            Aucune conversation pour l’instant.{' '}
            <NextLink href={paths.app.pretres.list.getHref()}>Écrivez à un prêtre</NextLink> pour en commencer une.
          </p>
        ) : (
          <ConversationList
            conversations={list}
            meId={me.data?.id}
            hrefOf={(id) => paths.app.pretres.conversation.getHref(id)}
            activeId={activeId}
            label="Mes conversations"
          />
        )}
      </div>
      <MessagingPrivacyNote className="border-t border-line px-4 pb-5 pt-4 lg:px-5" />
    </section>
  );
};

/**
 * Parler à un prêtre, vue conversations (FID-Conversation) : la liste à gauche, le fil à droite.
 * Sous lg, une seule colonne : la liste, ou le fil avec un retour à la liste.
 */
export const FideleConversations = ({ activeId }: { activeId: string | null }) => (
  <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
    <ShellLayout fullBleed hideTopbar />
    <div className={cn('min-h-0', activeId ? 'hidden lg:flex' : 'flex', 'flex-col')}>
      <ConversationsColumn activeId={activeId} />
    </div>
    <div className={cn('min-h-0 min-w-0', activeId ? 'flex' : 'hidden lg:flex', 'flex-col')}>
      {activeId ? (
        <ConversationThread
          key={activeId}
          conversationId={activeId}
          notice={{ bookingHref: paths.app.confession.getHref() }}
          leading={
            <NextLink href={conversationsHref()} aria-label="Retour aux conversations" className={cn(iconButtonClasses(), 'lg:hidden')}>
              <Icon name="fleche-gauche" size={20} />
            </NextLink>
          }
        />
      ) : (
        <EmptyState icon="message" title="Choisissez une conversation" className="m-auto">
          Vos échanges avec les prêtres s’affichent ici. Personne d’autre ne les lit.
        </EmptyState>
      )}
    </div>
  </div>
);
