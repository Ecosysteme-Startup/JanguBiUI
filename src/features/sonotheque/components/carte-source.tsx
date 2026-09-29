import NextLink from 'next/link';

import { paths } from '@/config/paths';

import type { Source } from '../types/schemas';
import { LIBELLES_SOURCE } from '../utils/format';

import { Pochette } from './pochette';

export function CarteSource({ source }: { source: Source }) {
  return (
    <NextLink
      href={paths.app.ecouter.source.getHref(source.id)}
      className="flex items-center gap-3 rounded-xl p-2 text-ink hover:bg-surface"
    >
      <Pochette
        titre={source.name}
        genre={source.kind}
        imageUrl={source.cover_url}
        className="size-11 rounded-full"
        monoClassName="text-14"
      />
      <span className="min-w-0">
        <span data-nom className="block truncate font-semibold">
          {source.name}
        </span>
        <span className="block truncate text-14 text-ink-3">
          {LIBELLES_SOURCE[source.kind]}
          {source.node ? ` · ${source.node.name}` : ''}
        </span>
      </span>
    </NextLink>
  );
}
