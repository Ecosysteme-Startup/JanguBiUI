'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ConfessionNotice } from '@/components/signature/confession-notice';
import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useDebounce } from '@/hooks/use-debounce';
import { useMe } from '@/hooks/use-me';

import { useArchiveConversation } from '../api/archive-conversation';
import { useConversations } from '../api/get-conversations';
import type { Conversation } from '../api/schemas';

import { AvailabilityPanel } from './availability-panel';
import { ConversationList } from './conversation-list';
import { ConversationThread } from './conversation-thread';

type Filter = 'toutes' | 'non_lues' | 'archivees';

const FILTERS: {
  value: Filter;
  label: string;
  keep: (c: Conversation) => boolean;
}[] = [
  { value: 'toutes', label: 'Toutes', keep: (c) => !c.is_archived },
  {
    value: 'non_lues',
    label: 'Non lues',
    keep: (c) => !c.is_archived && c.unread_count > 0,
  },
  {
    value: 'archivees',
    label: 'Archivées',
    keep: (c) => Boolean(c.is_archived),
  },
];

/**
 * Messagerie du prêtre (PAR-Messagerie) : SES conversations uniquement ; aucun autre
 * membre de l'équipe n'y a accès (RG-09). La conversation ouverte est dans l'URL (`?c=`).
 */
export const MessagerieInbox = ({ nodeId }: { nodeId: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get('c'));
  const [filter, setFilter] = useState<Filter>('toutes');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const me = useMe();
  const conversations = useConversations(debounced.trim());
  const archive = useArchiveConversation({
    onSuccess: () => toast.ok('Conversation archivée.'),
  });

  const all = conversations.data ?? [];
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.value, all.filter(f.keep).length]),
  ) as Record<Filter, number>;
  const visible = all.filter(FILTERS.find((f) => f.value === filter)!.keep);

  const notice = {
    bookingHref: paths.espace.confessions.getHref(nodeId),
    description:
      'Si un fidèle demande le sacrement de réconciliation, proposez-lui un rendez-vous en présentiel.',
    actionLabel: 'Voir les créneaux',
  };

  const select = (id: string) => {
    setSelected(id);
    router.replace(`${pathname}?c=${encodeURIComponent(id)}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">06</span> — Parler à un prêtre
            {conversations.data
              ? ` · ${counts.toutes} conversation${counts.toutes > 1 ? 's' : ''}`
              : ''}
          </p>
          <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">
            Messagerie
          </h1>
        </div>
        <AvailabilityPanel />
      </div>

      <div className="grid overflow-hidden rounded border border-line border-t-line-strong lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col border-line lg:border-r">
          <div className="flex flex-col gap-3 border-b border-line p-4">
            <label htmlFor="conv-filtre" className="sr-only">
              Rechercher une conversation
            </label>
            <Input
              id="conv-filtre"
              type="search"
              placeholder="Nom du fidèle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ChipGroup label="Filtrer les conversations">
              {FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                  {f.value !== 'archivees' && (
                    <span className="tnum text-meta">{counts[f.value]}</span>
                  )}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.isPending ? (
              <div className="p-4">
                <LoadingBlock label="Chargement des conversations…" />
              </div>
            ) : conversations.isError ? (
              <p role="alert" className="m-0 p-4 text-sm text-err">
                Les conversations n’ont pas pu être chargées.
              </p>
            ) : visible.length === 0 ? (
              <p className="m-0 p-4 text-sm text-ink-2">
                {filter === 'non_lues'
                  ? 'Aucun message non lu.'
                  : filter === 'archivees'
                    ? 'Aucune conversation archivée.'
                    : 'Aucune conversation.'}
              </p>
            ) : (
              <ConversationList
                conversations={visible}
                meId={me.data?.id}
                onSelect={select}
                activeId={selected}
                label="Conversations"
              />
            )}
          </div>
          <p className="m-0 border-t border-line p-4 text-meta text-ink-3">
            Ni le secrétariat, ni le curé, ni les administrateurs de Jàngu Bi
            n’ont accès au contenu des conversations.
          </p>
        </div>
        <div className="min-w-0">
          {selected ? (
            <ConversationThread
              key={selected}
              conversationId={selected}
              headingLevel="h2"
              notice={notice}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={archive.isPending}
                  onClick={() => archive.mutate(selected)}
                >
                  Archiver
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4 p-4">
              <ConfessionNotice {...notice} />
              <EmptyState
                icon="message"
                title="Choisissez une conversation"
                className="border-0 px-0"
              >
                Les messages des fidèles de la paroisse s’affichent ici.
                Personne d’autre que vous ne les lit.
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
