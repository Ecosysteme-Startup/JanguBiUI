'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/**
 * Carte « Partager » (WEB-Parole-du-jour) : copier le lien de la page du jour, ou l'envoyer
 * (partage natif du téléphone, sinon un e-mail prérempli).
 */
export const ShareActions = ({ title, path }: { title: string; path: string }) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  // L'origine n'est connue qu'au navigateur : lue après l'hydratation pour éviter un écart de rendu.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setFailed(false);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  };

  const send = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Partage annulé par l'utilisateur : rien à signaler.
      }
      return;
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title} ${url}`)}`;
  };

  return (
    <section aria-labelledby="partager-titre" className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <h2 id="partager-titre" className="m-0 text-17 font-semibold text-ink">
        Partager
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" className="min-h-11" onClick={copy}>
          <Icon name="lien" size={18} />
          Copier le lien
        </Button>
        <Button variant="outline" className="min-h-11" onClick={send}>
          <Icon name="partager" size={18} />
          Envoyer
        </Button>
      </div>
      <div aria-live="polite">
        {copied && (
          <p className="m-0 mt-3 flex items-center gap-2 rounded-10 bg-ok-bg px-3 py-2 text-14 text-ok">
            <Icon name="check" size={16} className="shrink-0" />
            Lien copié. Vous pouvez le coller dans un message.
          </p>
        )}
        {failed && (
          <p className="m-0 mt-3 flex items-center gap-2 rounded-10 bg-err-bg px-3 py-2 text-14 text-err">
            <Icon name="erreur" size={16} className="shrink-0" />
            Le lien n&apos;a pas pu être copié. Utilisez « Envoyer ».
          </p>
        )}
      </div>
    </section>
  );
};
