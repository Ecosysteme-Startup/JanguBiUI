import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { conversationSchema, type Conversation } from './schemas';

export const getConversation = async (id: string): Promise<Conversation> =>
  conversationSchema.parse(
    await api.get(`/messaging/conversations/${encodeURIComponent(id)}/`),
  );

export const conversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['messagerie', 'conversation', id],
    queryFn: () => getConversation(id),
  });

export const useConversation = (id: string) =>
  useQuery(conversationQueryOptions(id));
