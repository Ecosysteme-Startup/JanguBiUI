import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { conversationSchema, type Conversation } from './schemas';

export const getConversations = async (
  search?: string,
): Promise<Conversation[]> =>
  z
    .array(conversationSchema)
    .parse(await api.get('/messaging/conversations/', { params: { search } }));

export const conversationsQueryOptions = (search = '') =>
  queryOptions({
    queryKey: ['messagerie', 'conversations', search],
    queryFn: () => getConversations(search || undefined),
    placeholderData: keepPreviousData,
  });

export const useConversations = (search = '') =>
  useQuery(conversationsQueryOptions(search));
