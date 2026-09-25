import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { SocketStatus } from '@/lib/ws';

/**
 * État du temps réel (spec §3) : « hors ligne » est actionnable ; en attendant, le fil se
 * met à jour par interrogation régulière de l'API.
 */
export const ConnectionStatus = ({
  status,
  onRetry,
}: {
  status: SocketStatus;
  onRetry: () => void;
}) => {
  if (status === 'open' || status === 'closed')
    return <span role="status" aria-live="polite" className="sr-only" />;
  if (status === 'offline' || status === 'forbidden') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-3 border-b border-line bg-warn-bg px-4 py-2 lg:px-6"
      >
        <Icon name="alerte" size={18} className="shrink-0 text-warn" />
        <p className="m-0 flex-1 text-sm text-ink">
          <strong className="font-semibold text-warn">Hors ligne.</strong> Les
          nouveaux messages s’affichent toutes les quinze secondes.
        </p>
        {status === 'offline' && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    );
  }
  return (
    <p
      role="status"
      aria-live="polite"
      className="tnum m-0 border-b border-line px-4 py-1.5 text-meta text-ink-3 lg:px-6"
    >
      {status === 'reconnecting' ? 'Reconnexion…' : 'Connexion…'}
    </p>
  );
};
