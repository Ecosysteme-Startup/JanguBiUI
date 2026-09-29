'use client';

import { useParams, useRouter } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import {
  type TypeContenu,
  TYPES_CONTENU,
  useContenuStaff,
  useModifierContenu,
} from '@/features/news/api/staff-articles';
import {
  ArticleForm,
  versContenuInput,
} from '@/features/news/components/article-form';
import { EpinglageAnnonce } from '@/features/news/components/epinglage-annonce';
import { ApiError } from '@/lib/api-client';
import { peut } from '@/lib/staff/capacites';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contenu, isLoading, isError } = useContenuStaff(id);
  const modifier = useModifierContenu(id);

  return (
    <AdminPageLayout
      title="Modifier le contenu"
      subtitle={contenu?.title}
      allow={peut('annonces.publier')}
      width="md"
    >
      {modifier.error instanceof ApiError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {modifier.error.message}
        </p>
      )}
      {isLoading ? (
        <SkeletonList />
      ) : isError || !contenu ? (
        <ErrorState
          title="Contenu introuvable"
          description="Ce contenu n’existe pas ou ne relève pas de vos communautés."
        />
      ) : (
        <>
          <ArticleForm
            defaultValues={{
              title: contenu.title,
              excerpt: contenu.excerpt,
              content: contenu.content,
              category_id: contenu.category?.id,
              content_type: (TYPES_CONTENU as readonly string[]).includes(
                contenu.content_type,
              )
                ? (contenu.content_type as TypeContenu)
                : 'article',
              is_sunday_notice: contenu.is_sunday_notice,
              sunday_date: contenu.sunday_date ?? undefined,
              notify_followers: contenu.notify_followers ?? true,
            }}
            isSubmitting={modifier.isPending}
            submitLabel="Enregistrer les modifications"
            onSubmit={(v) =>
              modifier.mutate(versContenuInput(v), {
                onSuccess: () =>
                  router.push(paths.app.admin.articles.getHref()),
              })
            }
          />
          <EpinglageAnnonce contenu={contenu} />
        </>
      )}
    </AdminPageLayout>
  );
}
