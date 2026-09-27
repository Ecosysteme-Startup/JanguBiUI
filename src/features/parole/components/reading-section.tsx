'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useId, useState } from 'react';

import { IconButton } from '@/components/ui/icon-button';
import { paths } from '@/config/paths';
import type { Reading } from '@/features/parole/api/get-liturgy-day';
import { TEXT_SIZES, TextSizeControl, type TextSize } from '@/features/parole/components/text-size-control';
import { closingFormula, readingLabel, readingPlainText, readingTitle } from '@/features/parole/utils/liturgy';
import { cn } from '@/utils/cn';
import { longDate } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

/** Texte AELF : balises de texte seulement, aucun attribut (ni image, ni lien, ni script). */
const READING_SANITIZE = { ALLOWED_TAGS: ['p', 'br', 'sup', 'em', 'i', 'strong', 'b', 'span'], ALLOWED_ATTR: [] };

type Props = {
  reading: Reading;
  date: string;
  notice: string;
  size: TextSize;
  onSize: (size: TextSize) => void;
};

/** La lecture choisie (FID-Parole) : titre, outils (taille, copier, partager), versets, acclamation. */
export const ReadingSection = ({ reading, date, notice, size, onSize }: Props) => {
  const [status, setStatus] = useState('');
  const titleId = useId();
  const closing = closingFormula(reading.type)?.replace(/^—\s*/, '');
  const firstChapter = reading.verses[0]?.chapter;
  const publicUrl = () => `${window.location.origin}${paths.parole.getHref(date)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readingPlainText(reading));
      setStatus('Texte de la lecture copié.');
    } catch {
      setStatus('Copie impossible : sélectionnez le texte.');
    }
  };

  const share = async () => {
    const title = `Les lectures du ${longDate(date).toLowerCase()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: publicUrl() });
        return;
      }
      await navigator.clipboard.writeText(publicUrl());
      setStatus('Lien des lectures copié.');
    } catch {
      setStatus('Partage impossible pour le moment.');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Les lectures du ${longDate(date).toLowerCase()} : ${publicUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <article aria-labelledby={titleId} className="mt-8">
      <div className="flex flex-wrap-reverse items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1 basis-60">
          <p className="m-0 text-14 text-ink-3">{readingLabel(reading.type)}</p>
          <h2 id={titleId} className="m-0 mt-1 text-24 font-semibold text-ink">
            {readingTitle(reading)}
          </h2>
          <p className="tnum m-0 mt-1 text-15 text-ink-2">{reading.citation}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <TextSizeControl value={size} onChange={onSize} />
          <IconButton icon="copier" label="Copier le texte" className="text-ink-2" onClick={copy} />
          <IconButton icon="partager" label="Partager" className="text-ink-2" onClick={share} />
        </div>
      </div>

      {reading.verses.length > 0 ? (
        <div className={cn('mt-7 font-serif text-ink', TEXT_SIZES[size].reading)}>
          {reading.verses.map((v) => (
            <p key={`${v.chapter}-${v.number}`} className="m-0 [&+p]:mt-4">
              <sup className="tnum mr-1.5 font-sans text-12 text-ink-3">{v.chapter === firstChapter ? v.number : `${v.chapter}, ${v.number}`}</sup>
              {frenchTypo(v.text)}
            </p>
          ))}
          {closing && <p className="m-0 mt-7 text-ink-2">{closing}</p>}
        </div>
      ) : reading.text ? (
        <div className={cn('mt-7 font-serif text-ink [&_p]:m-0 [&_p+p]:mt-4', TEXT_SIZES[size].reading)}>
          <div
            // Texte AELF (source « aelf ») : HTML fourni par l'API, assaini avant affichage.
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reading.text, READING_SANITIZE) }}
          />
          {closing && <p className="m-0 mt-7 text-ink-2">{closing}</p>}
        </div>
      ) : (
        <p className="m-0 mt-7 text-16 text-ink-3">Le texte de cette lecture n’est pas encore disponible.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 text-13 text-ink-3">
        <span>{notice}</span>
        <button type="button" onClick={shareOnWhatsApp} className="hit font-medium text-primary hover:text-primary-strong">
          Envoyer sur WhatsApp
        </button>
      </div>
      <p role="status" aria-live="polite" className="m-0 min-h-5 text-13 text-ink-3">
        {status}
      </p>
    </article>
  );
};
