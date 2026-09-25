import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { ConversationThread } from '@/features/messagerie/components/conversation-thread';
import { OtherConversations } from '@/features/messagerie/components/other-conversations';

type Props = { params: Promise<{ id: string }> };

// Conversation avec un prêtre (FID-Conversation, MOB-Conversation).
const ConversationPage = async ({ params }: Props) => {
  const { id } = await params;
  const conversationId = decodeURIComponent(id);
  return (
    <>
      <NextLink
        href={paths.app.pretres.list.getHref()}
        className="mb-4 inline-flex h-11 items-center gap-2 text-sm font-medium text-primary lg:mb-6"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Parler à un prêtre
      </NextLink>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 lg:col-span-8">
          <ConversationThread
            conversationId={conversationId}
            notice={{ bookingHref: paths.app.confession.getHref() }}
          />
        </div>
        <aside
          aria-label="Contexte de la conversation"
          className="hidden min-w-0 lg:col-span-4 lg:block"
        >
          <OtherConversations currentId={conversationId} />
        </aside>
      </div>
    </>
  );
};

export default ConversationPage;
