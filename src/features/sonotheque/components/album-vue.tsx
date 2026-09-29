'use client';

import { Pause, Shuffle } from 'lucide-react';
import NextLink from 'next/link';

import { AjouterCetteParoisse } from '@/components/paroisses/ajouter-cette-paroisse';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
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
  // Pas de suggestions pour un album verrouillé (rien d'écoutable ici).
  const premiere =
    (data?.album.verrouille ? null : data?.tracks.find((t) => !t.verrouille))
      ?.id ?? '';
  const ensuite = useEnsuite(premiere);
  const { playTracks, togglePause, currentTrackId, isPlaying } =
    usePlayTracks();

  if (isLoading) return <LoadingBlock />;
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
  // Décision 4 : un non-membre voit l'album et ses pistes, verrouillés.
  const verrouille = album.verrouille;
  const paroisseRequise = data.paroisse_requise;
  const jouables = tracks.filter((t) => !t.verrouille);
  const duree = tracks.reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  const langues = [...new Set(tracks.map((t) => t.language).filter(Boolean))];
  const annee = (album.recorded_on ?? album.published_at ?? '').slice(0, 4);
  const lectureEnCours = tracks.some((t) => t.id === currentTrackId);
  const paroisse =
    paroisseRequise?.name ?? source.data?.source.node?.name ?? null;
  const autres = (source.data?.albums ?? [])
    .filter((a) => a.id !== album.id && (!verrouille || !a.verrouille))
    .slice(0, 2);
  const suite = (ensuite.data ?? []).slice(0, 3);

  return (
    <div>
      <nav aria-label="Fil d’Ariane" className="mb-6 text-14 text-ink-3">
        <NextLink
          href={paths.app.ecouter.root.getHref()}
          className="hover:text-ink"
        >
          Écouter
        </NextLink>
        <span aria-hidden> › </span>
        <NextLink
          href={paths.app.ecouter.source.getHref(album.source.id)}
          className="hover:text-ink"
        >
          {album.source.name}
        </NextLink>
      </nav>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Pochette
          titre={album.title}
          genre={album.kind}
          temps={album.liturgical_season}
          imageUrl={album.cover_url}
          className="size-44 rounded-16 shadow-menu md:size-56"
          monoClassName="text-48"
        />
        <div className="min-w-0">
          <p className="text-14 font-semibold text-ink-3">
            {LIBELLES_ALBUM[album.kind]}
            {annee ? ` · ${annee}` : ''}
          </p>
          <h1 className="mt-1 text-32 font-semibold text-ink">{album.title}</h1>
          <p className="mt-2 text-ink-3">
            <NextLink
              href={paths.app.ecouter.source.getHref(album.source.id)}
              className="font-semibold text-ink hover:text-primary"
            >
              {album.source.name}
            </NextLink>
            {paroisse ? ` · ${paroisse}` : ''} ·{' '}
            {pluriel(tracks.length, 'piste', 'pistes')}
            {duree > 0 ? ` · ${formatDureeTotale(duree)}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {langues.map((l) => (
              <abbr
                key={l}
                title={LIBELLES_LANGUE[l] ?? l}
                className="rounded border border-line px-1.5 py-0.5 text-11 font-semibold text-ink-3 no-underline"
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
          {verrouille ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {paroisseRequise && (
                <AjouterCetteParoisse
                  paroisse={paroisseRequise}
                  className="rounded-full px-6"
                  onAjoutee={() => void refetch()}
                />
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                className="rounded-full px-6"
                disabled={!jouables.length}
                onClick={() =>
                  lectureEnCours ? togglePause() : playTracks(jouables, 0)
                }
              >
                {lectureEnCours && isPlaying ? (
                  <Pause className="size-4" aria-hidden />
                ) : (
                  <Icon name="lecture" className="size-4 fill-current" aria-hidden />
                )}
                {lectureEnCours && isPlaying ? 'Pause' : 'Lire'}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={jouables.length < 2}
                onClick={() => playTracks(melanger(jouables), 0)}
              >
                <Shuffle className="size-4" aria-hidden />
                Aléatoire
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Reveal appear>
          {verrouille && (
            <section
              aria-labelledby="album-reserve"
              className="mb-4 flex items-start gap-3 rounded-16 border border-line bg-surface-2 p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper text-ink-3">
                <Icon name="cadenas" className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <h2
                  id="album-reserve"
                  className="text-15 font-semibold text-ink"
                >
                  {paroisse
                    ? `Réservé aux paroissiens de ${paroisse}`
                    : 'Réservé aux paroissiens'}
                </h2>
                <p className="mt-1 text-14 leading-relaxed text-ink-3">
                  {paroisseRequise
                    ? `Vous voyez la liste des pistes, mais vous ne pouvez pas encore les écouter. Ajoutez ${paroisseRequise.name} à vos paroisses pour écouter cet album et le télécharger. Votre paroisse principale ne change pas.`
                    : 'Vous voyez la liste des pistes, mais leur écoute est réservée aux paroissiens.'}
                </p>
              </span>
            </section>
          )}
          {tracks.length ? (
            <ListePistes pistes={tracks} titre={`Pistes de ${album.title}`} />
          ) : (
            <p className="text-14 text-ink-3">
              Les pistes de cet album seront bientôt disponibles.
            </p>
          )}
        </Reveal>

        <aside className="space-y-8">
          <section className="rounded-16 border border-line bg-surface p-5">
            <h2 className="text-18 font-semibold">À propos de cet album</h2>
            {album.description && (
              <p className="mt-2 text-14 leading-relaxed text-ink-3">
                {album.description}
              </p>
            )}
            <dl className="mt-4 space-y-2 text-14">
              {album.published_at && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Publié le</dt>
                  <dd className="text-right font-medium">
                    {formatDateLongue(album.published_at)}
                  </dd>
                </div>
              )}
              {album.recorded_on && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Enregistré le</dt>
                  <dd className="text-right font-medium">
                    {formatDateLongue(album.recorded_on)}
                  </dd>
                </div>
              )}
              {album.visibility === 'paroisse' && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Visibilité</dt>
                  <dd className="text-right font-medium">
                    {paroisse ? `Paroissiens de ${paroisse}` : 'Paroissiens'}
                  </dd>
                </div>
              )}
              {album.liturgical_season && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Temps</dt>
                  <dd className="text-right font-medium">
                    {LIBELLES_TEMPS[album.liturgical_season] ??
                      album.liturgical_season}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">Droits</dt>
                <dd className="text-right font-medium">
                  Diffusion confirmée par {album.source.name}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              <SignalerDialog pistes={tracks} album={album} />
            </div>
          </section>

          {suite.length > 0 && (
            <section>
              <h2 className="mb-3 text-18 font-semibold">À écouter ensuite</h2>
              <div className="divide-y divide-line overflow-hidden rounded-16 border border-line bg-surface">
                {suite.map((t, i) => (
                  <LignePiste
                    key={t.id}
                    pistes={suite}
                    index={i}
                    className="px-3"
                  />
                ))}
              </div>
              <p className="mt-2 text-13 text-ink-3">
                Enregistrements souvent écoutés à la suite de cet album.
              </p>
            </section>
          )}

          {autres.length > 0 && (
            <section>
              <h2 className="mb-3 text-18 font-semibold">
                {verrouille
                  ? 'En accès libre, même source'
                  : 'De la même source'}
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
