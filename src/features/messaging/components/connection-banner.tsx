'use client';

import { Loader2, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ChatSocketStatus } from '../hooks/use-chat-socket';

interface ConnectionBannerProps {
  status: ChatSocketStatus;
}

const BANNER_COPY: Record<
  Exclude<ChatSocketStatus, 'online'>,
  { label: string; tone: string; spinning: boolean }
> = {
  connecting: {
    label: 'Connexion…',
    tone: 'bg-info/10 text-info',
    spinning: true,
  },
  reconnecting: {
    label: 'Reconnexion…',
    tone: 'bg-warning/10 text-warning',
    spinning: true,
  },
  offline: {
    label: 'Hors ligne',
    tone: 'bg-destructive/10 text-destructive',
    spinning: false,
  },
};

/**
 * Bannière discrète de l'état du temps réel.
 * N'affiche rien quand la connexion est établie (`online`).
 * Le signal repose sur icône + texte (jamais la couleur seule) → WCAG 1.4.1.
 */
export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === 'online') return null;

  const { label, tone, spinning } = BANNER_COPY[status];

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium',
        tone,
      )}
    >
      {spinning ? (
        <Loader2
          className="size-3.5 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <WifiOff className="size-3.5" aria-hidden="true" />
      )}
      <span>{label}</span>
    </div>
  );
}
