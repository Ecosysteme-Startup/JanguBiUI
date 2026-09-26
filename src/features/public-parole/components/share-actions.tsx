'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** Partager la page du jour : partage natif, sinon copie du lien ; message et e-mail. */
export const ShareActions = ({ title, path }: { title: string; path: string }) => {
  const [copied, setCopied] = useState(false);
  // L'origine n'est connue qu'au navigateur : lue après l'hydratation pour éviter un écart de rendu.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const url = () => `${origin}${path}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: url() });
        return;
      }
      await navigator.clipboard.writeText(url());
      setCopied(true);
    } catch {
      // Partage annulé par l'utilisateur : rien à signaler.
    }
  };

  const body = encodeURIComponent(`${title} ${url()}`);
  const square = 'hit inline-flex size-11 items-center justify-center rounded border border-line text-ink hover:border-ink';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={share}>
        Partager
      </Button>
      <a href={`sms:?&body=${body}`} aria-label="Envoyer par message" className={square}>
        <Icon name="message" size={18} />
      </a>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${body}`} aria-label="Envoyer par e-mail" className={square}>
        <Icon name="mail" size={18} />
      </a>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Lien copié.' : ''}
      </span>
    </div>
  );
};
