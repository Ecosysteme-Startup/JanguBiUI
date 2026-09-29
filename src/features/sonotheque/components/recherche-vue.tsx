'use client';

import { SearchX } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { Reveal } from '@/lib/motion/reveal';

import { RECHERCHE_MIN, useSearchAudio } from '../api/search-audio';
import { LIBELLES_LANGUE, LIBELLES_TEMPS } from '../utils/format';

import { ListePistes } from './liste-pistes';
import { RechercheChamp } from './recherche-champ';

const selectCls =
  'h-9 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function RechercheVue({ qInitiale }: { qInitiale?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(qInitiale ?? params?.get('q') ?? '');
  const [langue, setLangue] = useState('');
  const [temps, setTemps] = useState('');
  useRegisterPageMeta({ title: 'Recherche', showHeading: false });

  const recherche = useSearchAudio(q);
  const tous = useMemo(
    () => recherche.data?.pages.flatMap((p) => p.results) ?? [],
    [recherche.data],
  );
  const resultats = tous.filter(
    (t) =>
      (!langue || t.language === langue) &&
      (!temps || t.liturgical_season === temps),
  );
  const filtres = !!(langue || temps);
  const tropCourt = q.trim().length < RECHERCHE_MIN;

  const soumettre = (v: string) => {
    setQ(v);
    router.replace(`${pathname ?? ''}?q=${encodeURIComponent(v)}`);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Rechercher
      </h1>
      <RechercheChamp
        key={q}
        valeurInitiale={q}
        onSubmit={soumettre}
        className="mt-4 max-w-xl"
      />

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtres"
      >
        <select
          aria-label="Langue"
          className={selectCls}
          value={langue}
          onChange={(e) => setLangue(e.target.value)}
        >
          <option value="">Toutes les langues</option>
          {Object.entries(LIBELLES_LANGUE).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Temps liturgique"
          className={selectCls}
          value={temps}
          onChange={(e) => setTemps(e.target.value)}
        >
          <option value="">Tout le temps liturgique</option>
          {Object.entries(LIBELLES_TEMPS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {tropCourt ? (
          <p className="text-sm text-muted-foreground">
            Saisissez au moins deux lettres : un titre, une chorale, un
            compositeur, une langue ou un temps liturgique.
          </p>
        ) : recherche.isLoading ? (
          <SkeletonList count={6} />
        ) : recherche.isError ? (
          <ErrorState
            description="La recherche n’a pas abouti."
            onRetry={() => void recherche.refetch()}
          />
        ) : resultats.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={`Aucun résultat pour « ${q.trim()} »`}
            description={
              <>
                La recherche porte sur les titres, les sources, les albums, les
                interprètes et les descriptions, parmi les enregistrements que
                vous avez le droit d’écouter.
                {filtres &&
                  tous.length > 0 &&
                  ` ${tous.length} résultat${tous.length > 1 ? 's' : ''} sans les filtres.`}
              </>
            }
            action={
              filtres ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLangue('');
                    setTemps('');
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Reveal appear>
            <p
              className="mb-3 text-sm text-muted-foreground"
              aria-live="polite"
            >
              {resultats.length} résultat{resultats.length > 1 ? 's' : ''}
              {recherche.hasNextPage ? ' (et d’autres)' : ''}
            </p>
            <ListePistes
              pistes={resultats}
              titre="Résultats de la recherche"
              avecSource
            />
            {recherche.hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  isLoading={recherche.isFetchingNextPage}
                  onClick={() => void recherche.fetchNextPage()}
                >
                  Afficher plus de résultats
                </Button>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </div>
  );
}
