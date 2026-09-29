'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import type { LiturgyReading } from '../api/get-liturgy-today';
import {
  getReadingAccentClass,
  normalizeReadingLabel,
} from '../utils/reading-labels';

interface ReadingMeta {
  titre?: string;
  introLue?: string;
  refrain?: string;
  versetEvangile?: string;
}

function extractMeta(reading: LiturgyReading): ReadingMeta {
  const meta = reading.raw_metadata as Record<string, unknown> | null;
  if (!meta) return {};
  return {
    titre: typeof meta.titre === 'string' ? meta.titre : undefined,
    introLue: typeof meta.intro_lue === 'string' ? meta.intro_lue : undefined,
    refrain:
      typeof meta.refrain_psalmique === 'string'
        ? meta.refrain_psalmique
        : undefined,
    versetEvangile:
      typeof meta.verset_evangile === 'string'
        ? meta.verset_evangile
        : undefined,
  };
}

interface ReadingPanelProps {
  reading: LiturgyReading;
  fontSize: number;
}

function ReadingPanel({ reading, fontSize }: ReadingPanelProps) {
  const label = normalizeReadingLabel(reading.type ?? '');
  const accentClass = getReadingAccentClass(label);
  const { titre, introLue, refrain, versetEvangile } = extractMeta(reading);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5">
        <h2 className={cn('font-serif text-xl font-bold', accentClass)}>
          {label}
        </h2>
        {titre && (
          <p className="mt-1.5 text-sm font-semibold italic text-foreground/90">
            {titre}
          </p>
        )}
        {reading.citation && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {reading.citation}
          </p>
        )}
      </header>

      {/* Alléluia verse before the gospel (HTML) */}
      {versetEvangile && (
        <div
          className="reading-content mb-5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(versetEvangile),
          }}
        />
      )}

      {/* Intro lue — italic line before main text */}
      {introLue && (
        <p className="mb-4 text-sm italic text-muted-foreground">{introLue}</p>
      )}

      {/* Refrain psalmique (HTML) */}
      {refrain && (
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Refrain
          </p>
          <div
            className="reading-content text-sm font-medium leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(refrain) }}
          />
        </div>
      )}

      {/* Main text — mesure et interligne unifiés (cf. ReadingSurface) */}
      <div
        className="reading-content prose prose-slate max-w-reading pb-8 dark:prose-invert prose-p:text-foreground/80 prose-strong:text-foreground"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(reading.text ?? ''),
        }}
      />
    </div>
  );
}

interface ReadingsSwiperProps {
  readings: LiturgyReading[];
  fontSize: number;
}

export function ReadingsSwiper({ readings, fontSize }: ReadingsSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Détection du panneau visible via IntersectionObserver (plus de calcul
  // d'index par frame de scroll, qui luttait contre le geste de l'utilisateur).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const panels = Array.from(
      el.querySelectorAll<HTMLElement>('[data-panel-index]'),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number(
            (visible.target as HTMLElement).dataset.panelIndex,
          );
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      { root: el, threshold: [0.5, 0.75] },
    );
    panels.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, [readings.length]);

  // Garde la pastille active visible dans la barre d'onglets.
  useEffect(() => {
    const tab = tabsRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    tab?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex]);

  const goTo = (idx: number) => {
    setActiveIndex(idx);
    const el = scrollRef.current;
    if (!el || typeof el.scrollTo !== 'function') return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      e.key === 'ArrowRight'
        ? Math.min(readings.length - 1, i + 1)
        : Math.max(0, i - 1);
    goTo(next);
    (tabsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  if (readings.length === 0) {
    return (
      <div className="py-16 text-center text-sm italic text-muted-foreground">
        Aucune lecture disponible pour cette date.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Lectures du jour"
        className="scrollbar-none sticky top-0 z-10 flex overflow-x-auto border-b border-border bg-background/95 backdrop-blur-md"
      >
        {readings.map((r, i) => {
          const label = normalizeReadingLabel(r.type ?? '');
          const isActive = i === activeIndex;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              id={`reading-tab-${i}`}
              aria-selected={isActive}
              aria-controls={`reading-panel-${i}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => goTo(i)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={cn(
                'shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Swipeable panels */}
      <div
        ref={scrollRef}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-scroll"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {readings.map((r, i) => (
          <div
            key={r.id}
            data-panel-index={i}
            role="tabpanel"
            id={`reading-panel-${i}`}
            aria-labelledby={`reading-tab-${i}`}
            tabIndex={0}
            className="w-full shrink-0 snap-start"
          >
            <ReadingPanel reading={r} fontSize={fontSize} />
          </div>
        ))}
      </div>
    </div>
  );
}
