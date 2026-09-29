'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { PressScale } from '@/lib/motion/press-scale';

import type { Album } from '../types/schemas';

import { Pochette } from './pochette';
import { VisibiliteBadge } from './visibilite-badge';

/** Carte d'album (grille « Nouveautés », page de source). */
export function CarteAlbum({
  album,
  sousTitre,
  badge,
}: {
  album: Album;
  sousTitre?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <PressScale lift className="min-w-0">
      <NextLink
        href={paths.app.ecouter.album.getHref(album.id)}
        className="flex min-w-0 flex-col gap-3 rounded-16 border border-line bg-surface p-3 text-ink hover:border-tint-300"
      >
        <Pochette
          titre={album.title}
          genre={album.kind}
          temps={album.liturgical_season}
          imageUrl={album.cover_url}
          className="aspect-square w-full rounded-xl"
          monoClassName="text-30"
        />
        <span className="flex min-w-0 flex-col px-0.5 pb-0.5">
          <span className="line-clamp-2 font-semibold leading-snug">
            {album.title}
          </span>
          <span className="truncate text-14 text-ink-3">
            {sousTitre ?? album.source.name}
          </span>
          {(badge || album.visibility !== 'public') && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {badge}
              {album.visibility !== 'public' && (
                <VisibiliteBadge visibilite={album.visibility} />
              )}
            </span>
          )}
        </span>
      </NextLink>
    </PressScale>
  );
}
