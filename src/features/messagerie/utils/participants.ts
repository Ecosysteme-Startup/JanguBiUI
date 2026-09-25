import type { Conversation, Participant } from '../api/schemas';

/** L'interlocuteur : le participant qui n'est pas l'utilisateur courant. */
export const otherParticipant = (
  conversation: Conversation,
  meId: string | undefined,
): Participant =>
  conversation.participant_a.id === meId
    ? conversation.participant_b
    : conversation.participant_a;

/**
 * Aperçu de la ligne de liste. `last_message` ne porte pas son expéditeur (écart backend) :
 * pas de préfixe « Vous : » tant que l'information n'est pas fiable.
 */
export const previewOf = (conversation: Conversation): string => {
  const last = conversation.last_message;
  if (!last) return 'Aucun message pour l’instant';
  return last.content ?? 'Message supprimé';
};
