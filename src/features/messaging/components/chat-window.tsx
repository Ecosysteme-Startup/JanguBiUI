'use client';

import {
  ArrowLeft,
  ArrowDown,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Paperclip,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';

import { useAcceptMessagingCgu, useMessagingCgu } from '../api/cgu';
import { useGetMessages } from '../api/get-messages';
import { usePresence } from '../api/get-presence';
import { useMarkRead } from '../api/mark-read';
import {
  OPTIMISTIC_ID_PREFIX,
  useSendMessage,
  withClientId,
} from '../api/send-message';
import { useChatSocket } from '../hooks/use-chat-socket';
import type { Message } from '../types';
import { libellePresence } from '../utils/format-presence';

import { ConnectionBanner } from './connection-banner';
import { PastilleAvatar, PresenceTexte } from './presence';

/** Tolérance (px) pour considérer que l'utilisateur est « collé en bas ». */
const SCROLL_BOTTOM_THRESHOLD = 80;

const LONG_MESSAGE_THRESHOLD = 200;
const GROUP_TIME_GAP_MS = 3 * 60 * 1000; // 3 minutes

interface ChatWindowProps {
  conversationId: string;
  participantName?: string;
  /** Identifiant de l'interlocuteur, pour sa présence. */
  participantId?: string;
}

type MessagePosition = 'alone' | 'first' | 'middle' | 'last';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function isSameGroup(previous: Message, current: Message): boolean {
  if (previous.is_mine !== current.is_mine) return false;
  if (!previous.is_mine && previous.sender_id !== current.sender_id)
    return false;
  const timeDiff =
    new Date(current.created_at).getTime() -
    new Date(previous.created_at).getTime();
  return timeDiff < GROUP_TIME_GAP_MS;
}

function getMessagePosition(
  messages: Message[],
  index: number,
): MessagePosition {
  const previous = messages[index - 1];
  const current = messages[index];
  const next = messages[index + 1];

  const connectedToPrev = previous ? isSameGroup(previous, current) : false;
  const connectedToNext = next ? isSameGroup(current, next) : false;

  if (!connectedToPrev && !connectedToNext) return 'alone';
  if (!connectedToPrev && connectedToNext) return 'first';
  if (connectedToPrev && connectedToNext) return 'middle';
  return 'last';
}

function getBubbleRadius(isMine: boolean, position: MessagePosition): string {
  if (isMine) {
    switch (position) {
      case 'alone':
        return 'rounded-2xl rounded-br-sm';
      case 'first':
        return 'rounded-2xl rounded-br-sm';
      case 'middle':
        return 'rounded-l-2xl rounded-r-lg';
      case 'last':
        return 'rounded-l-2xl rounded-b-2xl rounded-tr-lg';
    }
  } else {
    switch (position) {
      case 'alone':
        return 'rounded-2xl rounded-bl-sm';
      case 'first':
        return 'rounded-2xl rounded-bl-sm';
      case 'middle':
        return 'rounded-r-2xl rounded-l-lg';
      case 'last':
        return 'rounded-r-2xl rounded-b-2xl rounded-tl-lg';
    }
  }
}

function getVerticalGap(position: MessagePosition): string {
  return position === 'alone' || position === 'last' ? 'mt-3' : 'mt-0.5';
}

function isOptimistic(message: Message): boolean {
  return message.id.startsWith(OPTIMISTIC_ID_PREFIX);
}

// ── ReadReceipt ───────────────────────────────────────────────────────────────

/**
 * Indicateur d'accusé de lecture sur les messages sortants.
 * - en cours d'envoi (optimiste) → simple coche atténuée + libellé masqué
 * - envoyé non lu → simple coche
 * - lu → double coche
 * Le `title`/`aria-label` porte le sens (jamais la couleur/forme seule).
 */
function ReadReceipt({ message }: { message: Message }) {
  if (isOptimistic(message)) {
    return (
      <Check
        className="size-3 opacity-50"
        aria-label="Envoi en cours"
        role="img"
      />
    );
  }
  if (message.read_at) {
    return <CheckCheck className="size-3" aria-label="Lu" role="img" />;
  }
  return <Check className="size-3" aria-label="Envoyé" role="img" />;
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  position: MessagePosition;
  participantInitials: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function MessageBubble({
  message,
  position,
  participantInitials,
  isExpanded,
  onToggleExpand,
}: MessageBubbleProps) {
  const isLast = position === 'alone' || position === 'last';
  const showAvatar = !message.is_mine;
  const isLong = message.content.length > LONG_MESSAGE_THRESHOLD;

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        message.is_mine ? 'justify-end' : 'justify-start',
        getVerticalGap(position),
      )}
    >
      {/* Avatar placeholder — always reserve space for alignment */}
      {showAvatar && (
        <div className="size-7 shrink-0">
          {isLast && (
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] md:max-w-[60%] px-3.5 py-2.5 text-sm shadow-sm',
          getBubbleRadius(message.is_mine, position),
          message.is_mine
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-foreground',
        )}
      >
        {/* Message content */}
        <p
          className={cn(
            'leading-relaxed whitespace-pre-wrap break-words',
            isLong && !isExpanded && 'line-clamp-4',
          )}
        >
          {message.is_deleted ? 'Message supprimé' : message.content}
        </p>

        {/* Pièces jointes reçues (l'envoi n'a pas encore de route backend). */}
        {message.attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {message.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs underline underline-offset-2"
                >
                  <Paperclip className="size-3.5 shrink-0" />
                  {a.file_name}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Expand / collapse for long messages */}
        {isLong && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              'mt-1 flex items-center gap-1 rounded text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              message.is_mine
                ? 'text-primary-foreground/70 hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                Voir plus
              </>
            )}
          </button>
        )}

        {/* Timestamp + accusé de lecture — only on last message of group */}
        {isLast && (
          <div
            className={cn(
              'mt-1 flex items-center justify-end gap-1 text-[10px]',
              message.is_mine
                ? 'text-primary-foreground/60'
                : 'text-muted-foreground',
            )}
          >
            <span suppressHydrationWarning>
              {formatTime(message.created_at)}
            </span>
            {message.is_mine && <ReadReceipt message={message} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ChatWindow ────────────────────────────────────────────────────────────────

export function ChatWindow({
  conversationId,
  participantName,
  participantId,
}: ChatWindowProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const hasScrolledOnceRef = useRef(false);

  const { data, isLoading } = useGetMessages(conversationId);
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { mutate: markRead } = useMarkRead(conversationId);
  const cgu = useMessagingCgu();
  const accepterCgu = useAcceptMessagingCgu();
  const { status: socketStatus } = useChatSocket(conversationId);
  const presences = usePresence(participantId ? [participantId] : []);
  const presence = libellePresence(
    participantId ? presences[participantId] : undefined,
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setShowNewMessagePill(false);
  }, []);

  // Suit la position de l'utilisateur : « collé en bas » ou non.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    if (atBottom) setShowNewMessagePill(false);
  }, []);

  useEffect(() => {
    markRead();
  }, [conversationId, markRead]);

  const messageCount = data?.results.length ?? 0;

  useEffect(() => {
    if (messageCount === 0) return;
    // Premier rendu : scroll instantané jusqu'en bas.
    if (!hasScrolledOnceRef.current) {
      hasScrolledOnceRef.current = true;
      scrollToBottom('auto');
      return;
    }
    // Nouveaux messages : on reste collé en bas si l'utilisateur y est,
    // sinon on propose une pastille « Nouveau message ↓ ».
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowNewMessagePill(true);
    }
  }, [messageCount, scrollToBottom]);

  // Réinitialise l'état de scroll quand on change de conversation.
  useEffect(() => {
    hasScrolledOnceRef.current = false;
    isAtBottomRef.current = true;
    setShowNewMessagePill(false);
  }, [conversationId]);

  function toggleMessageExpansion(messageId: string) {
    setExpandedMessages((previous) => {
      const updated = new Set(previous);
      if (updated.has(messageId)) {
        updated.delete(messageId);
      } else {
        updated.add(messageId);
      }
      return updated;
    });
  }

  function doSend() {
    const content = text.trim();
    if (!content || isPending) return;
    setText('');
    send(withClientId({ content }));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  const participantInitials = getInitials(participantName ?? '?');
  const messages = data?.results ?? [];

  return (
    <div className="flex h-dvh flex-col md:h-full">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="-ml-2 rounded-full hover:bg-muted md:hidden"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="relative shrink-0">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {participantInitials}
            </AvatarFallback>
          </Avatar>
          <PastilleAvatar enLigne={presence?.etat === 'en_ligne'} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-semibold text-foreground">
              {participantName ?? 'Conversation'}
            </span>
            <PresenceTexte libelle={presence} className="shrink-0" />
          </span>
        </div>
      </div>

      {/* Bannière d'état temps réel */}
      <ConnectionBanner status={socketStatus} />

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Fil de la conversation"
          aria-relevant="additions"
          className="h-full overflow-y-auto p-4"
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none" />
            </div>
          )}
          {!isLoading && !messages.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Commencez la conversation…
            </p>
          )}
          <div className="flex flex-col">
            {messages.map((message, index) => {
              const position = getMessagePosition(messages, index);
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  position={position}
                  participantInitials={participantInitials}
                  isExpanded={expandedMessages.has(message.id)}
                  onToggleExpand={() => toggleMessageExpansion(message.id)}
                />
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Pastille « Nouveau message ↓ » — n'interrompt pas la lecture */}
        {showNewMessagePill && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            Nouveau message
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Input */}
      {cgu.data && !cgu.data.accepted && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Pour écrire, acceptez les conditions de la messagerie : elle ne
          remplace pas la confession.
          <Button
            size="sm"
            variant="outline"
            isLoading={accepterCgu.isPending}
            onClick={() => accepterCgu.mutate()}
          >
            J’accepte
          </Button>
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-border bg-background px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
          placeholder="Votre message…"
          aria-label="Votre message"
          rows={1}
          className="max-h-[120px] min-h-11 flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || isPending}
          isLoading={isPending}
          icon={<Send className="size-4" />}
          className="shrink-0 rounded-full disabled:opacity-40"
          aria-label="Envoyer"
        />
      </form>
    </div>
  );
}
