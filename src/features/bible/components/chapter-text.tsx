'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { Verse } from '@/features/bible/api/get-chapter-verses';
import { TEXT_SIZES, type TextSize } from '@/features/bible/components/text-size-button';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

export type Passage = { from: number; to: number; label: string };

const menuButton = 'hit inline-flex h-9 items-center gap-2 rounded-8 px-3 text-14 font-medium text-ink transition-colors hover:bg-surface-2';

/**
 * Texte d'un chapitre (FID-Bible) : versets numérotés en Source Serif. Le numéro d'un verset le
 * sélectionne et ouvre ses actions (copier, partager) ; `#v9` dans l'URL sélectionne le verset 9.
 * Avec un `passage`, seuls ses versets s'affichent d'abord, la suite sur demande.
 */
export const ChapterText = ({
  verses,
  reference,
  size,
  passage,
}: {
  verses: Verse[];
  reference: (verse: number) => string;
  size: TextSize;
  passage?: Passage;
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [whole, setWhole] = useState(!passage);

  useEffect(() => {
    const match = /^#v(\d+)$/.exec(window.location.hash);
    if (!match) return;
    const n = Number(match[1]);
    setSelected(n);
    setWhole(true);
    document.getElementById(`v${n}`)?.scrollIntoView?.({ block: 'center' });
  }, [verses]);

  const shown = whole || !passage ? verses : verses.filter((v) => v.number >= passage.from && v.number <= passage.to);
  const last = verses.at(-1)?.number ?? 0;
  const quote = (v: Verse) => `« ${v.text} » (${reference(v.number)})`;

  const copy = async (v: Verse) => {
    try {
      await navigator.clipboard.writeText(quote(v));
      setStatus(`${reference(v.number)} copié.`);
    } catch {
      setStatus('Copie impossible : sélectionnez le texte.');
    }
  };

  const share = async (v: Verse) => {
    try {
      if (navigator.share) await navigator.share({ text: quote(v) });
      else await navigator.clipboard.writeText(quote(v));
      setStatus(`${reference(v.number)} copié.`);
    } catch {
      setStatus('Partage impossible pour le moment.');
    }
  };

  return (
    <div>
      {passage && !whole && (
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-12 bg-tint-50 px-4 py-3 text-15 text-tint-900">
          <Icon name="info" size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">{passage.label}</span>
          <button type="button" onClick={() => setWhole(true)} className="hit font-semibold text-primary hover:text-primary-strong">
            Lire depuis le verset 1
          </button>
        </div>
      )}
      <div className={cn('mt-8 font-serif text-ink', TEXT_SIZES[size].reading)}>
        {shown.map((v) => {
          const isSelected = selected === v.number;
          return (
            <div key={v.id} id={`v${v.number}`} className="scroll-mt-24 [&+div]:mt-4">
              <p className={cn('m-0', isSelected && '-mx-3 rounded-10 bg-tint-100 px-3 py-1 ring-1 ring-inset ring-tint-300')}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Verset ${v.number}`}
                  onClick={() => setSelected(isSelected ? null : v.number)}
                  className={cn(
                    'tnum hit mr-1.5 align-super font-sans text-12 leading-none hover:text-primary',
                    isSelected ? 'text-tint-800' : 'text-ink-3',
                  )}
                >
                  {v.number}
                </button>
                {frenchTypo(v.text)}
              </p>
              {isSelected && (
                <div
                  role="toolbar"
                  aria-label={reference(v.number)}
                  className="mt-2.5 inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-12 border border-line bg-paper p-1.5 font-sans shadow-menu"
                >
                  <span className="whitespace-nowrap pl-2 pr-2.5 text-13 font-medium text-ink-3">{reference(v.number)}</span>
                  <span aria-hidden="true" className="h-6 w-px bg-line" />
                  <button type="button" className={menuButton} onClick={() => copy(v)}>
                    <Icon name="copier" size={16} />
                    Copier
                  </button>
                  <button type="button" className={menuButton} onClick={() => share(v)}>
                    <Icon name="partager" size={16} />
                    Partager
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {passage && !whole && passage.to < last && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-16 border border-line bg-surface px-5 py-4">
          <span className="text-15 text-ink-2">
            Suite du chapitre : versets {passage.to + 1} à {last}
          </span>
          <Button variant="outline" onClick={() => setWhole(true)}>
            Afficher la suite
          </Button>
        </div>
      )}
      <p role="status" aria-live="polite" className="m-0 mt-2 min-h-5 text-13 text-ink-3">
        {status}
      </p>
    </div>
  );
};
