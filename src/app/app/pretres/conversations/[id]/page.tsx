import { FideleConversations } from '../../_components/fidele-conversations';

type Props = { params: Promise<{ id: string }> };

// Conversation avec un prêtre (FID-Conversation, MOB-Conversation).
const ConversationPage = async ({ params }: Props) => {
  const { id } = await params;
  return <FideleConversations activeId={decodeURIComponent(id)} />;
};

export default ConversationPage;
