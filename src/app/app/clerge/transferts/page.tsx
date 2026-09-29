'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { SansRoute } from '@/components/staff/sans-route';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { useAdminTransfers } from '@/features/transfert-paroissial/api/get-admin-transfers';
import { AdminTransferList } from '@/features/transfert-paroissial/components/admin-transfer-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

function ClergeTransfertsPageContenu() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const authorized = !userLoading && isClergy(user);
  const {
    data,
    isLoading: dataLoading,
    isError,
    refetch,
  } = useAdminTransfers(authorized);

  useEffect(() => {
    if (!userLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  useRegisterPageMeta({
    title: 'Transferts paroissiaux',
    subtitle: 'Gérer les demandes de transfert de votre paroisse',
  });

  if (userLoading || !isClergy(user)) return null;

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        <SectionHeader
          title="Demandes reçues"
          description={
            data && data.count > 0
              ? `${data.count} demande${data.count > 1 ? 's' : ''} au total`
              : undefined
          }
        />
        {isError ? (
          <ErrorState
            title="Impossible de charger les demandes"
            description="Une erreur est survenue lors de la récupération des transferts."
            onRetry={() => refetch()}
          />
        ) : (
          <AdminTransferList
            transfers={data?.results ?? []}
            isLoading={dataLoading}
          />
        )}
      </div>
    </div>
  );
}

export default function ClergeTransfertsPage() {
  return (
    <SansRoute cle="transferts" titre="Transferts paroissiaux">
      <ClergeTransfertsPageContenu />
    </SansRoute>
  );
}
