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
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 6000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  ok: (message: string) => useToasts.getState().push('ok', message),
  err: (message: string) => useToasts.getState().push('err', message),
  info: (message: string) => useToasts.getState().push('info', message),
};

const TONE = {
  ok: { icon: 'check', cls: 'text-tint-200' },
  err: { icon: 'alerte', cls: 'text-err-bg' },
  info: { icon: 'info', cls: 'text-tint-200' },
} as const;

export const Toaster = () => {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'err' ? 'alert' : 'status'}
          className="flex items-center gap-3 rounded bg-ink px-4 py-3 text-base text-paper shadow-modal"
        >
          <Icon name={TONE[t.tone].icon} size={20} className={cn('shrink-0', TONE[t.tone].cls)} />
          <p className="m-0 flex-1">{t.message}</p>
          <IconButton
            icon="x"
            label="Fermer la notification"
            size="sm"
            className="text-paper hover:bg-ink-2"
            onClick={() => dismiss(t.id)}
          />
        </div>
      ))}
    </div>
  );
};
