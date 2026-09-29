'use client';

import { Laptop, Library, Play, Smartphone, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Link } from '@/components/ui/link';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { PressScale } from '@/lib/motion/press-scale';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

import { useAccueil } from '../api/get-accueil';
import { useAlbums } from '../api/get-albums';
import { useReglages, useSetRecommandations } from '../api/get-pour-vous';
import { useSources } from '../api/get-sources';
import { usePlayTracks } from '../play';
import type {
  Accueil,
  Album,
  AlbumKind,
  Playlist,
  Recent,
  Track,
} from '../types/schemas';
import {
  formatDuree,
  formatMisAJour,
  formatRestant,
  pluriel,
} from '../utils/format';

import { CarteAlbum } from './carte-album';
import { CarteSource } from './carte-source';
import { LignePiste } from './ligne-piste';
import { Pochette } from './pochette';
import { RechercheChamp } from './recherche-champ';

// Accueil « Écouter » (maquette WEB-FID-Ecouter) sur `GET audio/accueil/` :
// reprendre, nouveautés de ma paroisse, pour vous, playlists de la paroisse,
// temps liturgique, puis les sources par ordre alphabétique.

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Tout' },
  { value: 'messe', label: 'Messes' },
  { value: 'homelies', label: 'Homélies' },
  { value: 'album', label: 'Chants' },
  { value: 'retraite', label: 'Enseignements' },
  { value: 'playlists', label: 'Playlists' },
];

/** Couleur liturgique du temps (pastille de la carte « Temps liturgique »). */
const COULEURS_TEMPS: Record<string, string> = {
  ordinaire: '#2E6B3F',
  avent: '#5B3A7E',
  careme: '#5B3A7E',
  noel: '#B8962E',
  paques: '#B8962E',
  triduum: '#8E2430',
};

const memeJour = (iso: string | null, now = new Date()) =>
  !!iso && new Date(iso).toDateString() === now.toDateString();

