'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { useLiturgyToday } from '@/features/bible/api/get-liturgy-today';
import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';

import { PourVousAujourdhui } from './pour-vous';
import { ReadingsSwiper } from './readings-swiper';

export function TodayTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fontSize, setFontSize] = useState(16);
  const { data, isLoading } = useLiturgyToday(currentDate);

  const dateStr = data?.date
    ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

  const navigateDay = (offset: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    setCurrentDate(next);
  };

  const readings = data?.readings ?? [];
  // « Pour vous aujourd'hui » ne concerne que le jour même.
  const estAujourdhui =
    currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col gap-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateDay(-1)}
          aria-label="Jour précédent"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium capitalize text-foreground">
          <Calendar className="size-4 text-muted-foreground" />
          {dateStr}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateDay(1)}
          aria-label="Jour suivant"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Rosary mystery card */}
      <DailyMysteryCard />

      {/* Temps liturgique et célébration du jour */}
      {data?.calendar && (
        <p className="px-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {[data.calendar.season_label, data.calendar.celebration]
            .filter(Boolean)
            .join(' — ')}
        </p>
      )}

      {/* Pour vous aujourd'hui : entre le jour liturgique et les lectures */}
      {estAujourdhui && <PourVousAujourdhui />}

      {/* Font size controls */}
      {!isLoading && readings.length > 0 && (
        <div className="flex items-center justify-end px-1">
          <FontSizeStepper
            value={fontSize}
            onChange={setFontSize}
            min={12}
            max={24}
          />
        </div>
      )}

      {/* Swipeable readings */}
      <ReadingsSwiper readings={readings} fontSize={fontSize} />

      {/* Mention des droits des textes (ADR-008) : toujours avec les lectures. */}
      {readings.length > 0 && data?.notice && (
        <p className="px-1 text-xs text-muted-foreground">{data.notice}</p>
      )}
    </div>
  );
}
