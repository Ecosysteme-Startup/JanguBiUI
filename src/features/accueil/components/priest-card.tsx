'use client';

import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { CountBadge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { plural } from '@/utils/plural';

import { type HomeConversation, useConversations } from '../api/get-conversations';
import { useReachablePriests } from '../api/get-reachable-priests';

import { HomeSection } from './home-section';

const PRIVACY = 'Messages chiffrés, aucun administrateur n’y a accès';

const Privacy = () => (
  <span className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-13 text-ink-3">
    <Icon name="cadenas" size={14} className="shrink-0" />
    {PRIVACY}
  </span>
);

const when = (iso: string) => (dayjs(iso).isSame(new Date(), 'day') ? dayjs(iso).format('HH:mm') : dayjs(iso).format('D MMM'));

/** La conversation à montrer : la plus récente avec des messages non lus, sinon la plus récente. */
const pickConversation = (list: HomeConversation[]) => {
  const open = list.filter((c) => !c.is_archived && c.last_message);
  return open.find((c) => c.unread_count > 0) ?? open[0] ?? null;
};

const ConversationCard = ({ conversation, meId }: { conversation: HomeConversation; meId: string | undefined }) => {
  const other = conversation.participant_a.id === meId ? conversation.participant_b : conversation.participant_a;
  const last = conversation.last_message;
  const unread = conversation.unread_count;
  return (
    <NextLink href={paths.app.pretres.conversation.getHref(conversation.id)} className={cardClasses({ interactive: true })}>
      <span className="flex items-center gap-3">
        <Avatar name={other.full_name} size={40} />
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
          <span className="truncate text-15 font-semibold">{other.full_name}</span>
          {last && (
            <span className={cn('tnum shrink-0 text-13', unread > 0 ? 'font-semibold text-primary' : 'text-ink-3')}>{when(last.sent_at)}</span>
          )}
        </span>
      </span>
      {last?.content && (
        <span className="mt-3 flex items-start gap-3">
          <span className={cn('line-clamp-3 flex-1 text-15', unread > 0 ? 'font-medium text-ink' : 'text-ink-2')}>{frenchTypo(last.content)}</span>
          {unread > 0 && (
            <CountBadge value={unread} label={plural(unread, 'message non lu', 'messages non lus')} className="mt-0.5" />
          )}
        </span>
      )}
      <Privacy />
    </NextLink>
  );
};

/** Sans conversation : un prêtre de ma paroisse qui reçoit des messages. */
const PriestSuggestion = () => {
  const { data: me } = useMe();
  const { data: priests, isPending, isError } = useReachablePriests();
  const parishId = me?.paroisse_suivie?.id;
  const available = (priests ?? []).filter((p) => p.availability?.accepts_new_conversations !== false);
  const priest = available.find((p) => p.nodes.some((n) => n.id === parishId)) ?? available[0];
  const node = priest?.nodes.find((n) => n.id === parishId) ?? priest?.nodes[0];

  if (isPending) {
    return (
      <div role="status" data-testid="pretre-squelette" className={cardClasses()}>
        <span className="sr-only">Chargement des prêtres…</span>
        <span aria-hidden="true" className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <span className="flex-1">
            <SkeletonLine className="text-15" width="w-2/3" />
            <SkeletonLine className="text-13" width="w-1/2" />
          </span>
        </span>
        <Skeleton className="mt-4 h-10 w-24" />
      </div>
    );
  }
  if (isError) return <p className="m-0 text-15 text-ink-2">La liste des prêtres n’a pas pu être chargée.</p>;
  if (!priest) return <p className="m-0 text-15 text-ink-2">Aucun prêtre de votre paroisse ne reçoit de messages pour le moment.</p>;
  return (
    <div className={cardClasses()}>
      <span className="flex items-center gap-3">
        <Avatar name={priest.full_name} size={40} />
        <span className="flex min-w-0 flex-col">
          <span className="text-15 font-semibold text-ink">{priest.full_name}</span>
          {(priest.office || node) && (
            <span className="text-13 text-ink-3">{[priest.office?.label, node?.name].filter(Boolean).join(' · ')}</span>
          )}
        </span>
      </span>
      <NextLink href={paths.app.pretres.list.getHref()} className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
        Écrire
      </NextLink>
      <Privacy />
    </div>
  );
};

/** « Parler à un prêtre » (FID-Accueil) : la dernière conversation, ou un prêtre joignable. */
export const PriestCard = ({ className }: { className?: string }) => {
  const { data: me } = useMe();
  const conversations = useConversations();
  const conversation = conversations.data ? pickConversation(conversations.data) : null;
  return (
    <HomeSection
      id="acc-pretre"
      title="Parler à un prêtre"
      className={className}
      action={<NextLink href={paths.app.pretres.list.getHref()}>Messagerie</NextLink>}
    >
      {conversation ? <ConversationCard conversation={conversation} meId={me?.id} /> : <PriestSuggestion />}
    </HomeSection>
  );
};
