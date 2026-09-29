'use client';

import { Laptop, Library, Play, Smartphone, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Link } from '@/components/ui/link';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';

import { useAlbums } from '../api/get-albums';
import { useBibliotheque } from '../api/get-bibliotheque';
import { usePourVous, useSetRecommandations } from '../api/get-pour-vous';
import { useSources } from '../api/get-sources';
import { usePlayTracks } from '../play';
import type { AlbumKind, Recent } from '../types/schemas';
import { formatMisAJour, formatRestant } from '../utils/format';

import { CarteAlbum } from './carte-album';
import { CarteSource } from './carte-source';
import { LignePiste } from './ligne-piste';
import { Pochette } from './pochette';
import { RechercheChamp } from './recherche-champ';

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Tout' },
  { value: 'messe', label: 'Messes' },
  { value: 'homelies', label: 'Homélies' },
  { value: 'album', label: 'Chants' },
  { value: 'retraite', label: 'Enseignements' },
];

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

function PourVousBloc() {
  const { data, isLoading } = usePourVous();
  const reglage = useSetRecommandations();
  if (isLoading) return <SkeletonList count={4} />;
  if (!data) return null;
  const suggestions = data.results.slice(0, 4);
  const pistes = suggestions.map((s) => s.track);
  return (
    <>
      {suggestions.length > 0 ? (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm">
          {suggestions.map((s, i) => (
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
      <p className="mt-3 text-[13px] text-muted-foreground">
        {data.personnalise
          ? 'Suggestions établies à partir de vos écoutes dans Jàngu Bi, jamais à partir de vos demandes, dons ou messages.'
          : 'Suggestions non personnalisées : nouveautés de votre paroisse et temps liturgique.'}{' '}
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          disabled={reglage.isPending}
          onClick={() => reglage.mutate(!data.personnalise)}
        >
          {data.personnalise ? 'Les désactiver' : 'Les réactiver'}
        </button>
      </p>
    </>
  );
}

export function EcouterAccueil() {
  const [type, setType] = useState('');
  const albums = useAlbums(type ? { kind: type as AlbumKind } : {});
  const biblio = useBibliotheque();
  const sources = useSources();

  const reprises = (biblio.data?.recent ?? [])
    .filter(
      (r) =>
        !r.track.duration_seconds ||
        r.position_seconds < r.track.duration_seconds - 5,
    )
    .slice(0, 2);
  const nouveautes = [...(albums.data ?? [])]
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, 4);
  const aujourdhui = new Date().toDateString();

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

      {reprises.length > 0 && (
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

      <Section
        titre={
          type
            ? `${TYPES.find((t) => t.value === type)?.label} récentes`
            : 'Nouveautés de ma paroisse'
        }
      >
        {albums.isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : nouveautes.length ? (
          <Stagger appear className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {nouveautes.map((a) => (
              <StaggerItem key={a.id}>
                <CarteAlbum
                  album={a}
                  badge={
                    a.published_at &&
                    new Date(a.published_at).toDateString() === aujourdhui ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                        Aujourd’hui
                      </span>
                    ) : undefined
                  }
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            title="Rien de neuf pour l’instant"
            description="Les prochains enregistrements de votre paroisse apparaîtront ici."
          />
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">
        <Section titre="Pour vous">
          <Reveal>
            <PourVousBloc />
          </Reveal>
        </Section>
        <Section titre="Parcourir par source">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-2 shadow-soft-sm">
              {sources.isLoading ? (
                <SkeletonList count={4} />
              ) : (
                <ul aria-label="Sources, par ordre alphabétique">
                  {(sources.data ?? []).map((s) => (
                    <li key={s.id}>
                      <CarteSource source={s} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Sources présentées par ordre alphabétique.
            </p>
          </Reveal>
        </Section>
      </div>
    </div>
  );
}
