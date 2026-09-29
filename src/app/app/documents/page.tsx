'use client';

import { FileText, PackageCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { paths } from '@/config/paths';
import { DocumentsList } from '@/features/documents/components/documents-list';
import { VaultContent } from '@/features/documents/components/vault-content';
import { useUser } from '@/lib/auth';
import { isAdmin, isClergy } from '@/lib/authorization';
import { cn } from '@/lib/utils';

type Tab = 'requests' | 'vault';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'requests', label: 'Mes demandes', icon: FileText },
  { id: 'vault', label: 'À retirer', icon: PackageCheck },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  useEffect(() => {
    if (!isLoading && isAdmin(user) && !isClergy(user)) {
      router.replace(paths.app.admin.documents.getHref());
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: 'Documents',
    subtitle: 'Vos demandes d’actes auprès des paroisses',
  });

  if (isLoading) return null;
  if (isAdmin(user) && !isClergy(user)) return null;

  return (
    <>
      <div className="flex flex-col">
        <ContentContainer>
          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'requests' && <DocumentsList />}
          {activeTab === 'vault' && <VaultContent />}
        </ContentContainer>
      </div>

      {activeTab === 'requests' && (
        <Link
          href={paths.app.newDocument.getHref()}
          className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl md:bottom-6"
          aria-label="Nouvelle demande"
        >
          <Plus className="size-6" />
        </Link>
      )}
    </>
  );
}
