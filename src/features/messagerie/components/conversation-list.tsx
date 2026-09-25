import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';
import { dayjs, dotDate, hour } from '@/utils/dates';

import type { Conversation } from '../api/schemas';
import { otherParticipant, previewOf } from '../utils/participants';

const whenOf = (iso: string | null | undefined) => {
  if (!iso) return '';
  return dayjs(iso).isSame(dayjs(), 'day') ? hour(iso) : dotDate(iso);
};

const rowClass = (active: boolean) =>
  cn(
    'grid min-h-11 w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-2 py-3 text-left text-ink hover:bg-surface hover:no-underline',
    active && 'bg-tint-50',
  );

const RowContent = ({
  conversation,
  meId,
}: {
  conversation: Conversation;
  meId: string | undefined;
}) => {
  const peer = otherParticipant(conversation, meId);
  const unread = conversation.unread_count > 0;
  return (
    <>
      <Avatar name={peer.full_name} size={40} />
      <span className="min-w-0">
        <span
          className={cn(
            'block text-base',
            unread ? 'font-semibold' : 'font-medium',
          )}
        >
          {peer.full_name}
        </span>
        <span
          className={cn(
            'block truncate text-sm',
            unread ? 'text-ink' : 'text-ink-2',
          )}
        >
          {previewOf(conversation)}
        </span>
      </span>
      <span className="tnum flex flex-col items-end gap-1 text-meta">
        <span className={unread ? 'text-primary' : 'text-ink-3'}>
          {whenOf(conversation.last_message_at)}
        </span>
        {unread && (
          <span className="text-primary">
            {conversation.unread_count}{' '}
            {conversation.unread_count > 1 ? 'nouveaux' : 'nouveau'}
          </span>
        )}
      </span>
    </>
  );
};

type ConversationListProps = {
  conversations: Conversation[];
  meId: string | undefined;
  /** Liens (espace fidèle) ou sélection sur place (boîte du prêtre). */
  hrefOf?: (id: string) => string;
  onSelect?: (id: string) => void;
  activeId?: string | null;
  label: string;
};

/** Lignes de conversation : interlocuteur, aperçu, heure, non-lus (FID-Pretres, PAR-Messagerie). */
export const ConversationList = ({
  conversations,
  meId,
  hrefOf,
  onSelect,
  activeId,
  label,
}: ConversationListProps) => (
  <ul aria-label={label} className="m-0 list-none p-0">
    {conversations.map((conversation) => {
      const active = conversation.id === activeId;
      const current = active ? 'true' : undefined;
      return (
        <li key={conversation.id}>
          {hrefOf ? (
            <NextLink
              href={hrefOf(conversation.id)}
              aria-current={current}
              className={rowClass(active)}
            >
              <RowContent conversation={conversation} meId={meId} />
            </NextLink>
          ) : (
            <button
              type="button"
              onClick={() => onSelect?.(conversation.id)}
              aria-current={current}
              className={rowClass(active)}
            >
              <RowContent conversation={conversation} meId={meId} />
            </button>
          )}
        </li>
      );
    })}
  </ul>
);
