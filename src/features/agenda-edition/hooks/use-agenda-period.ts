'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';

import { monthWeeks, weekDays } from '../utils/calendar';

export const AGENDA_VIEWS = ['mois', 'semaine', 'liste'] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];
export type AgendaPeriod = { view: AgendaView; date: string };

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const readPeriod = (params: URLSearchParams, today = dayjs()): AgendaPeriod => {
  const view = params.get('vue') ?? '';
  const date = params.get('date') ?? '';
  return {
    view: (AGENDA_VIEWS as readonly string[]).includes(view) ? (view as AgendaView) : 'mois',
    date: ISO_DAY.test(date) && dayjs(date).isValid() && dayjs(date).format('YYYY-MM-DD') === date ? date : today.format('YYYY-MM-DD'),
  };
};

export const periodToQuery = (p: AgendaPeriod) => `?${new URLSearchParams({ vue: p.view, date: p.date }).toString()}`;

/** Jours chargés : la semaine affichée, ou les semaines complètes de la grille du mois. */
export const periodBounds = (p: AgendaPeriod) => {
  if (p.view === 'semaine') {
    const days = weekDays(p.date);
    return { from: days[0], to: days[6] };
  }
  const weeks = monthWeeks(p.date);
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
};

/**
 * Vue et période de l'agenda dans l'URL (`?vue=semaine&date=2026-10-05`) : un lien partagé
 * rouvre la même semaine. L'URL est remplacée sans nouvelle entrée d'historique.
 */
export const useAgendaPeriod = (nodeId: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState<AgendaPeriod>(() => readPeriod(new URLSearchParams(searchParams?.toString() ?? '')));

  const update = useCallback(
    (patch: Partial<AgendaPeriod>) => {
      const next = { ...period, ...patch };
      setPeriod(next);
      router.replace(`${paths.espace.agenda.getHref(nodeId)}${periodToQuery(next)}`, { scroll: false });
    },
    [period, router, nodeId],
  );

  return { period, update };
};
