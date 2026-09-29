'use client';

import { ArrowLeft, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { SansRoute } from '@/components/staff/sans-route';
import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RelativeTime } from '@/components/ui/relative-time';
import { UserAvatar } from '@/components/ui/user-avatar';
import { paths } from '@/config/paths';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { ClericalComposeForm } from '@/features/messaging/components/clerical-compose-form';
import { ClericalInboxList } from '@/features/messaging/components/clerical-inbox-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { useParishes } from '@/lib/org/get-parishes';
import { cn } from '@/lib/utils';

type Tab = 'inbox' | 'compose';

const TAB_LABELS: Record<Tab, string> = {
  inbox: 'Boîte de réception',
  compose: 'Nouveau message',
};

const TABS: Tab[] = ['inbox', 'compose'];

function ClergeMessagesPageContenu() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [selectedMessage, setSelectedMessage] =
    useState<ClergicalMessage | null>(null);

  // Le fetch des paroisses vit dans la page (couche `app`) : une feature ne peut
  // pas importer une autre feature. La liste est passée en prop au formulaire.
  const { data: parishes = [], isLoading: parishesLoading } = useParishes();

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({ title: 'Messages inter-clergé' });

  if (isLoading || !isClergy(user)) return null;

  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label="Messages"
        className="flex border-b border-border px-4"
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-${tab}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                e.preventDefault();
                const current = TABS.indexOf(activeTab);
                const delta = e.key === 'ArrowRight' ? 1 : -1;
                setActiveTab(
                  TABS[(current + delta + TABS.length) % TABS.length],
                );
              }}
              className={cn(
                '-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                selected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'inbox' && (
          <div
            role="tabpanel"
            id="tabpanel-inbox"
            aria-labelledby="tab-inbox"
            className="flex flex-1 overflow-hidden"
          >
            {/* Liste — pleine largeur sur mobile, colonne fixe sur desktop.
                  Masquée sur mobile dès qu'un message est ouvert. */}
            <div
              className={cn(
                'w-full overflow-y-auto border-border md:w-80 md:flex-shrink-0 md:border-r',
                selectedMessage ? 'hidden md:block' : 'block',
              )}
            >
              <ClericalInboxList
                onSelect={setSelectedMessage}
                selectedId={selectedMessage?.id}
              />
            </div>

            {/* Détail — pleine largeur sur mobile quand un message est ouvert. */}
            <div
              className={cn(
                'flex-1 overflow-y-auto p-6',
                selectedMessage ? 'block' : 'hidden md:block',
              )}
            >
              {selectedMessage ? (
                <article>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessage(null)}
                    icon={<ArrowLeft className="size-4" aria-hidden="true" />}
                    className="mb-4 -ml-2 gap-1.5 px-2 text-muted-foreground hover:text-foreground md:hidden"
                  >
                    Retour
                  </Button>
                  <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">
                    {selectedMessage.subject}
                  </h2>
                  <div className="mb-5 flex items-center gap-3">
                    <UserAvatar
                      email={selectedMessage.sender_email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedMessage.sender_email}
                      </p>
                      <RelativeTime
                        iso={selectedMessage.created_at}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {selectedMessage.body}
                  </div>
                </article>
              ) : (
                <div className="mt-12">
                  <EmptyState
                    icon={<Inbox aria-hidden="true" />}
                    title="Aucun message sélectionné"
                    description="Sélectionnez un message dans la liste pour le lire."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div
            role="tabpanel"
            id="tabpanel-compose"
            aria-labelledby="tab-compose"
            className="max-w-2xl flex-1 overflow-y-auto p-6"
          >
            <ClericalComposeForm
              onSuccess={() => setActiveTab('inbox')}
              parishes={parishes}
              parishesLoading={parishesLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClergeMessagesPage() {
  return (
    <SansRoute cle="messagerieClericale" titre="Messages du clergé">
      <ClergeMessagesPageContenu />
    </SansRoute>
  );
}
