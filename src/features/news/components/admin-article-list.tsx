'use client';

import { Newspaper, Pencil, Send, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';

import {
  type ContenuStaff,
  LIBELLES_STATUT_CONTENU,
  LIBELLES_TYPE,
  useDepublierContenu,
  usePublierContenu,
  useSupprimerContenu,
} from '../api/staff-articles';

const VARIANTES: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success'
> = {
  draft: 'outline',
  scheduled: 'secondary',
  published: 'success',
  unpublished: 'destructive',
};

const dateCourte = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

interface AdminArticleListProps {
  articles: ContenuStaff[] | undefined;
  isLoading?: boolean;
  pagination?: React.ComponentProps<typeof DataTable>['pagination'];
}

/** Contenus à gérer (`/v1/staff/news/`), tous statuts, avec les lectures. */
export function AdminArticleList({
  articles,
  isLoading,
  pagination,
}: AdminArticleListProps) {
  const [aSupprimer, setASupprimer] = useState<ContenuStaff | null>(null);
  const [aRetirer, setARetirer] = useState<ContenuStaff | null>(null);
  const [motif, setMotif] = useState('');

  const publier = usePublierContenu();
  const depublier = useDepublierContenu();
  const supprimer = useSupprimerContenu();

  const colonnes: DataTableColumn<ContenuStaff>[] = [
    {
      header: 'Titre',
      cell: (a) => (
        <div>
          <span className="line-clamp-1 font-medium text-foreground">
            {a.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {a.scope?.node_name ?? 'Toute la plateforme'}
            {a.author_name ? ` · ${a.author_name}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (a) => LIBELLES_TYPE[a.content_type] ?? a.content_type,
    },
    {
      header: 'Statut',
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={VARIANTES[a.status] ?? 'outline'}>
            {LIBELLES_STATUT_CONTENU[a.status] ?? a.status}
          </Badge>
          {a.is_pinned && <Badge variant="outline">Épinglée</Badge>}
        </div>
      ),
    },
    {
      header: 'Publié le',
      cell: (a) => dateCourte(a.published_at ?? a.publish_at),
    },
    {
      header: 'Lectures',
      cell: (a) => a.reads_count.toLocaleString('fr-FR'),
      hideOnMobile: true,
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (a) => (
        <div className="flex items-center justify-end gap-1">
          {a.status !== 'unpublished' && (
            <Link
              href={paths.app.admin.articleEdit.getHref(a.id)}
              aria-label={`Modifier « ${a.title} »`}
              className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Link>
          )}
          {(a.status === 'draft' || a.status === 'unpublished') && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Publier « ${a.title} »`}
              onClick={() => publier.mutate({ id: a.id })}
              disabled={publier.isPending}
            >
              <Send className="size-4" />
            </Button>
          )}
          {(a.status === 'published' || a.status === 'scheduled') && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Retirer « ${a.title} »`}
              onClick={() => setARetirer(a)}
            >
              <X className="size-4" />
            </Button>
          )}
          {a.status !== 'published' && a.status !== 'scheduled' && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer « ${a.title} »`}
              className="text-destructive hover:text-destructive"
              onClick={() => setASupprimer(a)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={articles}
        columns={colonnes}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        caption="Annonces et articles"
        pagination={pagination}
        emptyState={
          <EmptyState
            icon={<Newspaper />}
            title="Aucun contenu"
            description="Rédigez une annonce : elle reste en brouillon jusqu’à sa publication."
          />
        }
      />

      <Dialog
        open={!!aSupprimer}
        onOpenChange={(open) => !open && setASupprimer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce contenu ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.title} » sera supprimé définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={supprimer.isPending}
              onClick={() =>
                aSupprimer &&
                supprimer.mutate(aSupprimer.id, {
                  onSuccess: () => setASupprimer(null),
                })
              }
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!aRetirer}
        onOpenChange={(open) => {
          if (!open) {
            setARetirer(null);
            setMotif('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer de la publication ?</DialogTitle>
            <DialogDescription>
              « {aRetirer?.title} » ne sera plus visible des fidèles.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="motif-retrait" className="text-sm font-medium">
            Motif (facultatif)
          </label>
          <input
            id="motif-retrait"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setARetirer(null)}>
              Annuler
            </Button>
            <Button
              isLoading={depublier.isPending}
              onClick={() =>
                aRetirer &&
                depublier.mutate(
                  { id: aRetirer.id, reason: motif },
                  {
                    onSuccess: () => {
                      setARetirer(null);
                      setMotif('');
                    },
                  },
                )
              }
            >
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