function Section({
  titre,
  action,
  children,
}: {
  titre: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[22px] font-semibold leading-7 text-foreground">
          {titre}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CarteReprise({ recent }: { recent: Recent }) {
  const { playTracks } = usePlayTracks();
  const t = recent.track;
  const duree = t.duration_seconds ?? 0;
  const part =
    duree > 0
      ? Math.min(100, Math.round((recent.position_seconds / duree) * 100))
      : 0;
  const restant = formatRestant(recent.position_seconds, t.duration_seconds);
  const surOrdinateur = !recent.device_id || recent.device_id.startsWith('web');
  const Appareil = surOrdinateur ? Laptop : Smartphone;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft-sm">
      <Pochette
        titre={t.album?.title ?? t.source.name}
        genre={t.album?.kind ?? t.source.kind}
        temps={t.liturgical_season}
        className="size-[72px] rounded-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{t.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {t.album?.title ?? t.source.name}
          {restant ? ` · ${restant}` : ''}
        </p>
        <div
          role="progressbar"
          aria-label={`Écouté à ${part} %`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={part}
          className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="size-full origin-left bg-primary"
            style={{ transform: `scaleX(${part / 100})` }}
          />
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Appareil className="size-3.5" aria-hidden />
          {surOrdinateur
            ? 'Sur cet ordinateur'
            : 'Commencé sur votre téléphone'}
          ,{' '}
          {formatMisAJour(recent.updated_at).replace(
            'Aujourd’hui',
            'aujourd’hui',
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => playTracks([t])}
        aria-label={`Reprendre ${t.title}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15 active:scale-[0.97] motion-reduce:transform-none"
      >
        <Play className="size-5 fill-current" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Les nouveautés arrivent piste par piste : on les regroupe par album (une
 * carte par album, la plus récente d'abord). Une piste hors album garde sa
 * propre carte, qui mène à sa source.
 */
type Nouveaute = { cle: string; album: Album; pistes: Track[]; href: string };

export function regrouperNouveautes(pistes: Track[]): Nouveaute[] {
  const groupes = new Map<string, Nouveaute>();
  for (const t of pistes) {
    const cle = t.album ? `album:${t.album.id}` : `piste:${t.id}`;
    const g = groupes.get(cle);
    if (g) {
      g.pistes.push(t);
      continue;
    }
    groupes.set(cle, {
      cle,
      pistes: [t],
      href: t.album
        ? paths.app.ecouter.album.getHref(t.album.id)
        : paths.app.ecouter.source.getHref(t.source.id),
      album: {
        id: t.album?.id ?? t.id,
        source: t.source,
        kind: t.album?.kind ?? 'album',
        title: t.album?.title ?? t.title,
        description: '',
        visibility: t.visibility,
        cover_url: null,
        recorded_on: null,
        liturgical_season: t.liturgical_season,
        published_at: t.published_at,
        verrouille: t.verrouille,
      },
    });
  }
  return [...groupes.values()];
}

const dateCourte = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

function CarteNouveaute({ n }: { n: Nouveaute }) {
  const date = n.album.published_at;
  const detail =
    n.pistes.length > 1
      ? pluriel(n.pistes.length, 'nouvelle', 'nouvelles')
      : date && !memeJour(date)
        ? dateCourte.format(new Date(date))
        : null;
  const badge = memeJour(date) ? (
    <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
      Aujourd’hui
    </span>
  ) : undefined;
  const sousTitre = `${n.album.source.name}${detail ? ` · ${detail}` : ''}`;
  if (n.cle.startsWith('album:'))
    return <CarteAlbum album={n.album} sousTitre={sousTitre} badge={badge} />;
  return (
    <PressScale lift className="min-w-0">
      <Link
        href={n.href}
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-foreground hover:border-primary/40"
      >
        <Pochette
          titre={n.album.title}
          genre={n.album.source.kind}
          temps={n.album.liturgical_season}
          className="aspect-square w-full rounded-xl"
          monoClassName="text-3xl"
        />
        <span className="flex min-w-0 flex-col px-0.5 pb-0.5">
          <span className="line-clamp-2 font-semibold leading-snug">
            {n.album.title}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {sousTitre}
          </span>
          {badge && <span className="mt-2 flex">{badge}</span>}
        </span>
      </Link>
    </PressScale>
  );
}

function GrilleCartes({ children }: { children: React.ReactNode }) {
  return (
    <Stagger appear className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {children}
    </Stagger>
  );
}

function SqueletteGrille() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function NouveautesParoisse({ accueil }: { accueil: Accueil }) {
  const cartes = regrouperNouveautes(accueil.nouveautes_ma_paroisse).slice(
    0,
    4,
  );
  if (!accueil.paroisse)
    return (
      <EmptyState
        title="Suivez votre paroisse"
        description="Choisissez la paroisse que vous fréquentez pour retrouver ici ses messes, homélies et chants dès leur publication."
      />
    );
  if (!cartes.length)
    return (
      <EmptyState
        title="Rien de neuf pour l’instant"
        description={`Les prochains enregistrements de ${accueil.paroisse.name} apparaîtront ici.`}
      />
    );
  return (
    <GrilleCartes>
      {cartes.map((n) => (
        <StaggerItem key={n.cle}>
          <CarteNouveaute n={n} />
        </StaggerItem>
      ))}
    </GrilleCartes>
  );
}

/** Albums d'un type (filtre « Messes », « Homélies »…), les plus récents. */
function AlbumsDuType({ kind }: { kind: AlbumKind }) {
  const albums = useAlbums({ kind });
  const liste = [...(albums.data ?? [])]
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, 8);
  if (albums.isLoading) return <SqueletteGrille />;
  if (!liste.length)
    return (
      <EmptyState
        title="Rien pour l’instant"
        description="Aucun enregistrement de ce type n’est encore publié."
      />
    );
  return (
    <GrilleCartes>
      {liste.map((a) => (
        <StaggerItem key={a.id}>
          <CarteAlbum
            album={a}
            badge={
              memeJour(a.published_at) ? (
                <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                  Aujourd’hui
                </span>
              ) : undefined
            }
          />
        </StaggerItem>
      ))}
    </GrilleCartes>
  );
}

function PourVousBloc({ suggestions }: { suggestions: Accueil['pour_vous'] }) {
  const reglages = useReglages();
  const reglage = useSetRecommandations();
  const liste = suggestions.slice(0, 4);
  const pistes = liste.map((s) => s.track);
  const personnalise = reglages.data?.recommendations_enabled ?? true;
  return (
    <>
      {liste.length > 0 ? (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm">
          {liste.map((s, i) => (
            <LignePiste
              key={s.track.id}
              pistes={pistes}
              index={i}
              raison={
                <span className="inline-flex items-start gap-1.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {s.reason}
                </span>
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pas encore de suggestion : elles viendront avec vos premières écoutes.
        </p>
      )}
      {reglages.data && (
        <p className="mt-3 text-[13px] text-muted-foreground">
          {personnalise
            ? 'Suggestions établies à partir de vos écoutes dans Jàngu Bi, jamais à partir de vos demandes, dons ou messages.'
            : 'Suggestions non personnalisées : nouveautés de votre paroisse et temps liturgique.'}{' '}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            disabled={reglage.isPending}
            onClick={() => reglage.mutate(!personnalise)}
          >
            {personnalise ? 'Les désactiver' : 'Les réactiver'}
          </button>
        </p>
      )}
    </>
  );
}

function CartePlaylistParoisse({ playlist }: { playlist: Playlist }) {
  return (
    <PressScale lift className="min-w-0">
      <Link
        href={paths.app.ecouter.playlist.getHref(playlist.id)}
        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3.5 text-foreground hover:border-primary/40"
      >
        <Pochette
          titre={playlist.title}
          genre="playlist"
          className="size-24 rounded-xl"
          monoClassName="text-2xl"
        />
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold leading-snug">{playlist.title}</span>
          <span className="text-sm text-muted-foreground">
            {pluriel(playlist.track_count, 'titre', 'titres')}
            {playlist.source ? ` · ${playlist.source.name}` : ''}
          </span>
          {playlist.description && (
            <span className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
              {playlist.description}
            </span>
          )}
        </span>
      </Link>
    </PressScale>
  );
}

function PlaylistsParoisse({ playlists }: { playlists: Playlist[] }) {
  if (!playlists.length)
    return (
      <p className="text-sm text-muted-foreground">
        Votre paroisse n’a pas encore proposé de playlist.
      </p>
    );
  return (
    <Stagger appear className="grid gap-4 sm:grid-cols-2">
      {playlists.map((p) => (
        <StaggerItem key={p.id}>
          <CartePlaylistParoisse playlist={p} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function TempsLiturgique({
  temps,
}: {
  temps: NonNullable<Accueil['temps_liturgique']>;
}) {
  const { playTracks } = usePlayTracks();
  const pistes = temps.tracks.slice(0, 4);
  return (
    <div className="rounded-2xl border border-border bg-background-surface p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="size-2.5 rounded-full"
          style={{ background: COULEURS_TEMPS[temps.code] ?? '#2E6B3F' }}
        />
        Temps liturgique du jour
      </p>
      <p className="mt-2 text-[19px] font-semibold leading-[26px] text-foreground">
        {temps.label}
      </p>
      <p className="mt-1.5 text-[15px] leading-[22px] text-muted-foreground">
        Chants, homélies et enseignements de ce temps, pour prier seul ou en
        famille.
      </p>
      {pistes.length > 0 ? (
        <ul
          className="mt-3.5"
          aria-label={`Pour le ${temps.label.toLowerCase()}`}
        >
          {pistes.map((t, i) => (
            <li key={t.id} className="border-t border-border">
              <button
                type="button"
                onClick={() => playTracks(pistes, i)}
                aria-label={`Lire « ${t.title} »`}
                className="flex w-full items-center gap-3 py-2.5 text-left text-foreground hover:text-primary"
              >
                <Pochette
                  titre={t.album?.title ?? t.source.name}
                  genre={t.album?.kind ?? t.source.kind}
                  temps={t.liturgical_season}
                  className="size-11 rounded-lg"
                  monoClassName="text-xs"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold leading-5">
                    {t.title}
                  </span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {t.source.name}
                    {t.duration_seconds
                      ? ` · ${formatDuree(t.duration_seconds)}`
                      : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3.5 border-t border-border pt-3 text-sm text-muted-foreground">
          Les enregistrements de ce temps apparaîtront ici.
        </p>
      )}
    </div>
  );
}

export function EcouterAccueil() {
  const [type, setType] = useState('');
  const accueil = useAccueil();
  const sources = useSources();
  const a = accueil.data;

  const reprises = (a?.reprendre ?? [])
    .filter(
      (r) =>
        !r.track.duration_seconds ||
        r.position_seconds < r.track.duration_seconds - 5,
    )
    .slice(0, 2);
  const libelleType = TYPES.find((t) => t.value === type)?.label;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            Écouter
          </h1>
          <p className="mt-2 text-muted-foreground">
            Messes, homélies, chants et enseignements de votre paroisse et de
            l’archidiocèse.
          </p>
        </div>
        <div className="flex gap-3">
          <RechercheChamp className="flex-1 md:w-72 md:flex-none" />
          <Button asChild variant="outline" className="h-11 rounded-xl md:h-11">
            <Link href={paths.app.ecouter.bibliotheque.getHref()}>
              <Library className="size-4" aria-hidden />
              Ma bibliothèque
            </Link>
          </Button>
        </div>
      </div>

      <FilterPills
        className="mt-6"
        ariaLabel="Types d’enregistrements"
        options={TYPES}
        value={type}
        onChange={setType}
      />

      {accueil.isError && (
        <div className="mt-8">
          <ErrorState
            description="L’accueil n’a pas pu être chargé."
            onRetry={() => void accueil.refetch()}
          />
        </div>
      )}

      {type === '' && reprises.length > 0 && (
        <Section titre="Reprendre l’écoute">
          <Stagger appear className="grid gap-4 md:grid-cols-2">
            {reprises.map((r) => (
              <StaggerItem key={r.track.id}>
                <CarteReprise recent={r} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}

      {type === 'playlists' ? (
        <Section titre="Playlists de la paroisse">
          {accueil.isLoading ? (
            <SkeletonList count={2} />
          ) : (
            <PlaylistsParoisse playlists={a?.playlists_paroisse ?? []} />
          )}
        </Section>
      ) : type ? (
        <Section titre={`${libelleType} récentes`}>
          <AlbumsDuType kind={type as AlbumKind} />
        </Section>
      ) : (
        !accueil.isError && (
          <Section
            titre={
              a?.paroisse
                ? 'Nouveautés de ma paroisse'
                : 'Nouveautés de votre paroisse'
            }
          >
            {accueil.isLoading || !a ? (
              <SqueletteGrille />
            ) : (
              <NouveautesParoisse accueil={a} />
            )}
          </Section>
        )
      )}

      {type === '' && a && (
        <div className="grid gap-x-8 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">
          <div className="min-w-0">
            <Section titre="Pour vous">
              <Reveal>
                <PourVousBloc suggestions={a.pour_vous} />
              </Reveal>
            </Section>
            {a.playlists_paroisse.length > 0 && (
              <Section titre="Playlists de la paroisse">
                <Reveal>
                  <PlaylistsParoisse playlists={a.playlists_paroisse} />
                </Reveal>
              </Section>
            )}
          </div>
          {a.temps_liturgique && (
            <aside className="min-w-0">
              <Section titre="Temps liturgique">
                <Reveal>
                  <TempsLiturgique temps={a.temps_liturgique} />
                </Reveal>
              </Section>
            </aside>
          )}
        </div>
      )}

      <Section titre="Parcourir par source">
        <Reveal>
          {sources.isLoading ? (
            <SkeletonList count={4} />
          ) : (
            <ul
              aria-label="Sources, par ordre alphabétique"
              className="grid gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft-sm sm:grid-cols-2 lg:grid-cols-4"
            >
              {(sources.data ?? []).map((s) => (
                <li key={s.id} className="min-w-0">
                  <CarteSource source={s} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[13px] text-muted-foreground">
            Sources présentées par ordre alphabétique.
          </p>
        </Reveal>
      </Section>
    </div>
  );
}
