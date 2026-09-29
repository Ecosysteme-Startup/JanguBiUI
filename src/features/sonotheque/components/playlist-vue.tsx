'use client';

import { Play } from 'lucide-react';
import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';

import { usePlaylist } from '../api/get-playlist';
import { usePlayTracks } from '../play';
import { estIntrouvable } from '../utils/erreurs';
import { formatDureeTotale, pluriel } from '../utils/format';

import { ListePistes } from './liste-pistes';
import { Pochette } from './pochette';
import { ReserveParoissiens } from './reserve-paroissiens';
import { VisibiliteBadge } from './visibilite-badge';

export function PlaylistVue({ playlistId }: { playlistId: string }) {
  const { data, isLoading, error, refetch } = usePlaylist(playlistId);
  const { playTracks } = usePlayTracks();

  if (isLoading) return <LoadingBlock />;
  if (error) {
    return estIntrouvable(error) ? (
      <ReserveParoissiens objet="Cette playlist" />
    ) : (
      <ErrorState
        description="La playlist n’a pas pu être chargée."
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return null;
  const { playlist, tracks } = data;
  const duree = tracks.reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  const nbSources = new Set(tracks.map((t) => t.source.id)).size;

  return (
    <div>
      <nav aria-label="Fil d’Ariane" className="mb-6 text-14 text-ink-3">
        <NextLink
          href={paths.app.ecouter.root.getHref()}
          className="hover:text-ink"
        >
          Écouter
        </NextLink>
        {playlist.source && (
          <>
            <span aria-hidden> › </span>
            <NextLink
              href={paths.app.ecouter.source.getHref(playlist.source.id)}
              className="hover:text-ink"
            >
              {playlist.source.name}
            </NextLink>
          </>
        )}
      </nav>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Pochette
          titre={playlist.title}
          genre="playlist"
          className="size-44 rounded-16 shadow-menu"
          monoClassName="text-48"
        />
        <div className="min-w-0">
          <p className="text-14 font-semibold text-ink-3">
            {playlist.is_editorial ? 'Playlist de la paroisse' : 'Ma playlist'}
          </p>
          <h1 className="mt-1 text-32 font-semibold text-ink">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="mt-2 text-ink-3">{playlist.description}</p>
          )}
          <p className="mt-2 text-14 text-ink-3">
            {pluriel(tracks.length, 'titre', 'titres')}
            {duree > 0 ? ` · ${formatDureeTotale(duree)}` : ''}
            {nbSources > 1 ? ` · ${nbSources} sources` : ''}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full px-6"
              disabled={!tracks.length}
              onClick={() => playTracks(tracks, 0)}
            >
              <Play className="size-4 fill-current" aria-hidden />
              Lire
            </Button>
            <VisibiliteBadge visibilite={playlist.visibility} long />
          </div>
        </div>
      </header>
      <Reveal appear className="mt-8">
        {tracks.length ? (
          <ListePistes
            pistes={tracks}
            titre={`Titres de ${playlist.title}`}
            avecSource
          />
        ) : (
          <p className="text-14 text-ink-3">
            Cette playlist est vide pour l’instant.
          </p>
        )}
      </Reveal>
    </div>
  );
}
