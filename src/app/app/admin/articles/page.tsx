'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { NoeudSelect, useNoeudActif } from '@/components/staff/noeud-actif';
import { FilterPills } from '@/components/ui/filter-pills';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import {
  CONTENUS_PAR_PAGE,
  LIBELLES_STATUT_CONTENU,
  useContenusStaff,
} from '@/features/news/api/staff-articles';
import { AdminArticleList } from '@/features/news/components/admin-article-list';
import { peut } from '@/lib/staff/capacites';

const STATUTS = ['', 'draft', 'scheduled', 'published', 'unpublished'];

export default function AdminArticlesPage() {
  const { noeud, noeuds, choisir } = useNoeudActif('annonces.publier');
  const [statut, setStatut] = useState('');
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useContenusStaff(
    { node: noeud?.id, status: statut, offset },
    !!noeud,
  );

  return (
    <AdminPageLayout
      title="Annonces et articles"
      subtitle="Rédiger, publier et retirer les contenus de la communauté"
      allow={peut('annonces.publier')}
      headerAction={
        <Link
          href={paths.app.admin.articleNew.getHref()}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90 hover:no-underline"
        >
          <PlusCircle className="size-4" aria-hidden="true" />
          Nouvelle annonce
        </Link>
      }
      toolbar={
        <div className="space-y-3">
          <NoeudSelect
            noeuds={noeuds}
            valeur={noeud?.id}
            onChange={(id) => {
              choisir(id);
              setOffset(0);
            }}
          />
          <FilterPills
            options={STATUTS.map((s) => ({
              value: s,
              label: s ? LIBELLES_STATUT_CONTENU[s] : 'Tous',
            }))}
            value={statut}
            onChange={(v) => {
              setStatut(v);
              setOffset(0);
            }}
            ariaLabel="Filtrer par statut"
          />
        </div>
      }
    >
      <AdminArticleList
        articles={data?.results}
        isLoading={isLoading}
        pagination={
          data
            ? {
                count: data.count,
                limit: CONTENUS_PAR_PAGE,
                offset,
                onOffsetChange: setOffset,
              }
            : undefined
        }
      />
    </AdminPageLayout>
  );
}
