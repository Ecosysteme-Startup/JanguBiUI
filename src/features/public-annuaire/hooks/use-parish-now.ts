'use client';

import { useEffect, useState } from 'react';

import { dayjs } from '@/utils/dates';

import { ACTIVE_COUNT_PARAMS, useDirectory } from '../api/get-directory';

/**
 * Date (AAAA-MM-JJ) et heure (HH:MM) courantes, lues au navigateur après l'hydratation pour
 * que le rendu serveur et le premier rendu client coïncident (`null` avant).
 */
export const useNow = () => {
  const [now, setNow] = useState<{ today: string; time: string } | null>(null);
  useEffect(() => {
    const d = dayjs();
    setNow({ today: d.format('YYYY-MM-DD'), time: d.format('HH:mm') });
  }, []);
  return now;
};

/** Première paroisse ouverte sur Jàngu Bi (la paroisse pilote), pour les aperçus de l'accueil. */
export const useActiveParish = () => {
  const { data } = useDirectory(ACTIVE_COUNT_PARAMS);
  return data?.results[0];
};
