'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { useLiturgyToday } from '@/features/bible/api/get-liturgy-today';

import { ReadingsSwiper } from './readings-swiper';

export function MasseTab() {
  const { data, isLoading } = useLiturgyToday();
  const [fontSize, setFontSize] = useState(16);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const readings = data?.readings ?? [];

  return (
    <div className="flex flex-col">
      {/* Font size toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Messe du{' '}
          {data?.date
            ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : 'jour'}
        </p>
        <FontSizeStepper
          value={fontSize}
          onChange={setFontSize}
          min={12}
          max={24}
        />
      </div>

      <ReadingsSwiper readings={readings} fontSize={fontSize} />

      {readings.length > 0 && data?.notice && (
        <p className="px-4 pb-4 text-xs text-muted-foreground">{data.notice}</p>
      )}
    </div>
  );
}
