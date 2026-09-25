'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { ConfessionNotice } from '@/components/signature/confession-notice';
import { EncryptionBadge } from '@/components/signature/encryption-badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-me';

import { useConversation } from '../api/get-conversation';
import { useMessages } from '../api/get-messages';
import { useMarkRead } from '../api/mark-read';
import { useMessagingCgu } from '../api/messaging-cgu';
import { useSendMessage } from '../api/send-message';
import { useConversationSocket } from '../hooks/use-conversation-socket';
import { otherParticipant } from '../utils/participants';

import { CguGate } from './cgu-gate';
import { Composer } from './composer';
import { ConnectionStatus } from './connection-status';
import { MessageLog } from './message-log';
import { MessagingRefusal } from './messaging-refusal';

export type ConfessionNoticeProps = {
  bookingHref: string;
  description?: string;
  actionLabel?: string;
};

type ConversationThreadProps = {
  conversationId: string;
  /** Bandeau « pas de confession par message » : toujours rendu, quel que soit l'état du fil. */
  notice: ConfessionNoticeProps;
  actions?: ReactNode;
  headingLevel?: 'h1' | 'h2';
};

const ThreadBody = ({
  conversationId,
  meId,
  peerName,
}: {
  conversationId: string;
  meId?: string;
  peerName: string;
}) => {
  const cgu = useMessagingCgu();
  const accepted = cgu.data?.accepted === true;
  const socket = useConversationSocket(conversationId, {
    enabled: accepted,
    meId,
  });
  const messages = useMessages(conversationId, {
    enabled: accepted,
    poll: socket.status !== 'open',
  });
  const send = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const lastMarked = useRef<string | null>(null);
  const typingSent = useRef(false);

  // Accusé de lecture dès qu'un message de l'interlocuteur est affiché non lu.
  const unreadFromPeer =
    (messages.data ?? [])
      .filter((m) => m.sender_id !== meId && !m.read_at)
      .at(-1)?.id ?? null;
  useEffect(() => {
    if (!unreadFromPeer || lastMarked.current === unreadFromPeer) return;
    lastMarked.current = unreadFromPeer;
    markRead.mutate();
  }, [unreadFromPeer, markRead]);

  if (cgu.isPending)
    return (
      <div className="p-6">
        <LoadingBlock label="Chargement de la conversation…" />
      </div>
    );
  if (cgu.isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="La conversation n’a pas pu être chargée"
        className="m-4 border-0"
      >
        Vérifiez votre connexion puis rechargez la page.
      </EmptyState>
    );
  }
  if (!accepted) return <CguGate />;

  // « En train d'écrire » : une trame au changement d'état, pas à chaque frappe.
  const onTyping = (typing: boolean) => {
    if (typing === typingSent.current) return;
    typingSent.current = typing;
    socket.send({ type: typing ? 'typing.start' : 'typing.stop' });
  };

  return (
    <>
      <ConnectionStatus status={socket.status} onRetry={socket.retry} />
      {messages.isPending ? (
        <div className="flex-1 p-6">
          <LoadingBlock label="Chargement des messages…" />
        </div>
      ) : messages.isError ? (
        <div className="flex-1 p-4">
          <EmptyState
            tone="err"
            icon="alerte"
            title="Les messages n’ont pas pu être chargés"
          >
            Vérifiez votre connexion : le fil se rechargera automatiquement.
          </EmptyState>
        </div>
      ) : (
        <MessageLog
          messages={messages.data}
          meId={meId}
          peerName={peerName}
          peerTyping={socket.peerTyping}
        />
      )}
      {send.isError && (
        <div className="px-4 pb-2 lg:px-6" aria-live="assertive">
          <MessagingRefusal error={send.error} />
        </div>
      )}
      <Composer
        peerName={peerName}
        pending={send.isPending}
        onSend={(content) => send.mutateAsync(content)}
        onTyping={onTyping}
      />
    </>
  );
};

/**
 * Fil d'une conversation (FID-Conversation, MOB-Conversation, PAR-Messagerie). Pas de
 * chiffrement de bout en bout côté client (ADR-014 reporté) : le badge dit ce qui est vrai.
 */
export const ConversationThread = ({
  conversationId,
  notice,
  actions,
  headingLevel = 'h1',
}: ConversationThreadProps) => {
  const me = useMe();
  const conversation = useConversation(conversationId);
  const Heading = headingLevel;
  const peer = conversation.data
    ? otherParticipant(conversation.data, me.data?.id)
    : null;
  const peerName = peer?.full_name ?? 'votre correspondant';

  return (
    <section
      aria-labelledby="conversation-titre"
      className="flex min-h-[70dvh] min-w-0 flex-col overflow-hidden rounded border border-line bg-paper lg:h-[736px] lg:min-h-0"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {peer && <Avatar name={peer.full_name} size={48} />}
          <div className="min-w-0">
            <Heading
              id="conversation-titre"
              className="m-0 truncate font-serif text-h3 font-normal text-ink"
            >
              {peer ? peer.full_name : 'Conversation'}
            </Heading>
            <div className="mt-1 [&>p]:justify-start [&>p]:text-left">
              <EncryptionBadge correspondent={peer?.full_name} />
            </div>
          </div>
        </div>
        {actions}
      </header>
      <div className="px-4 pt-4 lg:px-6">
        <ConfessionNotice {...notice} />
      </div>
      {conversation.isError ? (
        <div className="p-4">
          <EmptyState tone="err" icon="alerte" title="Conversation introuvable">
            Elle a peut-être été supprimée, ou elle ne vous concerne pas.
          </EmptyState>
        </div>
      ) : conversation.isPending || me.isPending ? (
        <div className="p-6">
          <LoadingBlock label="Chargement de la conversation…" />
        </div>
      ) : (
        <ThreadBody
          conversationId={conversationId}
          meId={me.data?.id}
          peerName={peerName}
        />
      )}
    </section>
  );
};
