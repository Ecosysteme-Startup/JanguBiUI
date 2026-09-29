'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Reveal } from '@/lib/motion/reveal';

import { useBibliotheque } from '../api/get-bibliotheque';
import { useCreatePlaylist } from '../api/playlists';
import { formatMisAJour, formatRestant, pluriel } from '../utils/format';

import { CartePlaylist } from './carte-playlist';
import { LignePiste } from './ligne-piste';
import { ListePistes } from './liste-pistes';

function NouvellePlaylist() {
  const [titre, setTitre] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const creer = useCreatePlaylist();
  if (!ouvert) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
        <Icon name="plus" className="size-4" aria-hidden />
        Nouvelle playlist
      </Button>
    );
  }
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!titre.trim()) return;
        creer.mutate(
          { title: titre.trim(), visibility: 'prive' },
          {
            onSuccess: () => {
              setTitre('');
              setOuvert(false);
            },
          },
        );
      }}
    >
      <Input
        aria-label="Titre de la playlist"
        placeholder="Pour le dimanche"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        className="h-8 w-48"
      />
      <Button size="sm" type="submit" loading={creer.isPending}>
        Créer
      </Button>
    </form>
  );
}

export function BibliothequeVue() {
  const { data, isLoading, isError, refetch } = useBibliotheque();

  if (isLoading) return <LoadingBlock />;
  if (isError || !data)
    return (
      <ErrorState
        description="Votre bibliothèque n’a pas pu être chargée."
        onRetry={() => void refetch()}
      />
    );

  const recents = data.recent.map((r) => r.track);
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-22 font-semibold">Titres aimés</h2>
          <span className="text-14 text-ink-3">
            {pluriel(data.likes.length, 'titre', 'titres')}
          </span>
        </div>
        {data.likes.length ? (
          <Reveal appear>
            <ListePistes pistes={data.likes} titre="Titres aimés" avecSource />
          </Reveal>
        ) : (
          <EmptyState icon="ecouter" title="Aucun titre aimé">
            Touchez le cœur à côté d’un chant ou d’une homélie pour le retrouver
            ici.
          </EmptyState>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-22 font-semibold">Mes playlists</h2>
          <NouvellePlaylist />
        </div>
        {data.playlists.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.playlists.map((p) => (
              <CartePlaylist key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <p className="text-14 text-ink-3">
            Vous n’avez pas encore de playlist.
          </p>
        )}
      </section>

      {data.recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-22 font-semibold">Écoutés récemment</h2>
          <div className="divide-y divide-line overflow-hidden rounded-16 border border-line bg-surface">
            {data.recent.map((r, i) => (
              <LignePiste
                key={`${r.track.id}-${r.updated_at}`}
                pistes={recents}
                index={i}
                sousTitre={[
                  r.track.source.name,
                  formatRestant(r.position_seconds, r.track.duration_seconds),
                  formatMisAJour(r.updated_at),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
