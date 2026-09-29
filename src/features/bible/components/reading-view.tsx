'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { ReadingSurface } from '@/components/ui/reading-surface';
import { FEATURES, isFeatureEnabled } from '@/config/features';

import { HomilyNotes } from './homily-notes';

interface ReadingViewProps {
  title: string;
  reference: string;
  text: string;
  refrain?: string;
  isHtml?: boolean;
  passageId?: number;
  showHomilyNotes?: boolean;
  onBack: () => void;
}

export function ReadingView({
  title,
  reference,
  text,
  refrain,
  isHtml,
  passageId,
  showHomilyNotes = false,
  onBack,
}: ReadingViewProps) {
  const [fontSize, setFontSize] = useState(16);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <FontSizeStepper
          value={fontSize}
          onChange={setFontSize}
          min={12}
          max={24}
        />
      </div>

      {/* Reading content */}
      <article className="mx-auto w-full max-w-reading rounded-xl bg-background-surface p-6">
        <header className="mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-primary">{reference}</p>
        </header>
        {refrain && (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
              Refrain
            </p>
            <p className="font-serif text-base font-semibold italic leading-snug text-foreground">
              {refrain}
            </p>
          </div>
        )}
        {isHtml ? (
          <ReadingSurface fontSize={fontSize} html={text} className="pb-8" />
        ) : (
          <ReadingSurface fontSize={fontSize} className="pb-8">
            <p className="whitespace-pre-line">{text}</p>
          </ReadingSurface>
        )}
      </article>

      {/* Notes d'homélie : sous-module gelé en V1 (indicateur notes-homelie). */}
      {showHomilyNotes &&
        passageId !== undefined &&
        isFeatureEnabled(FEATURES.notesHomelie) && (
          <div className="mx-auto w-full max-w-reading">
            <HomilyNotes passageId={passageId} />
          </div>
        )}
    </div>
  );
}
