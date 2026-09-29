'use client';

import * as Dialog from '@radix-ui/react-dialog';
import NextLink from 'next/link';
import * as React from 'react';

import { Icon, type IconName } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/input';
import { cn } from '@/utils/cn';

export type QuickSearchItem = { label: string; href: string; hint?: string; icon?: IconName; group?: string };

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Recherche rapide (WEB-Design-System, « Recherche rapide », Ctrl K) : champ de la barre latérale
 * qui ouvre un dialogue listant les rubriques de l'espace ; flèches pour choisir, Entrée pour ouvrir.
 */
export const QuickSearch = ({
  items,
  placeholder = 'Rechercher',
  searchAll,
}: {
  items: QuickSearchItem[];
  placeholder?: string;
  /** Lien « Rechercher partout » (recherche transverse) pour la saisie, en dernier résultat. */
  searchAll?: (query: string) => string;
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [cursor, setCursor] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = React.useMemo(() => {
    const q = normalize(query.trim());
    const found = q ? items.filter((i) => normalize(`${i.label} ${i.hint ?? ''} ${i.group ?? ''}`).includes(q)) : items;
    const text = query.trim();
    return searchAll && text.length >= 2
      ? [...found, { label: `Rechercher « ${text} » partout`, href: searchAll(text), icon: 'recherche' as const, hint: 'Bible, paroisses, annonces, prêtres, écoute' }]
      : found;
  }, [items, query, searchAll]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery('');
      setCursor(0);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((c) => (results.length ? (c + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : 0));
    } else if (event.key === 'Enter' && results[cursor]) {
      event.preventDefault();
      listRef.current?.querySelectorAll('a')[cursor]?.click();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger className="flex h-10 w-full items-center gap-2 rounded-10 border border-line bg-paper px-3 text-left text-14 text-ink-3 transition-colors hover:border-line-field">
        <Icon name="recherche" size={18} className="shrink-0" />
        <span className="flex-1">{placeholder}</span>
        <Kbd>Ctrl K</Kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[min(600px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-12 border border-line bg-paper shadow-menu focus:outline-none">
          <Dialog.Title className="sr-only">Recherche rapide</Dialog.Title>
          <Dialog.Description className="sr-only">Tapez pour filtrer les rubriques, puis Entrée pour ouvrir.</Dialog.Description>
          <div className="flex h-12 items-center gap-2.5 border-b border-line px-4">
            <Icon name="recherche" size={18} className="shrink-0 text-ink-3" />
            <input
              type="search"
              aria-label="Rechercher une rubrique"
              aria-controls="recherche-rapide-resultats"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              onKeyDown={onKeyDown}
              className="min-w-0 flex-1 border-0 bg-transparent text-16 text-ink outline-none focus-visible:outline-none"
            />
            <Kbd>Échap</Kbd>
          </div>
          <ul id="recherche-rapide-resultats" ref={listRef} className="m-0 max-h-[50vh] list-none overflow-y-auto p-1.5">
            {results.length === 0 && <li className="px-2.5 py-3 text-14 text-ink-3">Aucune rubrique ne correspond.</li>}
            {results.map((item, index) => (
              <li key={`${item.href}-${item.label}`}>
                <NextLink
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  onMouseEnter={() => setCursor(index)}
                  className={cn('flex items-center gap-3 rounded-8 px-2.5 py-2 text-ink hover:text-ink', index === cursor && 'bg-surface-2')}
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-8 border border-line text-ink-2">
                    <Icon name={item.icon ?? 'fleche-droite'} size={16} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-14 font-semibold">{item.label}</span>
                    {(item.hint || item.group) && <span className="truncate text-13 text-ink-3">{item.hint ?? item.group}</span>}
                  </span>
                </NextLink>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
