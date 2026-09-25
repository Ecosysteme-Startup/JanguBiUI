import type { Conversation, Participant } from '../api/schemas';

/** L'interlocuteur : le participant qui n'est pas l'utilisateur courant. */
export const otherParticipant = (
  conversation: Conversation,
  meId: string | undefined,
): Participant =>
  conversation.participant_a.id === meId
    ? conversation.participant_b
    : conversation.participant_a;

/** Aperçu de la ligne de liste, préfixé « Vous : » quand le dernier message est le sien. */
export const previewOf = (conversation: Conversation, meId?: string): string => {
  const last = conversation.last_message;
  if (!last) return 'Aucun message pour l’instant';
  const text = last.content ?? 'Message supprimé';
  return meId && last.sender_id === meId ? `Vous : ${text}` : text;
};
