'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { SlotPicker } from '@/components/signature/slot-picker';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { apiErrorCode, apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import { useBookSlot } from '../api/book-slot';
import { useSlots } from '../api/get-slots';
import type { Slot } from '../api/schemas';
import {
  DAY_FORMAT,
  dayTitle,
  shortName,
  slotsOfDay,
  weekDays,
  weekLabel,
  weekStartOf,
} from '../utils/week';

import { MyBookings } from './my-bookings';

const ANY = 'tous';

const priestsOf = (slots: Slot[]) =>
  [...new Map(slots.map((s) => [s.priest_id, s.priest_name])).entries()].map(
    ([id, name]) => ({ id, name }),
  );

const DayButton = ({
  day,
  slots,
  selected,
  onSelect,
}: {
  day: string;
  slots: Slot[];
  selected: boolean;
  onSelect: () => void;
}) => {
  const d = dayjs(day);
  const today = dayjs().format(DAY_FORMAT);
  const past = day < today;
  const disabled = past || slots.length === 0;
  const hint = past
    ? 'Passé'
    : slots.length === 0
      ? day === today
        ? 'Aujourd’hui'
        : 'Aucun'
      : `${hour(slots[0].starts_at)}-${hour(slots.at(-1)!.ends_at)}`;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={disabled ? undefined : selected}
      aria-label={`${dayTitle(day)}${disabled ? ` : ${hint.toLowerCase()}` : `, ${slots.length} créneau${slots.length > 1 ? 'x' : ''} libre${slots.length > 1 ? 's' : ''}`}`}
      onClick={onSelect}
      className={cn(
        'flex min-h-[76px] min-w-[88px] flex-col items-start gap-1 rounded border px-3 py-2.5 text-left',
        disabled && 'cursor-not-allowed border-dashed border-line text-ink-3',
        !disabled &&
          selected &&
          'border-primary-fill bg-primary-fill text-on-primary',
        !disabled &&
          !selected &&
          'border-line bg-surface text-ink hover:border-primary',
      )}
    >
      <span className="text-sm capitalize">{d.format('ddd')}</span>
      <span className="font-serif text-h3 leading-none">{d.format('D')}</span>
      <span
        className={cn(
          'tnum text-meta',
          selected && !disabled ? 'text-tint-100' : '',
        )}
      >
        {hint}
      </span>
    </button>
  );
};

const Recap = ({
  slot,
  onBooked,
}: {
  slot: Slot | null;
  onBooked: () => void;
}) => {
  const book = useBookSlot();
  const taken = apiErrorCode(book.error) === 'slot_taken';

  if (!slot) {
    return (
      <p className="m-0 text-base text-ink-2">
        Choisissez un jour puis un créneau : le récapitulatif s’affiche ici
        avant confirmation.
      </p>
    );
  }
  const confirm = () =>
    book.mutate(slot.id, {
      onSuccess: () => {
        toast.ok('Votre rendez-vous est réservé.');
        onBooked();
      },
    });
  const deadline = dayjs(slot.starts_at).subtract(1, 'hour');

  return (
    <div className="flex flex-col gap-4">
      <p className="tnum m-0 text-meta text-ink-2">Votre rendez-vous</p>
      <h2 className="m-0 font-serif text-h2 font-normal text-ink">
        {dayTitle(slot.starts_at)},{' '}
        <em className="italic text-primary">{hour(slot.starts_at)}</em>
      </h2>
      <dl className="m-0 grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-2 text-base">
        <dt className="text-ink-3">Prêtre</dt>
        <dd className="m-0 text-ink">{slot.priest_name}</dd>
        <dt className="text-ink-3">Lieu</dt>
        <dd className="m-0 text-ink">
          {slot.place.name}
          {slot.place.address ? `, ${slot.place.address}` : ''}
        </dd>
      </dl>
      <Notice tone="info" title="Aucun contenu n’est demandé.">
        Ni motif, ni message : le prêtre voit seulement votre nom et l’heure.
      </Notice>
      {book.isError && (
        <Notice
          tone={taken ? 'warn' : 'err'}
          title={
            taken
              ? 'Ce créneau vient d’être pris'
              : 'La réservation n’a pas abouti'
          }
        >
          {taken
            ? 'Choisissez-en un autre : la liste vient d’être mise à jour.'
            : apiErrorMessage(book.error)}
        </Notice>
      )}
      <Button block size="lg" onClick={confirm} disabled={book.isPending}>
        Confirmer le rendez-vous
      </Button>
      <p className="tnum m-0 text-meta text-ink-3">
        Annulable jusqu’au {deadline.format('dddd D')}, {hour(deadline)}.
      </p>
    </div>
  );
};

/**
 * Rendez-vous de confession (FID-Confession-RDV, MOB-Confession). La réservation ne porte
 * que sur le créneau : AUCUN champ de contenu (RG-08).
 */
