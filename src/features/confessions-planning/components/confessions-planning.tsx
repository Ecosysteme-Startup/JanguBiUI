'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useCan } from '@/lib/can';
import { dayjs } from '@/utils/dates';

import { usePlanning } from '../api/get-planning';
import type { PlanningSlot } from '../api/schemas';
import { DAY_FORMAT, dayOf, dayTitle, upcomingDays, weekDays, weekStartOf } from '../utils/planning';

import { DayCard } from './day-card';
import { NextDays } from './next-days';
import { PlanningSettings } from './planning-settings';
import { RulesPanel } from './rules-panel';
import { SlotLegend } from './slot-legend';
import { WeekStrip } from './week-strip';

/**
 * Créneaux de confession (PAR-Confessions). `confessions.gerer` : le prêtre crée et retire
 * SES créneaux ; `confessions.voir_planning` : lecture seule, initiales (le serveur filtre).
 */
export const ConfessionsPlanning = ({ nodeId }: { nodeId: string }) => {
  const canManage = useCan('confessions.gerer', nodeId);
  const [weekStart, setWeekStart] = useState(weekStartOf(dayjs()));
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlanningSlot | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const planning = usePlanning(nodeId, weekStart);

  const days = weekDays(weekStart);
  const all = planning.data ?? [];
  const inWeek = all.filter((s) => days.includes(dayOf(s)));
  const firstWithSlots = days.find((d) => inWeek.some((s) => dayOf(s) === d));
  const today = dayjs().format(DAY_FORMAT);
  const activeDay = day ?? firstWithSlots ?? (days.includes(today) ? today : days[0]);
  const daySlots = inWeek.filter((s) => dayOf(s) === activeDay);
  const current = selected && daySlots.find((s) => s.id === selected.id);

  const moveWeek = (delta: number) => {
    setWeekStart(dayjs(weekStart).add(delta, 'week').format(DAY_FORMAT));
    setDay(null);
    setSelected(null);
  };
  const openDay = (target: string) => {
    setWeekStart(weekStartOf(target));
    setDay(target);
    setSelected(null);
  };

  return (
    <div>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1 className="m-0 text-32 font-semibold text-ink">Confessions</h1>
          <p className="m-0 mt-1 text-16 text-ink-2">Rendez-vous en présentiel, réservés par les fidèles dans l’application, sans motif à indiquer.</p>
        </div>
        {canManage && (
          <Button size="lg" className="self-start text-15 lg:self-auto" aria-expanded={panelOpen} aria-controls="panneau-recurrent" onClick={() => setPanelOpen((o) => !o)}>
            <Icon name={panelOpen ? 'x' : 'plus'} size={18} />
            Ouvrir des créneaux
          </Button>
        )}
      </header>

      {canManage && panelOpen && (
        <div className="mt-6">
          <RulesPanel nodeId={nodeId} onClose={() => setPanelOpen(false)} />
        </div>
      )}

      {planning.isPending ? (
        <div className="mt-6">
          <LoadingBlock label="Chargement du planning…" lines={4} />
        </div>
      ) : planning.isError ? (
        <div className="mt-6">
          <EmptyState tone="err" icon="alerte" title="Le planning n’a pas pu être chargé">
            Vérifiez votre connexion puis rechargez la page.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <WeekStrip
              days={days}
              slots={inWeek}
              active={activeDay}
              onMove={moveWeek}
              onSelect={(d) => {
                setDay(d);
                setSelected(null);
              }}
            />
            <SlotLegend />
          </div>

          <DayCard
            title={dayTitle(activeDay)}
            slots={daySlots}
            current={current ?? null}
            canManage={canManage}
            onSelect={setSelected}
            onDone={() => setSelected(null)}
            emptyHint={canManage ? 'Ouvrez des créneaux pour que les fidèles puissent réserver.' : undefined}
          />

          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <NextDays days={upcomingDays(all, days[6])} onOpen={openDay} />
            <PlanningSettings slots={all} canManage={canManage} onEdit={() => setPanelOpen(true)} />
          </div>
        </>
      )}
    </div>
  );
};
