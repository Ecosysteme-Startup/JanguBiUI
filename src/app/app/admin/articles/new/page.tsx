'use client';

import { useRouter } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { AucunNoeud, useNoeudActif } from '@/components/staff/noeud-actif';
import { paths } from '@/config/paths';
import { useCreerContenu } from '@/features/news/api/staff-articles';
import {
  ArticleForm,
  versContenuInput,
} from '@/features/news/components/article-form';
import { ApiError } from '@/lib/api-client';
import { peut } from '@/lib/staff/capacites';

export default function NewArticlePage() {
  const router = useRouter();
  const { noeuds, isLoading } = useNoeudActif('annonces.publier');
  const creer = useCreerContenu();

  return (
    <AdminPageLayout
      title="Nouvelle annonce"
      subtitle="Enregistrée en brouillon : vous la publierez ensuite"
      allow={peut('annonces.publier')}
      width="md"
    >
      {creer.error instanceof ApiError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {creer.error.message}
        </p>
      )}
      {!isLoading && noeuds.length === 0 ? (
        <AucunNoeud quoi="la publication d’annonces" />
      ) : (
        <ArticleForm
          key={noeuds[0]?.id}
          noeuds={noeuds}
          isSubmitting={creer.isPending}
          submitLabel="Créer le brouillon"
          onSubmit={(v) =>
            creer.mutate(
              { ...versContenuInput(v), node_id: v.node_id ?? noeuds[0]?.id },
              {
                onSuccess: () =>
                  router.push(paths.app.admin.articles.getHref()),
              },
            )
          }
        />
      )}
    </AdminPageLayout>
  );
}
