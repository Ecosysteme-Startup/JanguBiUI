'use client';

import { Radio } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { SansRoute } from '@/components/staff/sans-route';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDeleteVideo } from '@/features/tv/api/delete-video';
import { useTvCategories } from '@/features/tv/api/get-categories';
import { useTvVideos } from '@/features/tv/api/get-videos';
import { CategoryForm } from '@/features/tv/components/category-form';
import { VideoForm } from '@/features/tv/components/video-form';
import type { TvCategory, TvVideo } from '@/features/tv/types';
import { canManageTV } from '@/lib/authorization';

function CategoriesSection() {
  const { data: cats, isLoading } = useTvCategories();
  const [showForm, setShowForm] = useState(false);

  return (
    <section>
      <SectionHeader
        title="Catégories"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Annuler' : '+ Catégorie'}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-3">
          <CategoryForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="space-y-1.5">
          {cats?.results.map((cat: TvCategory) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="text-foreground">{cat.name}</span>
              <div className="flex items-center gap-2">
                {cat.is_clergy_only && (
                  <StatusBadge tone="progress" label="Clergé" />
                )}
                <span className="text-xs text-muted-foreground">
                  #{cat.order}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeleteVideoButton({ video }: { video: TvVideo }) {
  const { mutate: deleteVideo, isPending } = useDeleteVideo();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette vidéo&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            « {video.title || 'Vidéo sans titre'} » sera définitivement retirée
            de JanguBi TV. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => deleteVideo(video.id)}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function VideosSection() {
  const { data: cats } = useTvCategories();
  const { data: videos, isLoading } = useTvVideos();
  const [editingVideo, setEditingVideo] = useState<TvVideo | null>(null);
  const [showForm, setShowForm] = useState(false);

  const categories = cats?.results ?? [];

  const startCreate = () => {
    setEditingVideo(null);
    setShowForm((v) => !v);
  };

  const startEdit = (video: TvVideo) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  const columns: DataTableColumn<TvVideo>[] = [
    {
      header: 'Vidéo',
      mobileLabel: 'Titre',
      cell: (v) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {v.title || '(sans titre)'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {v.youtube_url}
          </p>
        </div>
      ),
    },
    {
      header: 'Catégorie',
      cell: (v) => (
        <span className="text-sm text-muted-foreground">{v.category.name}</span>
      ),
    },
    {
      header: 'État',
      cell: (v) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5 md:justify-start">
          {v.is_live && (
            <StatusBadge
              tone="danger"
              label="Live"
              icon={<Radio aria-hidden="true" />}
            />
          )}
          {v.is_pinned_live && <StatusBadge tone="warning" label="Épinglé" />}
          {!v.is_live && !v.is_pinned_live && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: 'text-right',
      className: 'text-right',
      cell: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => startEdit(v)}>
            Éditer
          </Button>
          <DeleteVideoButton video={v} />
        </div>
      ),
    },
  ];

  return (
    <section>
      <SectionHeader
        title="Vidéos"
        action={
          <Button size="sm" variant="outline" onClick={startCreate}>
            {showForm && !editingVideo ? 'Annuler' : '+ Vidéo'}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-4">
          <VideoForm
            key={editingVideo?.id ?? 'new'}
            categories={categories}
            video={editingVideo ?? undefined}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </div>
      )}

      <DataTable
        data={videos?.results}
        columns={columns}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        caption="Liste des vidéos TV"
      />
    </section>
  );
}

function AdminTvPageContenu() {
  return (
    <AdminPageLayout
      title="JanguBi TV"
      subtitle="Gérer les catégories et les vidéos diffusées"
      allow={canManageTV}
    >
      <div className="space-y-8">
        <CategoriesSection />
        <VideosSection />
      </div>
    </AdminPageLayout>
  );
}

export default function AdminTvPage() {
  return (
    <SansRoute cle="jangubiTv" titre="JanguBi TV">
      <AdminTvPageContenu />
    </SansRoute>
  );
}
