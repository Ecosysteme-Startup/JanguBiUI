'use client';

import { create } from 'zustand';

import { cn } from '@/utils/cn';

import { Icon } from './icon';
import { IconButton } from './icon-button';

type Tone = 'ok' | 'err' | 'info';
type Toast = { id: number; tone: Tone; message: string };

type ToastStore = {
  toasts: Toast[];
  push: (tone: Tone, message: string) => void;
  dismiss: (id: number) => void;
};

let seq = 0;

/** État d'interface (autorisé en Zustand, CLAUDE.md §4) : jamais de données serveur. */
export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  ok: (message: string) => useToasts.getState().push('ok', message),
  err: (message: string) => useToasts.getState().push('err', message),
  info: (message: string) => useToasts.getState().push('info', message),
};

/** Toasts (WEB-Design-System) : aplat d'encre, icône b200 ; l'erreur passe sur fond paper, icône errT. */
const TONE = {
  ok: { icon: 'succes', box: 'bg-inverse text-on-inverse', cls: 'text-on-inverse-muted', close: 'text-on-inverse hover:bg-ink-2' },
  info: { icon: 'info', box: 'bg-inverse text-on-inverse', cls: 'text-on-inverse-muted', close: 'text-on-inverse hover:bg-ink-2' },
  err: { icon: 'erreur', box: 'border border-line bg-paper text-ink', cls: 'text-err', close: 'text-ink-2 hover:bg-surface-2' },
} as const;

export const Toaster = () => {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'err' ? 'alert' : 'status'}
          className={cn('flex items-center gap-2.5 rounded-12 py-2 pl-4 pr-2 text-14 shadow-menu', TONE[t.tone].box)}
        >
          <Icon name={TONE[t.tone].icon} size={18} className={cn('shrink-0', TONE[t.tone].cls)} />
          <p className="m-0 flex-1 py-1">{t.message}</p>
          <IconButton icon="x" label="Fermer la notification" size="sm" className={TONE[t.tone].close} onClick={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
};
