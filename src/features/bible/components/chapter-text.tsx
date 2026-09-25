'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Verse } from '@/features/bible/api/get-chapter-verses';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

/**
 * Texte d'un chapitre : versets numérotés, lecture confortable (Source Serif, 68 ch).
 * Le numéro d'un verset le sélectionne ; `#v9` dans l'URL sélectionne le verset 9.
 */
export const ChapterText = ({ verses, reference }: { verses: Verse[]; reference: (verse: number) => string }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const match = /^#v(\d+)$/.exec(window.location.hash);
    if (!match) return;
    const n = Number(match[1]);
    setSelected(n);
    document.getElementById(`v${n}`)?.scrollIntoView?.({ block: 'center' });
  }, [verses]);

  const share = async (verse: Verse) => {
    const text = `« ${verse.text} » (${reference(verse.number)})`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setStatus(`${reference(verse.number)} copié.`);
    } catch {
      setStatus('Partage impossible pour le moment.');
    }
  };

  return (
    <div className="mt-6 flex max-w-reading flex-col gap-2">
      {verses.map((v) => {
        const isSelected = selected === v.number;
        return (
          <div key={v.id} id={`v${v.number}`} className={cn('scroll-mt-24 rounded py-1', isSelected && 'bg-tint-50 py-3 pr-4')}>
            <p className="m-0 grid grid-cols-[40px_minmax(0,1fr)] gap-2 font-serif text-lead leading-[1.7] text-ink">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Verset ${v.number}`}
                onClick={() => setSelected(isSelected ? null : v.number)}
                className="tnum hit self-start pr-2 pt-1.5 text-right font-sans text-meta text-primary hover:text-primary-strong"
              >
                {v.number}
              </button>
              <span>{frenchTypo(v.text)}</span>
            </p>
            {isSelected && (
              <div className="ml-12 mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary" onClick={() => share(v)}>
                  Partager
                </Button>
                <span className="tnum text-meta text-ink-3">{reference(v.number)}</span>
              </div>
            )}
          </div>
        );
      })}
      <p role="status" aria-live="polite" className="m-0 min-h-5 text-sm text-ink-3">
        {status}
      </p>
    </div>
  );
};
