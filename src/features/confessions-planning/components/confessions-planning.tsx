'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useCan } from '@/lib/can';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import { usePlanning } from '../api/get-planning';
import type { PlanningSlot } from '../api/schemas';
import {
  DAY_FORMAT,
  dayOf,
  dayTitle,
  isBooked,
  weekDays,
  weekLabel,
  weekStartOf,
} from '../utils/planning';

import { CancelSlotForm } from './cancel-slot-form';
import { DayBookings } from './day-bookings';
import { DayGrid } from './day-grid';
import { RulesPanel } from './rules-panel';

const WeekStrip = ({
  days,
  slots,
  active,
  onSelect,
}: {
  days: string[];
  slots: PlanningSlot[];
  active: string;
  onSelect: (day: string) => void;
}) => {
  const today = dayjs().format(DAY_FORMAT);
  return (
    <ol
      aria-label="Jours de la semaine"
      className="m-0 grid list-none grid-cols-7 gap-1 p-0"
    >
      {days.map((day) => {
        const ofDay = slots.filter(
          (s) => dayOf(s) === day && s.status !== 'bloque',
        );
        const taken = ofDay.filter(isBooked).length;
        const selected = day === active;
        return (
          <li key={day}>
            <button
              type="button"
              aria-current={selected ? 'date' : undefined}
              aria-label={`${dayTitle(day)}${day === today ? ' (aujourd’hui)' : ''} : ${ofDay.length ? `${taken} pris sur ${ofDay.length}` : 'aucun créneau'}`}
              onClick={() => onSelect(day)}
              className={cn(
                'flex min-h-[64px] w-full flex-col items-start gap-1 rounded border px-2 py-2 text-left text-sm',
                selected
                  ? 'border-primary-fill bg-primary-fill text-on-primary'
                  : 'border-line bg-surface text-ink hover:border-primary',
                day === today && !selected && 'border-line-strong',
              )}
            >
              <span className="capitalize">{dayjs(day).format('ddd D')}</span>
              <span
                className={cn(
                  'tnum text-meta',
                  selected ? 'text-tint-100' : 'text-ink-3',
                )}
              >
                {ofDay.length ? `${taken} / ${ofDay.length}` : 'Aucun'}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

/**
 * Créneaux de confession (PAR-Confessions). `confessions.gerer` : le prêtre crée et retire
 * SES créneaux ; `confessions.voir_planning` : lecture seule, initiales (le serveur filtre).
 */
export const ConfessionsPlanning = ({ nodeId }: { nodeId: string }) => {
  const canManage = useCan('confessions.gerer', nodeId);
  const thisWeek = weekStartOf(dayjs());
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlanningSlot | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const planning = usePlanning(nodeId, weekStart);

  const days = weekDays(weekStart);
  const inWeek = (planning.data ?? []).filter((s) => days.includes(dayOf(s)));
  const firstWithSlots = days.find((d) => inWeek.some((s) => dayOf(s) === d));
  const today = dayjs().format(DAY_FORMAT);
  const activeDay =
    day ?? firstWithSlots ?? (days.includes(today) ? today : days[0]);
  const daySlots = inWeek.filter((s) => dayOf(s) === activeDay);
  const current = selected && daySlots.find((s) => s.id === selected.id);
  const dayLabel = dayTitle(activeDay).toLowerCase();

  const moveWeek = (delta: number) => {
    setWeekStart(dayjs(weekStart).add(delta, 'week').format(DAY_FORMAT));
    setDay(null);
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">07</span> — Sacrement de
            réconciliation · en présentiel uniquement
          </p>
          <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">
            Confessions
          </h1>
        </div>
        {canManage && (
          <Button
            variant={panelOpen ? 'secondary' : 'primary'}
            aria-expanded={panelOpen}
            aria-controls="panneau-recurrent"
            onClick={() => setPanelOpen((o) => !o)}
          >
            Créneaux récurrents
          </Button>
        )}
      </div>

      {canManage && panelOpen && (
        <RulesPanel nodeId={nodeId} onClose={() => setPanelOpen(false)} />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8">
          <section aria-labelledby="semaine">
            <SectionHeading
              id="semaine"
              number="01"
              title={weekLabel(weekStart)}
              aside={
                <span className="flex items-center gap-1">
                  <IconButton
                    icon="chevron-gauche"
                    label="Semaine précédente"
                    size="sm"
                    onClick={() => moveWeek(-1)}
                  />
                  <IconButton
                    icon="chevron-droite"
                    label="Semaine suivante"
                    size="sm"
                    onClick={() => moveWeek(1)}
                  />
                </span>
              }
            />
            {planning.isPending ? (
              <LoadingBlock label="Chargement du planning…" lines={2} />
            ) : planning.isError ? (
              <EmptyState
                tone="err"
                icon="alerte"
                title="Le planning n’a pas pu être chargé"
              >
                Vérifiez votre connexion puis rechargez la page.
              </EmptyState>
            ) : (
              <WeekStrip
                days={days}
                slots={inWeek}
                active={activeDay}
                onSelect={(d) => {
                  setDay(d);
                  setSelected(null);
                }}
              />
            )}
          </section>

          {planning.isSuccess && (
            <section aria-labelledby="planning-jour">
              <SectionHeading
                id="planning-jour"
                number="02"
                title={dayTitle(activeDay)}
              />
              {daySlots.length === 0 ? (
                <p className="m-0 py-3 text-base text-ink-2">
                  Aucun créneau ce jour.
                  {canManage
                    ? ' Ouvrez des créneaux récurrents pour que les fidèles puissent réserver.'
                    : ''}
                </p>
              ) : (
                <DayGrid
                  slots={daySlots}
                  selectedId={current?.id ?? null}
                  onSelect={setSelected}
                />
              )}
              {current && (
                <div className="mt-4" aria-live="polite">
                  {canManage &&
                  current.is_mine &&
                  current.status !== 'bloque' &&
                  dayjs(current.starts_at).isAfter(dayjs()) ? (
                    <CancelSlotForm
                      key={current.id}
                      slot={current}
                      onDone={() => setSelected(null)}
                    />
                  ) : (
                    <p className="m-0 text-sm text-ink-2">
                      {hour(current.starts_at)} · {current.priest_name} ·{' '}
                      {current.status === 'bloque'
                        ? 'retiré'
                        : isBooked(current)
                          ? `pris par ${current.booking!.person}`
                          : 'libre'}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="min-w-0 lg:col-span-4">
          {planning.isSuccess && (
            <DayBookings
              slots={daySlots}
              dayLabel={dayLabel}
              canManage={canManage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