export const ConfessionBooking = ({
  nodeId,
  parishName,
}: {
  nodeId: string | null;
  parishName?: string | null;
}) => {
  const thisWeek = weekStartOf(dayjs());
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [priest, setPriest] = useState<string>(ANY);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const today = dayjs().format(DAY_FORMAT);
  const slots = useSlots(nodeId, weekStart < today ? today : weekStart);

  const days = weekDays(weekStart);
  const inWeek = (slots.data ?? []).filter((s) =>
    days.includes(dayjs(s.starts_at).format(DAY_FORMAT)),
  );
  const priests = priestsOf(inWeek);
  const filtered =
    priest === ANY ? inWeek : inWeek.filter((s) => s.priest_id === priest);
  const activeDay =
    day && slotsOfDay(filtered, day).length
      ? day
      : (days.find((d) => slotsOfDay(filtered, d).length) ?? null);
  const daySlots = activeDay ? slotsOfDay(filtered, activeDay) : [];
  const selected = daySlots.find((s) => s.id === slotId) ?? null;

  const moveWeek = (delta: number) => {
    setWeekStart(dayjs(weekStart).add(delta, 'week').format(DAY_FORMAT));
    setDay(null);
    setSlotId(null);
  };

  if (!nodeId) {
    return (
      <EmptyState icon="paroisse" title="Choisissez d’abord votre paroisse">
        Les créneaux de confession sont ceux de la paroisse que vous suivez.{' '}
        <NextLink href={paths.app.profil.getHref()}>
          Choisir ma paroisse
        </NextLink>
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
        <fieldset className="m-0 border-0 p-0">
          <legend className="tnum mb-3 w-full border-t border-line-strong pt-2 text-meta text-ink-2">
            <span className="text-primary">01</span> — Prêtre
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Choice
              type="radio"
              name="confession-pretre"
              label="Sans préférence"
              description="1er disponible"
              checked={priest === ANY}
              onChange={() => {
                setPriest(ANY);
                setSlotId(null);
              }}
            />
            {priests.map((p) => (
              <Choice
                key={p.id}
                type="radio"
                name="confession-pretre"
                label={p.name}
                checked={priest === p.id}
                onChange={() => {
                  setPriest(p.id);
                  setSlotId(null);
                }}
              />
            ))}
          </div>
        </fieldset>

        <section aria-labelledby="confession-jour">
          <SectionHeading
            id="confession-jour"
            number="02"
            title={`Jour · ${weekLabel(weekStart)}`}
            aside={
              <span className="flex items-center gap-1">
                <IconButton
                  icon="chevron-gauche"
                  label="Semaine précédente"
                  size="sm"
                  disabled={weekStart <= thisWeek}
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
          {slots.isPending ? (
            <LoadingBlock label="Chargement des créneaux…" lines={2} />
          ) : slots.isError ? (
            <EmptyState
              tone="err"
              icon="alerte"
              title="Les créneaux n’ont pas pu être chargés"
            >
              Vérifiez votre connexion puis réessayez.
            </EmptyState>
          ) : (
            <>
              <div
                role="group"
                aria-label={`Jours de la ${weekLabel(weekStart)}`}
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:px-0"
              >
                {days.map((d) => (
                  <DayButton
                    key={d}
                    day={d}
                    slots={slotsOfDay(filtered, d)}
                    selected={d === activeDay}
                    onSelect={() => {
                      setDay(d);
                      setSlotId(null);
                    }}
                  />
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="m-0 mt-3 text-sm text-ink-2">
                  Aucun créneau libre cette semaine
                  {parishName ? ` à ${parishName}` : ''}. Essayez la semaine
                  suivante, ou{' '}
                  <NextLink href={paths.app.pretres.list.getHref()}>
                    écrivez à un prêtre
                  </NextLink>{' '}
                  pour convenir d’un autre moment.
                </p>
              )}
            </>
          )}
        </section>

        {activeDay && daySlots.length > 0 && (
          <section aria-labelledby="confession-creneaux">
            <SectionHeading
              id="confession-creneaux"
              number="03"
              title={`Créneau · ${dayTitle(activeDay).toLowerCase()}`}
              aside={`${daySlots.length} libre${daySlots.length > 1 ? 's' : ''}`}
            />
            <SlotPicker
              label={`Créneaux du ${dayTitle(activeDay).toLowerCase()}`}
              slots={daySlots.map((s) => ({
                id: s.id,
                startsAt: s.starts_at,
                priest: shortName(s.priest_name),
                available: true,
              }))}
              selectedId={selected?.id ?? null}
              onSelect={setSlotId}
            />
            {daySlots[0] && (
              <p className="m-0 mt-3 text-sm text-ink-2">
                {daySlots[0].place.name}
              </p>
            )}
          </section>
        )}
      </div>

      <aside
        aria-label="Confirmation et rendez-vous à venir"
        className="flex min-w-0 flex-col gap-10 lg:col-span-5"
      >
        <section
          aria-live="polite"
          className="border border-line-strong bg-surface p-6"
        >
          <Recap slot={selected} onBooked={() => setSlotId(null)} />
        </section>
        <MyBookings />
      </aside>
    </div>
  );
};
