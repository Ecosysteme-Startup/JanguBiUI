'use client';

import { Inbox, Mail, MailOpen } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pill } from '@/components/ui/pill';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

import { useClericalInbox } from '../api/get-clerical-inbox';
import type { ClergicalMessage } from '../api/get-clerical-inbox';

interface ClericalInboxListProps {
  onSelect: (message: ClergicalMessage) => void;
  selectedId?: number;
}

function MessageRow({
  message,
  isSelected,
  onClick,
}: {
  message: ClergicalMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isRead = !!message.read_at;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        'flex min-h-[68px] w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        isSelected && 'border-l-2 border-l-primary bg-primary/5',
      )}
    >
      <UserAvatar email={message.sender_email} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm text-foreground',
              !isRead && 'font-semibold',
            )}
          >
            {message.sender_email}
          </span>
          <RelativeTime
            iso={message.created_at}
            className="shrink-0 text-[11px] text-muted-foreground"
          />
        </div>
        <p
          className={cn(
            'truncate text-sm text-foreground',
            !isRead && 'font-medium',
          )}
        >
          {message.subject}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {message.body.slice(0, 80)}
        </p>
      </div>
      <div className="mt-0.5 shrink-0">
        {isRead ? (
          <Pill tone="muted" className="gap-1" aria-label="Message lu">
            <MailOpen className="size-3" aria-hidden="true" />
            Lu
          </Pill>
        ) : (
          <Pill tone="primary" className="gap-1" aria-label="Message non lu">
            <Mail className="size-3" aria-hidden="true" />
            Nouveau
          </Pill>
        )}
      </div>
    </button>
  );
}

export function ClericalInboxList({
  onSelect,
  selectedId,
}: ClericalInboxListProps) {
  const { data, isLoading, isError, refetch } = useClericalInbox();

  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState
          description="Impossible de charger les messages reçus."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const messages = data?.results ?? [];

  if (messages.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<Inbox aria-hidden="true" />}
          title="Aucun message reçu"
          description="Votre boîte de réception inter-clergé est vide."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {messages.map((msg) => (
        <li key={msg.id}>
          <MessageRow
            message={msg}
            isSelected={msg.id === selectedId}
            onClick={() => onSelect(msg)}
          />
        </li>
      ))}
    </ul>
  );
}
