'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/** Bascule clair/sombre (préférence du système par défaut) : lien discret 13 px avec icône. */
export const ThemeToggle = ({ className }: { className?: string; tone?: 'default' | 'night' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-pressed={dark}
      className={cn('hit inline-flex items-center gap-1.5 text-13 text-ink-2 hover:text-ink', className)}
    >
      <Icon name={dark ? 'clair' : 'sombre'} size={16} />
      {dark ? 'Affichage clair' : 'Affichage sombre'}
    </button>
  );
};
