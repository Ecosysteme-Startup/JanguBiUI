'use client';

import { useState } from 'react';

import { FeatureGate } from '@/components/feature-gate';
import { FEATURES } from '@/config/features';
import type { OfficeKey } from '@/features/spirituel/api/get-office';
import { OfficeSelector } from '@/features/spirituel/components/liturgie-heures/office-selector';
import { OfficeView } from '@/features/spirituel/components/liturgie-heures/office-view';

/** Office conseillé selon l'heure (lectures la nuit, complies le soir). */
export function getCurrentOfficeKey(hour = new Date().getHours()): OfficeKey {
  if (hour < 6) return 'lectures';
  if (hour < 9) return 'laudes';
  if (hour < 12) return 'tierce';
  if (hour < 15) return 'sexte';
  if (hour < 18) return 'none';
  if (hour < 21) return 'vepres';
  return 'complies';
}

function Heures() {
  const [office, setOffice] = useState<OfficeKey>(() => getCurrentOfficeKey());
  return (
    <div className="flex flex-col gap-4">
      <OfficeSelector selected={office} onChange={setOffice} />
      <OfficeView officeKey={office} />
    </div>
  );
}

/**
 * Liturgie des Heures : GET /v1/liturgy/v1/<office>/ — sous-module gelé en V1
 * (« liturgy.heures ») et réservé aux clercs et consacrés, donc derrière
 * l'indicateur `heures`.
 */
export function HeuresTab() {
  return (
    <FeatureGate
      feature={FEATURES.heures}
      title="Liturgie des Heures"
      description="Les offices ne sont pas encore proposés dans l’application."
    >
      <Heures />
    </FeatureGate>
  );
}
