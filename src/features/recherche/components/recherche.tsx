'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import {
  LIBELLES_RECHERCHE,
  type ResultatsRecherche,
  TYPES_RECHERCHE,
  type TypeRecherche,
  useRecherche,
} from '../api/recherche';

type Ligne = { cle: string; titre: string; detail: string; href?: string };

const duree = (s: number | null | undefined) =>
  s ? `${Math.max(1, Math.round(s / 60))} min` : '';

/** Met les résultats d'un type à plat, pour un affichage uniforme. */
export const lignes = (
  r: ResultatsRecherche['results'],
  type: TypeRecherche,
): Ligne[] => {
  switch (type) {
    case 'bible':
      return (r.bible?.items ?? []).map((v) => ({
        cle: `b${v.id}`,
        titre: `${v.book_name} ${v.chapter}, ${v.verse}`,
        detail: v.text,
      }));
    case 'paroisses':
      return (r.paroisses?.items ?? []).map((p) => ({
        cle: `p${p.id}`,
        titre: p.name,
        detail: [p.city, p.on_platform ? '' : 'pas encore sur Jàngu Bi']
          .filter(Boolean)
          .join(' · '),
      }));
    case 'lieux':
      return (r.lieux?.items ?? []).map((l) => ({
        cle: `l${l.id}`,
        titre: l.name,
        detail: [l.node_name, l.city].filter(Boolean).join(' · '),
      }));
    case 'annonces':
      return (r.annonces?.items ?? []).map((a) => ({
        cle: `a${a.id}`,
        titre: a.title,
        detail: [a.node_name, a.excerpt].filter(Boolean).join(' · '),
        href: paths.app.article.getHref(a.id),
      }));
    case 'pretres':
      return (r.pretres?.items ?? []).map((p) => ({
        cle: `r${p.id}`,
        titre: p.name,
        detail: [p.office, p.node_name].filter(Boolean).join(' · '),
        href: paths.app.messages.getHref(),
      }));
    case 'audio':
      return (r.audio?.items ?? []).map((t) => ({
        cle: `s${t.id}`,
        titre: t.title,
        detail: [t.album_title, t.source_name, duree(t.duration_seconds)]
          .filter(Boolean)
          .join(' · '),
        href: t.album_id
          ? paths.app.ecouter.album.getHref(t.album_id)
          : undefined,
      }));
  }
};

function Groupe({
  type,
  items,
  plus,
  onToutVoir,
}: {
  type: TypeRecherche;
  items: Ligne[];
  plus: boolean;
  onToutVoir?: () => void;
}) {
  return (
    <section aria-labelledby={`g-${type}`} className="space-y-2">
      <div className="flex items-center justify-between">
        <h2
          id={`g-${type}`}
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {LIBELLES_RECHERCHE[type]} · {items.length}
          {plus ? '+' : ''}
        </h2>
        {onToutVoir && plus && (
          <button
            type="button"
            onClick={onToutVoir}
            className="text-xs font-medium text-primary hover:underline"
          >
            Tout voir
          </button>
        )}
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((l) => {
          const contenu = (
            <>
              <span className="block text-sm font-medium text-foreground">
                {l.titre}
              </span>
              {l.detail && (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {l.detail}
                </span>
              )}
            </>
          );
          return (
            <li key={l.cle}>
              {l.href ? (
                <Link href={l.href} className="block px-4 py-3 hover:bg-muted">
                  {contenu}
                </Link>
              ) : (
                <div className="px-4 py-3">{contenu}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Recherche transverse (WEB-FID-Recherche). */
export function Recherche() {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [saisie, setSaisie] = useState(initial);
  const [terme, setTerme] = useState(initial);
  const [filtre, setFiltre] = useState<'' | TypeRecherche>('');

  useEffect(() => {
    const t = setTimeout(() => setTerme(saisie), 300);
    return () => clearTimeout(t);
  }, [saisie]);

  const { data, isLoading, isError, refetch } = useRecherche(
    terme,
    filtre || undefined,
  );

  const types = filtre ? [filtre] : TYPES_RECHERCHE;
  const groupes = data
    ? types
        .map((t) => ({
          type: t,
          items: lignes(data.results, t),
          plus: data.results[t]?.next_offset != null,
        }))
        .filter((g) => g.items.length > 0)
    : [];
  const total = groupes.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setTerme(saisie);
          router.replace(
            paths.app.recherche.getHref(saisie.trim() || undefined),
          );
        }}
        className="relative"
      >
        <label htmlFor={id} className="sr-only">
          Rechercher
        </label>
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          placeholder="Un verset, une paroisse, une annonce, un prêtre, un chant…"
          className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
        />
      </form>

      {terme.trim().length >= 2 && (
        <FilterPills
          options={[
            { value: '', label: 'Tout' },
            ...TYPES_RECHERCHE.map((t) => ({
              value: t,
              label: LIBELLES_RECHERCHE[t],
            })),
          ]}
          value={filtre}
          onChange={(v) => setFiltre(v as '' | TypeRecherche)}
          ariaLabel="Filtrer les résultats"
        />
      )}

      {terme.trim().length < 2 ? (
        <EmptyState
          icon={<Search />}
          title="Rechercher dans Jàngu Bi"
          description="La Bible, les paroisses, les annonces, les prêtres et l’écoute. Deux lettres au moins."
        />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Aucun résultat"
          description={`Rien ne correspond à « ${terme.trim()} ». Essayez un autre mot.`}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            {total} résultat{total > 1 ? 's' : ''} pour « {terme.trim()} »
          </p>
          {groupes.map((g) => (
            <Groupe
              key={g.type}
              type={g.type}
              items={g.items}
              plus={g.plus}
              onToutVoir={filtre ? undefined : () => setFiltre(g.type)}
            />
          ))}
        </>
      )}
    </div>
  );
}
