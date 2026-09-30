'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { ConfessionNotice } from '@/components/signature/confession-notice';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';

import { useConversation } from '../api/get-conversation';
import { useMessages } from '../api/get-messages';
import { usePresence } from '../api/get-presence';
import { useMarkRead } from '../api/mark-read';
import { useMessagingCgu } from '../api/messaging-cgu';
import { useSendMessage } from '../api/send-message';
import { useConversationSocket } from '../hooks/use-conversation-socket';
import { libellePresence } from '../utils/format-presence';
import { otherParticipant } from '../utils/participants';

import { CguGate } from './cgu-gate';
import { Composer, type QuickReply } from './composer';
import { ConnectionStatus } from './connection-status';
import { MessageLog } from './message-log';
import { MessagingRefusal } from './messaging-refusal';
import { PresenceTexte } from './presence';

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
  /** Avant l'avatar (retour à la liste sur mobile). */
  leading?: ReactNode;
  /** Réponses toutes prêtes insérées dans la saisie (côté prêtre). */
  quickReplies?: QuickReply[];
  /** Fidèle (défaut) ou prêtre : textes et marges du bandeau confession. */
  audience?: 'fidele' | 'pretre';
  headingLevel?: 'h1' | 'h2';
};

/** « Messages chiffrés · aucun administrateur n'y a accès » (jamais « de bout en bout », ADR-014). */
const EncryptionLine = () => (
  <span className="flex items-center gap-1.5 text-13 text-ink-2">
    <Icon name="cadenas" size={14} className="shrink-0" />
    <span className="truncate">Messages chiffrés · aucun administrateur n’y a accès</span>
  </span>
);

const ThreadBody = ({
  conversationId,
  meId,
  peerName,
  quickReplies,
}: {
  conversationId: string;
  meId?: string;
  peerName: string;
  quickReplies?: QuickReply[];
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
        <div className="min-h-0 flex-1 p-6">
          <LoadingBlock label="Chargement des messages…" />
        </div>
      ) : messages.isError ? (
        <div className="min-h-0 flex-1 p-4">
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
        <div className="shrink-0 px-4 pb-2 lg:px-8" aria-live="assertive">
          <MessagingRefusal error={send.error} />
        </div>
      )}
      <Composer
        peerName={peerName}
        pending={send.isPending}
        onSend={(content) => send.mutateAsync(content)}
        onTyping={onTyping}
        quickReplies={quickReplies}
      />
    </>
  );
};

/**
 * Fil d'une conversation (FID-Conversation, PAR-Messagerie) : en-tête de 72 px, bandeau
 * confession épinglé, messages, saisie. Pas de chiffrement de bout en bout côté client
 * (ADR-014 reporté) : la mention dit ce qui est vrai.
 */
export const ConversationThread = ({
  conversationId,
  notice,
  actions,
  leading,
  quickReplies,
  audience = 'fidele',
  headingLevel = 'h2',
}: ConversationThreadProps) => {
  const me = useMe();
  const conversation = useConversation(conversationId);
  const Heading = headingLevel;
  const peer = conversation.data ? otherParticipant(conversation.data, me.data?.id) : null;
  const peerName = peer?.full_name ?? 'votre correspondant';
  // Présence de l'interlocuteur (décisions V2) : état initial par GET, puis les `presence.changed`
  // de la socket ws/notifications/ unique de l'onglet (RealtimeBridge du shell, qui porte aussi le
  // battement presence.ping).
  const presences = usePresence(peer ? [peer.id] : []);

  return (
    <section aria-labelledby="conversation-titre" className="flex h-full min-h-0 min-w-0 flex-col bg-paper">
      <header
        className={cn(
          'flex min-h-18 shrink-0 items-center justify-between gap-4 border-b border-line py-3 pl-4 pr-4 lg:pr-6',
          audience === 'fidele' ? 'lg:pl-8' : 'lg:pl-6',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          {peer && <Avatar name={peer.full_name} size={40} className="text-14" />}
          <div className="flex min-w-0 flex-col">
            <Heading id="conversation-titre" className="m-0 truncate text-16 font-semibold text-ink">
              {peer ? peer.full_name : 'Conversation'}
            </Heading>
            <PresenceTexte libelle={libellePresence(peer ? presences[peer.id] : undefined)} />
            <EncryptionLine />
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <ConfessionNotice variant="pinned" audience={audience} {...notice} className="shrink-0" />
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
        <ThreadBody conversationId={conversationId} meId={me.data?.id} peerName={peerName} quickReplies={quickReplies} />
      )}
    </section>
  );
};
