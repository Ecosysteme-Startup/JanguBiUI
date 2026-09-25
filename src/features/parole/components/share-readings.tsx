'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { paths } from '@/config/paths';
import { longDate } from '@/utils/dates';

/** Partage de la page publique des lectures (lisible sans compte). */
export const ShareReadings = ({ date }: { date: string }) => {
  const [status, setStatus] = useState('');
  const publicUrl = () => `${window.location.origin}${paths.parole.getHref(date)}`;

  const shareOnWhatsApp = () => {
    const text = `Les lectures du ${longDate(date).toLowerCase()} : ${publicUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl());
      setStatus('Lien des lectures copié.');
    } catch {
      setStatus('Copie impossible : sélectionnez l’adresse de la page.');
    }
  };

  return (
    <section aria-labelledby="partage-titre">
      <h2 id="partage-titre" className="tnum m-0 border-t border-line-strong pt-3 text-meta font-normal text-ink-2">
        Partager les lectures
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={shareOnWhatsApp}>
          Envoyer sur WhatsApp
        </Button>
        <IconButton icon="export" label="Copier le lien des lectures" bordered className="size-11" onClick={copyLink} />
      </div>
      <p role="status" aria-live="polite" className="m-0 mt-3 min-h-5 text-sm text-ink-3">
        {status}
      </p>
    </section>
  );
};
