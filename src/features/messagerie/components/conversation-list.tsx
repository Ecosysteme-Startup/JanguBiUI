import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import type { Presence } from '@/stores/realtime-store';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { usePresence } from '../api/get-presence';
import type { Conversation } from '../api/schemas';
import { libellePresence } from '../utils/format-presence';
import { otherParticipant, previewOf } from '../utils/participants';

import { PastilleAvatar, PresenceTexte } from './presence';

/** « 10:13 » aujourd'hui, « hier », puis « 2 août ». */
export const whenOf = (iso: string | null | undefined, now = dayjs()) => {
  if (!iso) return '';
  const d = dayjs(iso);
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'hier';
  return d.format('D MMM');
};

const rowClass = (active: boolean) =>
  cn(
    'flex w-full items-start gap-3 rounded-12 p-3 text-left text-ink transition-colors hover:text-ink hover:no-underline',
    active ? 'bg-tint-50' : 'hover:bg-surface',
  );

const RowContent = ({
  conversation,
  meId,
  late,
  presence,
}: {
  conversation: Conversation;
  meId: string | undefined;
  late: boolean;
  presence?: Presence;
}) => {
  const peer = otherParticipant(conversation, meId);
  const unread = conversation.unread_count > 0;
  const libelle = libellePresence(presence);
  return (
    <>
      <span className="relative shrink-0">
        <Avatar name={peer.full_name} size={40} className="text-14" />
        <PastilleAvatar enLigne={libelle?.etat === 'en_ligne'} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-15 font-semibold">{peer.full_name}</span>
          <span className={cn('tnum shrink-0 text-13', late ? 'font-semibold text-warn' : 'text-ink-3', unread && !late && 'font-semibold')}>
            {whenOf(conversation.last_message_at ?? conversation.last_message?.sent_at)}
          </span>
          {unread && (
            <span className="size-2 shrink-0 rounded-full bg-primary-fill">
              <span className="sr-only">
                {conversation.unread_count} message{conversation.unread_count > 1 ? 's' : ''} non lu{conversation.unread_count > 1 ? 's' : ''}
              </span>
            </span>
          )}
        </span>
        <PresenceTexte libelle={libelle} />
        <span className="line-clamp-2 text-14 text-ink-2">{previewOf(conversation, meId)}</span>
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
  /** Conversation en attente depuis longtemps (heure en ambre, PAR-Messagerie). */
  isLate?: (conversation: Conversation) => boolean;
  label: string;
};

/** Lignes de conversation : interlocuteur, heure, non-lu, aperçu sur deux lignes (FID-Conversation, PAR-Messagerie). */
export const ConversationList = ({ conversations, meId, hrefOf, onSelect, activeId, isLate, label }: ConversationListProps) => {
  // Présence des interlocuteurs (« En ligne », « Vu hier à 21:05 ») ; rien si elle est masquée.
  const presences = usePresence(conversations.map((c) => otherParticipant(c, meId).id));
  return (
  <ul aria-label={label} className="m-0 flex list-none flex-col gap-0.5 p-0">
    {conversations.map((conversation) => {
      const active = conversation.id === activeId;
      const current = active ? 'true' : undefined;
      const content = (
        <RowContent
          conversation={conversation}
          meId={meId}
          late={isLate?.(conversation) ?? false}
          presence={presences[otherParticipant(conversation, meId).id]}
        />
      );
      return (
        <li key={conversation.id}>
          {hrefOf ? (
            <NextLink href={hrefOf(conversation.id)} aria-current={current} className={rowClass(active)}>
              {content}
            </NextLink>
          ) : (
            <button type="button" onClick={() => onSelect?.(conversation.id)} aria-current={current} className={rowClass(active)}>
              {content}
            </button>
          )}
        </li>
      );
    })}
  </ul>
  );
};
