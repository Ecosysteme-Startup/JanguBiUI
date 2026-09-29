'use client';

import { Heart, Plus } from 'lucide-react';
import { useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton';
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOuvert(true)}
        icon={<Plus className="size-4" aria-hidden />}
      >
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
      <Button size="sm" type="submit" isLoading={creer.isPending}>
        Créer
      </Button>
    </form>
  );
}

export function BibliothequeVue() {
  const { data, isLoading, isError, refetch } = useBibliotheque();
  useRegisterPageMeta({ title: 'Ma bibliothèque' });

  if (isLoading) return <SkeletonList count={6} />;
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
          <h2 className="font-serif text-[22px] font-semibold">Titres aimés</h2>
          <span className="text-sm text-muted-foreground">
            {pluriel(data.likes.length, 'titre', 'titres')}
          </span>
        </div>
        {data.likes.length ? (
          <Reveal appear>
            <ListePistes pistes={data.likes} titre="Titres aimés" avecSource />
          </Reveal>
        ) : (
          <EmptyState
            icon={<Heart />}
            title="Aucun titre aimé"
            description="Touchez le cœur à côté d’un chant ou d’une homélie pour le retrouver ici."
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-[22px] font-semibold">
            Mes playlists
          </h2>
          <NouvellePlaylist />
        </div>
        {data.playlists.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.playlists.map((p) => (
              <CartePlaylist key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous n’avez pas encore de playlist.
          </p>
        )}
      </section>

      {data.recent.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-[22px] font-semibold">
            Écoutés récemment
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
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
