import { dayjs } from '@/utils/dates';

import type { Conversation } from '../api/schemas';

export type Filter = 'sans_reponse' | 'toutes' | 'archivees';

export type InboxGroup = { key: string; title: string; hint?: string; conversations: Conversation[] };

/** Le dernier message vient du fidèle (à défaut d'expéditeur connu : il reste des non-lus). */
export const isUnanswered = (conversation: Conversation, meId: string | undefined): boolean => {
  const last = conversation.last_message;
  if (!last) return false;
  if (last.sender_id === undefined) return conversation.unread_count > 0;
  return last.sender_id !== meId;
};

const lastAt = (c: Conversation) => c.last_message_at ?? c.last_message?.sent_at ?? '';

/** Sans réponse depuis plus de 24 h : l'heure passe en ambre. */
export const isLate = (conversation: Conversation, meId: string | undefined, now: dayjs.ConfigType = dayjs()): boolean =>
  isUnanswered(conversation, meId) && dayjs(now).diff(dayjs(lastAt(conversation)), 'hour') >= 24;

const oldestFirst = (a: Conversation, b: Conversation) => lastAt(a).localeCompare(lastAt(b));
const newestFirst = (a: Conversation, b: Conversation) => lastAt(b).localeCompare(lastAt(a));

/** Groupes de la boîte du prêtre (PAR-Messagerie), sans groupe vide. */
export const filterConversations = (all: Conversation[], filter: Filter, meId: string | undefined): InboxGroup[] => {
  if (filter === 'archivees') {
    const archived = all.filter((c) => c.is_archived).sort(newestFirst);
    return archived.length ? [{ key: 'archivees', title: 'Archivées', conversations: archived }] : [];
  }
  const active = all.filter((c) => !c.is_archived);
  const unanswered = active.filter((c) => isUnanswered(c, meId)).sort(oldestFirst);
  const groups: InboxGroup[] = [
    { key: 'sans_reponse', title: 'Sans réponse', hint: 'Les plus anciennes d’abord', conversations: unanswered },
  ];
  if (filter === 'toutes') {
    const answered = active.filter((c) => !isUnanswered(c, meId)).sort(newestFirst);
    groups.push({ key: 'repondu', title: 'Répondu récemment', conversations: answered });
  }
  return groups.filter((g) => g.conversations.length > 0);
};
