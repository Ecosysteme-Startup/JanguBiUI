'use client';

import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

import { useConversations } from '../api/get-conversations';

import { ConversationList } from './conversation-list';

/** « Mes conversations » de l'espace fidèle (FID-Pretres, section 02). */
export const MyConversations = ({ number = '02' }: { number?: string }) => {
  const me = useMe();
  const conversations = useConversations();
  const list = (conversations.data ?? []).filter((c) => !c.is_archived);
  const unread = list.filter((c) => c.unread_count > 0).length;

  return (
    <section aria-labelledby="mes-conversations">
      <SectionHeading
        id="mes-conversations"
        number={number}
        title="Mes conversations"
        aside={
          conversations.data
            ? `${list.length}${unread ? ` · dont ${unread} non lue${unread > 1 ? 's' : ''}` : ''}`
            : undefined
        }
      />
      {conversations.isPending ? (
        <LoadingBlock label="Chargement de vos conversations…" />
      ) : conversations.isError ? (
        <p role="alert" className="m-0 text-sm text-err">
          Vos conversations n’ont pas pu être chargées. Rechargez la page.
        </p>
      ) : list.length === 0 ? (
        <p className="m-0 py-3 text-base text-ink-2">
          Aucune conversation pour l’instant. Écrivez à un prêtre pour en
          commencer une.
        </p>
      ) : (
        <ConversationList
          conversations={list}
          meId={me.data?.id}
          hrefOf={(id) => paths.app.pretres.conversation.getHref(id)}
          label="Mes conversations"
        />
      )}
    </section>
  );
};
