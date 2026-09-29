'use client';

import { Shuffle } from 'lucide-react';
import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

import { useSource } from '../api/get-source';
import { usePlayTracks } from '../play';
import { estIntrouvable } from '../utils/erreurs';
import { formatDateCourte, LIBELLES_SOURCE } from '../utils/format';

import { CarteAlbum } from './carte-album';
import { CartePlaylist } from './carte-playlist';
import { LignePiste } from './ligne-piste';
import { Pochette } from './pochette';
import { ReserveParoissiens } from './reserve-paroissiens';
import { SignalerDialog } from './signaler-dialog';

export function SourceVue({ sourceId }: { sourceId: string }) {
  const { data, isLoading, error, refetch } = useSource(sourceId);
  const { playTracks } = usePlayTracks();

  if (isLoading) return <LoadingBlock />;
  if (error) {
    return estIntrouvable(error) ? (
      <ReserveParoissiens objet="Cette source" />
    ) : (
      <ErrorState
        description="La page n’a pas pu être chargée."
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return null;
  const { source, albums, playlists, recent, most_played: plusEcoutes } = data;
  const aEcouter = recent.length ? recent : plusEcoutes;

  return (
    <div>
      <nav aria-label="Fil d’Ariane" className="mb-6 text-14 text-ink-3">
        <NextLink
          href={paths.app.ecouter.root.getHref()}
          className="hover:text-ink"
        >
          Écouter
        </NextLink>
      </nav>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Pochette
          titre={source.name}
          genre={source.kind}
          imageUrl={source.cover_url}
          className="size-32 rounded-full"
          monoClassName="text-36"
        />
        <div className="min-w-0">
          <p className="text-14 font-semibold text-ink-3">
            {LIBELLES_SOURCE[source.kind]}
            {source.node ? ` · ${source.node.name}` : ''}
          </p>
          <h1 className="mt-1 text-32 font-semibold text-ink">{source.name}</h1>
          {source.description && (
            <p className="mt-2 max-w-2xl text-ink-3">{source.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button
              className="rounded-full px-6"
              disabled={!aEcouter.length}
              onClick={() =>
                playTracks(
                  [...aEcouter].sort(() => Math.random() - 0.5),
                  0,
                )
              }
            >
              <Shuffle className="size-4" aria-hidden />
              Écouter
            </Button>
            <SignalerDialog
              pistes={[
                ...recent,
                ...plusEcoutes.filter(
                  (t) => !recent.some((r) => r.id === t.id),
                ),
              ]}
            />
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="mb-4 text-22 font-semibold">Albums</h2>
            {albums.length ? (
              <Stagger appear className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {albums.map((a) => (
                  <StaggerItem key={a.id}>
                    <CarteAlbum
                      album={a}
                      sousTitre={formatDateCourte(
                        a.recorded_on ?? a.published_at,
                      )}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <p className="text-14 text-ink-3">
                Aucun album publié pour l’instant.
              </p>
            )}
          </section>
          {playlists.length > 0 && (
            <Reveal>
              <section>
                <h2 className="mb-4 text-22 font-semibold">Playlists</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {playlists.map((p) => (
                    <CartePlaylist key={p.id} playlist={p} />
                  ))}
                </div>
              </section>
            </Reveal>
          )}
          {recent.length > 0 && (
            <Reveal>
              <section>
                <h2 className="mb-4 text-22 font-semibold">
                  Derniers enregistrements
                </h2>
                <div className="divide-y divide-line overflow-hidden rounded-16 border border-line bg-surface">
                  {recent.slice(0, 6).map((t, i) => (
                    <LignePiste
                      key={t.id}
                      pistes={recent}
                      index={i}
                      sousTitre={t.album?.title ?? source.name}
                    />
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        {plusEcoutes.length > 0 && (
          <aside>
            <h2 className="text-18 font-semibold">
              Les plus écoutés de {source.name}
            </h2>
            <p className="mb-3 mt-0.5 text-13 text-ink-3">
              À l’intérieur de cette source seulement, jamais comparés à
              d’autres.
            </p>
            <ol className="divide-y divide-line overflow-hidden rounded-16 border border-line bg-surface">
              {plusEcoutes.slice(0, 5).map((t, i) => (
                <li key={t.id} className="flex items-center">
                  <span className="w-8 shrink-0 pl-3 text-14 tabular-nums text-ink-3">
                    {i + 1}
                  </span>
                  <LignePiste
                    pistes={plusEcoutes}
                    index={i}
                    className="min-w-0 flex-1 pl-1"
                    sousTitre={t.album?.title}
                  />
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
