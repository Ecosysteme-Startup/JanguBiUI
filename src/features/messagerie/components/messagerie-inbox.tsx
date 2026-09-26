'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ShellLayout } from '@/components/layouts/shell-slots';
import { ConfessionNotice } from '@/components/signature/confession-notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useDebounce } from '@/hooks/use-debounce';
import { displayName, useMe } from '@/hooks/use-me';
import { availabilityStatus } from '@/utils/availability-label';
import { cn } from '@/utils/cn';

import { useArchiveConversation } from '../api/archive-conversation';
import { useAvailability } from '../api/availability';
import { useConversations } from '../api/get-conversations';
import { type Filter, filterConversations, isLate, isUnanswered } from '../utils/inbox';

import { AvailabilityPanel } from './availability-panel';
import type { QuickReply } from './composer';
import { ConversationList } from './conversation-list';
import { ConversationThread } from './conversation-thread';

const QUICK_REPLIES: QuickReply[] = [
  {
    label: 'Proposer un rendez-vous de confession',
    icon: 'calendrier',
    text: 'Pour la confession, venez en personne : réservez un créneau dans l’application, rubrique « Rendez-vous de confession ». Aucun motif n’est demandé.',
  },
];

/** Disponibilité vue par les fidèles, et son réglage dans une fenêtre. */
const AvailabilityStatus = () => {
  const [open, setOpen] = useState(false);
  const availability = useAvailability();
  const status = availability.data ? availabilityStatus(availability.data) : null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hit mt-3 inline-flex items-center gap-2 rounded-10 text-13 text-ink-2 hover:text-ink"
      >
        {status && <span aria-hidden="true" className={cn('size-2 rounded-full', status.tone === 'ok' ? 'bg-ok-dot' : 'bg-warn-dot')} />}
        <span>
          {status ? `Les fidèles voient : ${status.label}` : 'Ma disponibilité'}
          <span className="font-semibold text-primary"> · Modifier</span>
        </span>
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Ma disponibilité"
        description="Ce que voient les fidèles avant de vous écrire. Rien ne vous oblige à répondre en dehors de vos plages."
        size="lg"
      >
        <AvailabilityPanel />
      </Modal>
    </>
  );
};

/**
 * Messagerie du prêtre (PAR-Messagerie) : SES conversations uniquement ; aucun autre
 * membre de l'équipe n'y a accès (RG-09). La conversation ouverte est dans l'URL (`?c=`).
 */
export const MessagerieInbox = ({ nodeId }: { nodeId: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get('c'));
  const [filter, setFilter] = useState<Filter>('sans_reponse');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const me = useMe();
  const meId = me.data?.id;
  const conversations = useConversations(debounced.trim());
  const archive = useArchiveConversation({ onSuccess: () => toast.ok('Conversation archivée.') });

  const all = conversations.data ?? [];
  const groups = filterConversations(all, filter, meId);
  const unansweredCount = all.filter((c) => !c.is_archived && isUnanswered(c, meId)).length;
  const activeCount = all.filter((c) => !c.is_archived).length;
  const archivedCount = all.filter((c) => c.is_archived).length;

  const notice = {
    bookingHref: paths.espace.confessions.getHref(nodeId),
    description:
      'Si quelqu’un l’évoque, proposez-lui un rendez-vous de confession en présentiel. N’écrivez rien qui relève du for interne.',
    actionLabel: 'Voir les créneaux',
  };

  const select = (id: string) => {
    setSelected(id);
    router.replace(`${pathname}?c=${encodeURIComponent(id)}`);
  };
  const back = () => {
    setSelected(null);
    router.replace(pathname);
  };

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[372px_minmax(0,1fr)]">
      <ShellLayout fullBleed />
      <section aria-labelledby="messagerie-titre" className={cn('min-h-0 flex-col border-line lg:flex lg:border-r', selected ? 'hidden' : 'flex')}>
        <div className="px-4 pt-6 lg:px-5">
          <h1 id="messagerie-titre" className="m-0 text-28 font-semibold text-ink">
            Messagerie
          </h1>
          <p className="m-0 mt-0.5 flex items-center gap-1.5 text-13 text-ink-3">
            <Icon name="cadenas" size={14} className="shrink-0" />
            {me.data ? `${displayName(me.data).full} · messages chiffrés` : 'Messages chiffrés'}
          </p>
          <AvailabilityStatus />
          <SegmentedControl
            label="Filtrer les conversations"
            value={filter}
            onChange={(value) => setFilter(value)}
            options={[
              ['sans_reponse', 'Sans réponse'],
              ['toutes', 'Toutes'],
              ['archivees', 'Archivées'],
            ]}
            counts={{ sans_reponse: unansweredCount, toutes: activeCount, ...(archivedCount ? { archivees: archivedCount } : {}) }}
            size="sm"
            block
            className="mt-4"
          />
          <label htmlFor="conv-filtre" className="sr-only">
            Rechercher une conversation
          </label>
          <Input
            id="conv-filtre"
            type="search"
            placeholder="Nom du fidèle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {conversations.isPending ? (
            <div className="p-4">
              <LoadingBlock label="Chargement des conversations…" />
            </div>
          ) : conversations.isError ? (
            <p role="alert" className="m-0 p-4 text-14 text-err">
              Les conversations n’ont pas pu être chargées.
            </p>
          ) : groups.length === 0 ? (
            <p className="m-0 p-4 text-14 text-ink-2">
              {filter === 'sans_reponse'
                ? 'Aucun message sans réponse.'
                : filter === 'archivees'
                  ? 'Aucune conversation archivée.'
                  : 'Aucune conversation.'}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key}>
                <p className="m-0 mb-1 mt-4 flex justify-between px-3 text-13 text-ink-3">
                  <span>{group.title}</span>
                  {group.hint && <span>{group.hint}</span>}
                </p>
                <ConversationList
                  conversations={group.conversations}
                  meId={meId}
                  onSelect={select}
                  activeId={selected}
                  isLate={(c) => isLate(c, meId)}
                  label={group.title}
                />
              </div>
            ))
          )}
        </div>
        <p className="m-4 flex items-start gap-2 rounded-12 border border-line bg-surface px-3.5 py-3 text-13 text-ink-3">
          <Icon name="bouclier" size={16} className="mt-px shrink-0" />
          <span>
            Ni le secrétariat, ni le curé, ni les administrateurs de Jàngu Bi n’ont accès au contenu des conversations. Le secrétariat voit
            seulement le nombre de messages sans réponse.
          </span>
        </p>
      </section>
      <div className={cn('min-h-0 min-w-0 flex-col lg:flex', selected ? 'flex' : 'hidden')}>
        {selected ? (
          <ConversationThread
            key={selected}
            conversationId={selected}
            notice={notice}
            audience="pretre"
            quickReplies={QUICK_REPLIES}
            leading={
              <button
                type="button"
                onClick={back}
                aria-label="Retour aux conversations"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-10 text-ink hover:bg-surface-2 lg:hidden"
              >
                <Icon name="fleche-gauche" size={20} />
              </button>
            }
            actions={
              <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate(selected)}>
                <Icon name="archive" size={18} />
                Archiver
              </Button>
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ConfessionNotice variant="pinned" audience="pretre" {...notice} className="shrink-0" />
            <EmptyState icon="message" title="Choisissez une conversation" className="m-auto">
              Les messages des fidèles s’affichent ici. Personne d’autre que vous ne les lit.
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  );
};
