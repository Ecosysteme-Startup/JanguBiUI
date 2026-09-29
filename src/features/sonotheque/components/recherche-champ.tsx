'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

/** Champ de recherche de la sonothèque : soumet vers la page de recherche. */
export function RechercheChamp({
  valeurInitiale = '',
  onSubmit,
  className,
}: {
  valeurInitiale?: string;
  onSubmit?: (q: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(valeurInitiale);
  return (
    <form
      role="search"
      className={cn(
        'flex h-11 items-center gap-2 rounded-xl border border-line-field bg-surface px-3 text-ink-3 focus-within:ring-1 focus-within:ring-primary',
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (onSubmit) onSubmit(v);
        else router.push(paths.app.ecouter.recherche.getHref(v));
      }}
    >
      <Icon name="recherche" className="size-[18px] shrink-0" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Titre, chorale, langue…"
        aria-label="Rechercher dans la sonothèque"
        className="min-w-0 flex-1 border-0 bg-transparent text-15 text-ink outline-none placeholder:text-ink-3"
      />
    </form>
  );
}
