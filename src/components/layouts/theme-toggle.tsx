'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

/** Bascule clair/sombre (préférence du système par défaut). */
export const ThemeToggle = ({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'night' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-pressed={dark}
      className={cn(
        'hit tnum text-meta underline-offset-4 hover:underline',
        tone === 'night' ? 'text-on-night-muted hover:text-on-night' : 'text-ink-3 hover:text-ink',
        className,
      )}
    >
      {dark ? 'Affichage clair' : 'Affichage sombre'}
    </button>
  );
};
