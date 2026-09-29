'use client';

import { Play } from 'lucide-react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Link } from '@/components/ui/link';
import { SkeletonList } from '@/components/ui/skeleton';
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
  useRegisterPageMeta({
    title: 'Écouter',
    leafLabel: data?.playlist.title ?? 'Playlist',
    showHeading: false,
  });

  if (isLoading) return <SkeletonList count={6} />;
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
      <nav
        aria-label="Fil d’Ariane"
        className="mb-6 text-sm text-muted-foreground"
      >
        <Link
          href={paths.app.ecouter.root.getHref()}
          className="hover:text-foreground"
        >
          Écouter
        </Link>
        {playlist.source && (
          <>
            <span aria-hidden> › </span>
            <Link
              href={paths.app.ecouter.source.getHref(playlist.source.id)}
              className="hover:text-foreground"
            >
              {playlist.source.name}
            </Link>
          </>
        )}
      </nav>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Pochette
          titre={playlist.title}
          genre="playlist"
          className="size-44 rounded-2xl shadow-soft-lg"
          monoClassName="text-5xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {playlist.is_editorial ? 'Playlist de la paroisse' : 'Ma playlist'}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="mt-2 text-muted-foreground">{playlist.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {pluriel(tracks.length, 'titre', 'titres')}
            {duree > 0 ? ` · ${formatDureeTotale(duree)}` : ''}
            {nbSources > 1 ? ` · ${nbSources} sources` : ''}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full px-6"
              disabled={!tracks.length}
              onClick={() => playTracks(tracks, 0)}
              icon={<Play className="size-4 fill-current" aria-hidden />}
            >
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
          <p className="text-sm text-muted-foreground">
            Cette playlist est vide pour l’instant.
          </p>
        )}
      </Reveal>
    </div>
  );
}
