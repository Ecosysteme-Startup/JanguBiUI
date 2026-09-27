'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { SegmentedControl } from '@/components/ui/segmented-control';

import { SettingsCard } from './settings-card';

type ThemeChoice = 'system' | 'light' | 'dark';

/** Apparence (FID-Profil) : clair, sombre ou selon l'appareil (next-themes, préférence locale). */
export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const value: ThemeChoice = mounted && (theme === 'light' || theme === 'dark') ? theme : 'system';

  return (
    <SettingsCard id="apparence" title="Apparence" description="S’applique à cet appareil.">
      <SegmentedControl
        label="Affichage"
        size="sm"
        value={value}
        onChange={(next) => setTheme(next)}
        options={[
          ['system', 'Comme l’appareil'],
          ['light', 'Clair'],
          ['dark', 'Sombre'],
        ]}
        className="mt-5"
      />
    </SettingsCard>
  );
};
