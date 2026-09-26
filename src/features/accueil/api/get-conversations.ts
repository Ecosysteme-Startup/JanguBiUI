import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `messagerie` : l'accueil montre la dernière conversation.
const participantSchema = z.object({ id: z.string(), full_name: z.string() });

const conversationSchema = z.object({
  id: z.string(),
  participant_a: participantSchema,
  participant_b: participantSchema,
  last_message: z.object({ content: z.string().nullable(), sent_at: z.string() }).nullable(),
  last_message_at: z.string().nullable().optional(),
  is_archived: z.boolean().optional().default(false),
  unread_count: z.number().default(0),
});
export type HomeConversation = z.infer<typeof conversationSchema>;

export const getConversations = async () => z.array(conversationSchema).parse(await api.get('/messaging/conversations/'));

export const conversationsQueryOptions = () => queryOptions({ queryKey: ['accueil', 'conversations'], queryFn: getConversations });

export const useConversations = () => useQuery(conversationsQueryOptions());
