'use client';

import { Play } from 'lucide-react';

import { Equalizer } from '@/lib/motion/equalizer';
import { cn } from '@/utils/cn';

import { useLikedIds } from '../api/get-bibliotheque';
import { usePlayTracks } from '../play';
import type { Track } from '../types/schemas';
import { codeLangue, formatDuree, LIBELLES_LANGUE } from '../utils/format';

import { LikeButton } from './like-button';

interface ListePistesProps {
  pistes: Track[];
  /** Libellé accessible du tableau. */
  titre: string;
  /** Affiche la source et l'album sous le titre (playlists, recherche). */
  avecSource?: boolean;
  className?: string;
}

/**
 * Tableau de pistes (maquette WEB-FID-Album) : #, titre, langue, compositeur,
 * aimé, durée. La piste en cours est surlignée avec l'égaliseur. Un clic sur
 * la ligne lance la lecture à partir de cette piste (file = tout le tableau).
 */
export function ListePistes({
  pistes,
  titre,
  avecSource = false,
  className,
}: ListePistesProps) {
  const { playTracks, currentTrackId, isPlaying } = usePlayTracks();
  const aimes = useLikedIds();

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm',
        className,
      )}
    >
      <table className="w-full table-fixed text-sm" aria-label={titre}>
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th
              scope="col"
              className="w-12 py-3 pl-4 pr-2 text-right font-semibold"
            >
              #
            </th>
            <th scope="col" className="py-3 pr-3 font-semibold">
              Titre
            </th>
            <th
              scope="col"
              className="hidden w-20 py-3 pr-3 font-semibold sm:table-cell"
            >
              Langue
            </th>
            <th
              scope="col"
              className="hidden py-3 pr-3 font-semibold md:table-cell"
            >
              Compositeur, origine
            </th>
            <th scope="col" className="w-12 py-3 font-semibold">
              <span className="sr-only">Aimé</span>
            </th>
            <th scope="col" className="w-16 py-3 pr-4 text-right font-semibold">
              Durée
            </th>
          </tr>
        </thead>
        <tbody>
          {pistes.map((piste, i) => {
            const enCours = piste.id === currentTrackId;
            return (
              <tr
                key={piste.id}
                data-en-cours={enCours || undefined}
                className={cn(
                  'group border-b border-border last:border-0 hover:bg-background-surface',
                  enCours && 'bg-primary/5',
                )}
              >
                <td className="py-2.5 pl-4 pr-2 text-right tabular-nums text-muted-foreground">
                  {enCours ? (
                    <Equalizer playing={isPlaying} className="text-primary" />
                  ) : (
                    <>
                      <span className="group-hover:hidden">
                        {piste.position ?? i + 1}
                      </span>
                      <Play
                        className="ml-auto hidden size-4 text-foreground group-hover:block"
                        aria-hidden
                      />
                    </>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <button
                    type="button"
                    onClick={() => playTracks(pistes, i)}
                    className={cn(
                      'block w-full min-w-0 text-left',
                      enCours
                        ? 'font-semibold text-primary'
                        : 'font-medium text-foreground',
                    )}
                    aria-label={`Lire « ${piste.title} »`}
                    aria-current={enCours ? 'true' : undefined}
                  >
                    <span className="block truncate">{piste.title}</span>
                    {avecSource && (
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {piste.source.name}
                        {piste.album ? ` · ${piste.album.title}` : ''}
                      </span>
                    )}
                  </button>
                </td>
                <td className="hidden py-2.5 pr-3 sm:table-cell">
                  {piste.language && (
                    <abbr
                      title={LIBELLES_LANGUE[piste.language] ?? piste.language}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground no-underline"
                    >
                      {codeLangue(piste.language)}
                    </abbr>
                  )}
                </td>
                <td className="hidden truncate py-2.5 pr-3 text-muted-foreground md:table-cell">
                  {piste.composer || '—'}
                </td>
                <td className="py-1">
                  <LikeButton
                    trackId={piste.id}
                    titre={piste.title}
                    liked={aimes.has(piste.id)}
                  />
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatDuree(piste.duration_seconds)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
