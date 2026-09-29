'use client';

import { Pause, Play, Shuffle } from 'lucide-react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Link } from '@/components/ui/link';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';

import { useAlbum } from '../api/get-album';
import { useEnsuite } from '../api/get-ensuite';
import { useSource } from '../api/get-source';
import { usePlayTracks } from '../play';
import { estIntrouvable } from '../utils/erreurs';
import {
  codeLangue,
  formatDateLongue,
  formatDureeTotale,
  LIBELLES_ALBUM,
  LIBELLES_LANGUE,
  LIBELLES_TEMPS,
  pluriel,
} from '../utils/format';

import { CarteAlbum } from './carte-album';
import { LignePiste } from './ligne-piste';
import { ListePistes } from './liste-pistes';
import { Pochette } from './pochette';
import { ReserveParoissiens } from './reserve-paroissiens';
import { SignalerDialog } from './signaler-dialog';
import { VisibiliteBadge } from './visibilite-badge';

const melanger = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function AlbumVue({ albumId }: { albumId: string }) {
  const { data, isLoading, error, refetch } = useAlbum(albumId);
  const sourceId = data?.album.source.id ?? '';
  const source = useSource(sourceId);
  const premiere = data?.tracks[0]?.id ?? '';
  const ensuite = useEnsuite(premiere);
  const { playTracks, togglePause, currentTrackId, isPlaying } =
    usePlayTracks();
  useRegisterPageMeta({
    title: 'Écouter',
    leafLabel: data?.album.title ?? 'Album',
    showHeading: false,
  });

  if (isLoading) return <SkeletonList count={8} />;
  if (error) {
    return estIntrouvable(error) ? (
      <ReserveParoissiens objet="Cet album" />
    ) : (
      <ErrorState
        description="L’album n’a pas pu être chargé."
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return null;

  const { album, tracks } = data;
  const duree = tracks.reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  const langues = [...new Set(tracks.map((t) => t.language).filter(Boolean))];
  const annee = (album.recorded_on ?? album.published_at ?? '').slice(0, 4);
  const lectureEnCours = tracks.some((t) => t.id === currentTrackId);
  const paroisse = source.data?.source.node?.name ?? null;
  const autres = (source.data?.albums ?? [])
    .filter((a) => a.id !== album.id)
    .slice(0, 2);
  const suite = (ensuite.data ?? []).slice(0, 3);

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
        <span aria-hidden> › </span>
        <Link
          href={paths.app.ecouter.source.getHref(album.source.id)}
          className="hover:text-foreground"
        >
          {album.source.name}
        </Link>
      </nav>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Pochette
          titre={album.title}
          genre={album.kind}
          temps={album.liturgical_season}
          imageUrl={album.cover_url}
          className="size-44 rounded-2xl shadow-soft-lg md:size-56"
          monoClassName="text-5xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {LIBELLES_ALBUM[album.kind]}
            {annee ? ` · ${annee}` : ''}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {album.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            <Link
              href={paths.app.ecouter.source.getHref(album.source.id)}
              className="font-semibold text-foreground hover:text-primary"
            >
              {album.source.name}
            </Link>
            {paroisse ? ` · ${paroisse}` : ''} ·{' '}
            {pluriel(tracks.length, 'piste', 'pistes')}
            {duree > 0 ? ` · ${formatDureeTotale(duree)}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {langues.map((l) => (
              <abbr
                key={l}
                title={LIBELLES_LANGUE[l] ?? l}
                className="rounded border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground no-underline"
              >
                {codeLangue(l)}
              </abbr>
            ))}
            <VisibiliteBadge
              visibilite={album.visibility}
              paroisse={paroisse}
              long
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="rounded-full px-6"
              disabled={!tracks.length}
              onClick={() =>
                lectureEnCours ? togglePause() : playTracks(tracks, 0)
              }
              icon={
                lectureEnCours && isPlaying ? (
                  <Pause className="size-4" aria-hidden />
                ) : (
                  <Play className="size-4 fill-current" aria-hidden />
                )
              }
            >
              {lectureEnCours && isPlaying ? 'Pause' : 'Lire'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={tracks.length < 2}
              onClick={() => playTracks(melanger(tracks), 0)}
              icon={<Shuffle className="size-4" aria-hidden />}
            >
              Aléatoire
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Reveal appear>
          {tracks.length ? (
            <ListePistes pistes={tracks} titre={`Pistes de ${album.title}`} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Les pistes de cet album seront bientôt disponibles.
            </p>
          )}
        </Reveal>

        <aside className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">
              À propos de cet album
            </h2>
            {album.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {album.description}
              </p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {album.published_at && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Publié le</dt>
                  <dd className="text-right font-medium">
                    {formatDateLongue(album.published_at)}
                  </dd>
                </div>
              )}
              {album.recorded_on && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Enregistré le</dt>
                  <dd className="text-right font-medium">
                    {formatDateLongue(album.recorded_on)}
                  </dd>
                </div>
              )}
              {album.liturgical_season && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Temps</dt>
                  <dd className="text-right font-medium">
                    {LIBELLES_TEMPS[album.liturgical_season] ??
                      album.liturgical_season}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Droits</dt>
                <dd className="text-right font-medium">
                  Diffusion confirmée par {album.source.name}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <SignalerDialog pistes={tracks} />
            </div>
          </section>

          {suite.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold">
                À écouter ensuite
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {suite.map((t, i) => (
                  <LignePiste
                    key={t.id}
                    pistes={suite}
                    index={i}
                    className="px-3"
                  />
                ))}
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Enregistrements souvent écoutés à la suite de cet album.
              </p>
            </section>
          )}

          {autres.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold">
                De la même source
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {autres.map((a) => (
                  <CarteAlbum
                    key={a.id}
                    album={a}
                    sousTitre={formatDateLongue(a.published_at)}
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
