import { ListMusic } from 'lucide-react';

import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';

import type { Playlist } from '../types/schemas';
import { pluriel } from '../utils/format';

import { Pochette } from './pochette';
import { VisibiliteBadge } from './visibilite-badge';

export function CartePlaylist({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      href={paths.app.ecouter.playlist.getHref(playlist.id)}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 text-foreground hover:border-primary/40"
    >
      <Pochette
        titre={playlist.title}
        genre="playlist"
        className="size-16 rounded-xl"
        monoClassName="text-base"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <ListMusic
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate">{playlist.title}</span>
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {pluriel(playlist.track_count, 'titre', 'titres')}
          {playlist.source ? ` · ${playlist.source.name}` : ''}
        </span>
        {playlist.description && (
          <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
            {playlist.description}
          </span>
        )}
      </span>
      {playlist.visibility === 'prive' && (
        <VisibiliteBadge visibilite="prive" />
      )}
    </Link>
  );
}
