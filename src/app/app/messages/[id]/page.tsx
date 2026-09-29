'use client';

import { use } from 'react';

import { useGetConversation } from '@/features/messaging/api/get-conversation';
import { ChatWindow } from '@/features/messaging/components/chat-window';
import { useUser } from '@/lib/auth';

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { id } = use(params);
  const { data: user } = useUser();
  const { data: conversation } = useGetConversation(id);

  const other =
    conversation && user
      ? conversation.participant_a.id === user.id
        ? conversation.participant_b
        : conversation.participant_a
      : undefined;
  const participantName = other
    ? other.full_name?.trim() || other.email
    : undefined;

  return (
    <ChatWindow
      conversationId={id}
      participantName={participantName}
      participantId={other?.id}
    />
  );
}
