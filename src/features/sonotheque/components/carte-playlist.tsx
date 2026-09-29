import { ListMusic } from 'lucide-react';
import NextLink from 'next/link';

import { paths } from '@/config/paths';

import type { Playlist } from '../types/schemas';
import { pluriel } from '../utils/format';

import { Pochette } from './pochette';
import { VisibiliteBadge } from './visibilite-badge';

export function CartePlaylist({ playlist }: { playlist: Playlist }) {
  return (
    <NextLink
      href={paths.app.ecouter.playlist.getHref(playlist.id)}
      className="flex items-center gap-4 rounded-16 border border-line bg-surface p-3 text-ink hover:border-tint-300"
    >
      <Pochette
        titre={playlist.title}
        genre="playlist"
        className="size-16 rounded-xl"
        monoClassName="text-15"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <ListMusic className="size-4 shrink-0 text-ink-3" aria-hidden />
          <span className="truncate">{playlist.title}</span>
        </span>
        <span className="block truncate text-14 text-ink-3">
          {pluriel(playlist.track_count, 'titre', 'titres')}
          {playlist.source ? ` · ${playlist.source.name}` : ''}
        </span>
        {playlist.description && (
          <span className="mt-0.5 line-clamp-1 block text-14 text-ink-3">
            {playlist.description}
          </span>
        )}
      </span>
      {playlist.visibility === 'prive' && (
        <VisibiliteBadge visibilite="prive" />
      )}
    </NextLink>
  );
}
