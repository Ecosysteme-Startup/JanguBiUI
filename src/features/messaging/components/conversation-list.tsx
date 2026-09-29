'use client';

import { MessageCircle, Search, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isFidele } from '@/lib/authorization';
import { useReglagePresence } from '@/lib/personnalisation/presence';
import { useMessagingStore } from '@/stores/messaging-store';

import { useConversations } from '../api/get-conversations';
import { usePresence } from '../api/get-presence';
import type { Conversation } from '../types';
import { libellePresence } from '../utils/format-presence';

import { PastilleAvatar, PresenceTexte } from './presence';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  if (diffDays === 1) return 'hier';
  if (diffDays < 7)
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const getOther = (conv: Conversation, currentUserId: string) =>
  conv.participant_a.id === currentUserId
    ? conv.participant_b
    : conv.participant_a;

function getParticipantName(conv: Conversation, currentUserId: string): string {
  const other = getOther(conv, currentUserId);
  return other.full_name?.trim() || other.email;
}

/**
 * Pied de liste : mon propre réglage de présence, et pour le staff la légende
 * (maquettes WEB-FID-Conversation-Presence, WEB-PAR-Messagerie-Presence).
 */
function NotePresence({ fidele }: { fidele: boolean }) {
  const { data } = useReglagePresence();
  if (!data) return null;
  const lien = (
    <Link
      href={`${paths.app.profil.getHref()}#personnalisation`}
      className="font-medium text-primary hover:underline"
    >
      Modifier
    </Link>
  );
  if (fidele) {
    return (
      <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">
        {data.effective
          ? 'Votre présence est affichée aux prêtres. '
          : "Votre présence n'est pas affichée aux prêtres. "}
        {lien}
      </p>
    );
  }
  return (
    <div className="space-y-1 px-4 py-3 text-xs leading-5 text-muted-foreground">
      <p>
        {data.effective
          ? 'Vous apparaissez en ligne · '
          : "Vous n'apparaissez pas en ligne · "}
        {lien}
      </p>
      <p>
        «&nbsp;En ligne&nbsp;» et «&nbsp;Vu à&nbsp;» n&apos;apparaissent que
        pour les fidèles qui l&apos;ont activé, et seulement dans vos
        conversations avec eux.
      </p>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function ConversationsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useConversations(
    search.trim() || undefined,
  );
  const { data: user } = useUser();
  const setTotalUnread = useMessagingStore((s) => s.setTotalUnread);

  useEffect(() => {
    if (!data) return;
    const total = data.results.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0,
    );
    setTotalUnread(total);
  }, [data, setTotalUnread]);

  const currentUserId = user?.id ?? '';
  const presences = usePresence(
    currentUserId
      ? (data?.results ?? []).map((c) => getOther(c, currentUserId).id)
      : [],
  );

  return (
    <div className="flex flex-col">
      {/* En-tête custom (vue messagerie exemptée du shell header — plein écran).
          Pas de cloche ici : la cloche flottante (routes !meta) la sert déjà. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background-surface/90 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 pr-12 md:pr-0">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl font-bold tracking-tight text-foreground">
              Messages
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              Vos conversations
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Nouvelle conversation"
          >
            <Link href="/app/messages/new">
              <SquarePen className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="sticky top-[57px] z-10 border-b border-border bg-background px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher une conversation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading && <ConversationsSkeleton />}
      {isError && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Impossible de charger vos messages.
        </p>
      )}
      {!isLoading && !isError && !data?.results.length && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageCircle className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucune conversation pour le moment.
          </p>
        </div>
      )}
      {!isLoading && !isError && !!data?.results.length && (
        <div className="flex flex-col divide-y divide-border">
          {data.results.map((conv) => {
            const participantName = getParticipantName(conv, currentUserId);
            const hasActivity =
              conv.last_message_at != null || conv.unread_count > 0;
            const lastContent =
              conv.last_message?.content ??
              (hasActivity ? '...' : 'Aucun message');
            const lastAt = conv.last_message?.sent_at ?? conv.last_message_at;
            const presence = libellePresence(
              presences[getOther(conv, currentUserId).id],
            );

            return (
              <Link
                key={conv.id}
                href={`/app/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted/70"
              >
                <span className="relative shrink-0">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                      {getInitials(participantName)}
                    </AvatarFallback>
                  </Avatar>
                  <PastilleAvatar enLigne={presence?.etat === 'en_ligne'} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold text-foreground">
                      {participantName}
                    </p>
                    <span
                      suppressHydrationWarning
                      className="shrink-0 text-[11px] text-muted-foreground"
                    >
                      {formatTime(lastAt)}
                    </span>
                  </div>
                  <PresenceTexte libelle={presence} className="mt-0.5" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-muted-foreground">
                      {lastContent}
                    </p>
                    {!!conv.unread_count && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {!!user && <NotePresence fidele={isFidele(user)} />}
    </div>
  );
}
