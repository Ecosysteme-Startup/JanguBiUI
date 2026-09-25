'use client';

import NextLink from 'next/link';

import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { useConversations } from '../api/get-conversations';

import { ConversationList } from './conversation-list';

/** Colonne contexte de FID-Conversation : les autres échanges du fidèle. */
export const OtherConversations = ({ currentId }: { currentId: string }) => {
  const me = useMe();
  const conversations = useConversations();
  const others = (conversations.data ?? [])
    .filter((c) => c.id !== currentId && !c.is_archived)
    .slice(0, 4);
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="autres-conversations">
      <SectionHeading
        id="autres-conversations"
        title="Autres conversations"
        aside={
          <NextLink href={paths.app.pretres.list.getHref()}>Tout voir</NextLink>
        }
      />
      <ConversationList
        conversations={others}
        meId={me.data?.id}
        hrefOf={(id) => paths.app.pretres.conversation.getHref(id)}
        label="Autres conversations"
      />
    </section>
  );
};
