'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { SlotPicker } from '@/components/signature/slot-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { apiErrorCode, apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { atParish } from '@/utils/parish-name';

import { useBookSlot } from '../api/book-slot';
import { useSlots } from '../api/get-slots';
import type { Slot } from '../api/schemas';
import { monthGrid, monthLabel, monthStartOf, pillName } from '../utils/month';
import { DAY_FORMAT, dayTitle, shortName, slotsOfDay } from '../utils/week';

import { DateTile } from './date-tile';
import { MyBookings } from './my-bookings';

const ANY = 'tous';

/** Prêtre momentanément indisponible (absent), montré grisé à côté des autres. */
export type UnavailablePriest = { id: string; name: string; until: string };

const priestsOf = (slots: Slot[]) => [...new Map(slots.map((s) => [s.priest_id, s.priest_name])).entries()].map(([id, name]) => ({ id, name }));

const pillClass = (checked: boolean) =>
  cn(
    'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-15 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
    checked ? 'border-primary bg-tint-50 font-semibold text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
  );

const PriestPills = ({
  priests,
  unavailable,
  value,
  onChange,
}: {
  priests: { id: string; name: string }[];
  unavailable: UnavailablePriest[];
  value: string;
  onChange: (id: string) => void;
}) => (
  <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="p-0 text-15 font-semibold text-ink">Prêtre</legend>
    <div className="mt-3 flex flex-wrap gap-2">
      {[{ id: ANY, name: 'Tous' }, ...priests].map((p) => {
        const checked = value === p.id;
        return (
          <label key={p.id} className={pillClass(checked)}>
            <input type="radio" name="confession-pretre" className="sr-only" checked={checked} onChange={() => onChange(p.id)} />
            {checked && p.id !== ANY && <Icon name="check" size={16} strokeWidth={2.25} />}
            {p.id === ANY ? p.name : pillName(p.name)}
          </label>
        );
      })}
      {unavailable.map((p) => (
        <span
          key={p.id}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-line bg-surface px-4 text-15 text-ink-3"
        >
          {pillName(p.name)}
          <span className="text-13">· dès le {dayjs(p.until).format('D MMM')}</span>
        </span>
      ))}
    </div>
  </fieldset>
);

const MonthCalendar = ({
  month,
  slots,
  activeDay,
  canGoBack,
  onMonth,
  onDay,
}: {
  month: string;
  slots: Slot[];
  activeDay: string | null;
  canGoBack: boolean;
  onMonth: (delta: number) => void;
  onDay: (day: string) => void;
}) => {
  const today = dayjs().format(DAY_FORMAT);
  return (
    <section aria-labelledby="cal-titre" className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 id="cal-titre" className="m-0 text-16 font-semibold text-ink">
          {monthLabel(month)}
        </h2>
        <span className="flex gap-1">
          <IconButton icon="chevron-gauche" label="Mois précédent" size="sm" disabled={!canGoBack} onClick={() => onMonth(-1)} />
          <IconButton icon="chevron-droite" label="Mois suivant" size="sm" className="text-primary" onClick={() => onMonth(1)} />
        </span>
      </div>
      <div role="group" aria-label={`Jours de ${monthLabel(month).toLowerCase()} avec des créneaux libres`} className="tnum mt-3 grid grid-cols-7 gap-y-1 text-center">
        {['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map((d) => (
          <span key={d} aria-hidden="true" className="text-12 leading-6 text-ink-3">
            {d}
          </span>
        ))}
        {monthGrid(month).map(({ day, inMonth }) => {
          const free = slotsOfDay(slots, day).length;
          const number = dayjs(day).format('D');
          if (!inMonth) {
            return (
              <span key={day} aria-hidden="true" className="flex h-[38px] items-center justify-center text-14 text-tint-200">
                {number}
              </span>
            );
          }
          if (free === 0 || day < today) {
            return (
              <span
                key={day}
                aria-hidden="true"
                className={cn(
                  'mx-auto flex size-[38px] items-center justify-center rounded-full text-14',
                  day === today ? 'border-1.5 border-primary font-semibold text-primary' : day < today ? 'text-ink-4' : 'text-ink-2',
                )}
              >
                {number}
              </span>
            );
          }
          const selected = day === activeDay;
          return (
            <span key={day} className="flex justify-center">
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${dayTitle(day)}, ${free} créneau${free > 1 ? 'x' : ''} libre${free > 1 ? 's' : ''}`}
                onClick={() => onDay(day)}
                className={cn(
                  'hit relative size-[38px] rounded-10 text-14 font-semibold transition-colors',
                  selected ? 'bg-primary-fill text-on-primary' : 'text-ink hover:bg-surface-2',
                  day === today && !selected && 'rounded-full border-1.5 border-primary text-primary',
                )}
              >
                {number}
                <span
                  aria-hidden="true"
                  className={cn('absolute bottom-[5px] left-1/2 size-1 -translate-x-1/2 rounded-full', selected ? 'bg-on-primary' : 'bg-tint-500')}
                />
              </button>
            </span>
          );
        })}
      </div>
      <p className="m-0 mt-3 flex items-center gap-2 border-t border-line pt-3 text-13 text-ink-3">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-tint-500" />
        Jours avec des créneaux libres
      </p>
    </section>
  );
};

const Recap = ({ slot, onBooked }: { slot: Slot | null; onBooked: () => void }) => {
  const book = useBookSlot();
  const taken = apiErrorCode(book.error) === 'slot_taken';

  const confirm = () =>
    slot &&
    book.mutate(slot.id, {
      onSuccess: () => {
        toast.ok('Votre rendez-vous est réservé.');
        onBooked();
      },
    });

  return (
    <section aria-labelledby="recap-titre" aria-live="polite" className="rounded-16 border border-line bg-surface p-6">
      <h2 id="recap-titre" className="m-0 text-18 font-semibold text-ink">
        Votre rendez-vous
      </h2>
      {!slot ? (
        <p className="m-0 mt-3 text-15 text-ink-2">Choisissez un jour puis un créneau : le récapitulatif s’affiche ici avant la réservation.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <DateTile date={slot.starts_at} className="h-16 w-14" />
            <span className="flex flex-col">
              <span className="tnum text-20 font-semibold text-ink">
                {dayjs(slot.starts_at).format('HH:mm')} – {dayjs(slot.ends_at).format('HH:mm')}
              </span>
              <span className="text-14 text-ink-2">{dayTitle(slot.starts_at)} {dayjs(slot.starts_at).format('YYYY')}</span>
            </span>
          </div>
          <dl className="m-0 mt-4 flex flex-col">
            {[
              ['Prêtre', slot.priest_name],
              ['Lieu', slot.place.name],
              ['Durée', `${dayjs(slot.ends_at).diff(dayjs(slot.starts_at), 'minute')} minutes`],
            ].map(([label, value], index) => (
              <div key={label} className={cn('flex justify-between gap-3 border-t border-line', index === 2 ? 'pt-3' : 'py-3')}>
                <dt className="text-14 text-ink-3">{label}</dt>
                <dd className="m-0 text-right text-14 font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {book.isError && (
            <Notice
              role="alert"
              className="mt-4"
              tone={taken ? 'warn' : 'err'}
              title={taken ? 'Ce créneau vient d’être pris' : 'La réservation n’a pas abouti'}
            >
              {taken ? 'Choisissez-en un autre : la liste vient d’être mise à jour.' : apiErrorMessage(book.error)}
            </Notice>
          )}
          <Button block size="xl" className="mt-5" onClick={confirm} disabled={book.isPending}>
            Réserver {hour(slot.starts_at)}
          </Button>
          <p className="m-0 mt-3 text-center text-13 text-ink-3">
            Rappel la veille. Annulable jusqu’au {dayjs(slot.starts_at).subtract(1, 'hour').format('dddd D')},{' '}
            {hour(dayjs(slot.starts_at).subtract(1, 'hour'))}.
          </p>
        </>
      )}
    </section>
  );
};

const PlaceCard = ({ slot }: { slot: Slot }) => (
  <section aria-labelledby="lieu-titre" className="flex flex-wrap items-center gap-4 rounded-16 border border-line bg-paper px-6 py-5">
    <Icon name="pin" size={22} className="shrink-0 text-ink-2" />
    <span className="flex min-w-0 flex-1 flex-col">
      <span id="lieu-titre" className="text-15 font-semibold text-ink">
        {slot.place.name}
      </span>
      {slot.place.address && <span className="text-14 text-ink-2">{slot.place.address}</span>}
    </span>
    {slot.place.address && (
      <a
        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${slot.place.name}, ${slot.place.address}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'outline' })}
      >
        <Icon name="itineraire" size={18} />
        Itinéraire
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    )}
  </section>
);

/**
 * Rendez-vous de confession (FID-Confession-RDV, MOB-Confession). La réservation ne porte
 * que sur le créneau : AUCUN champ de contenu (RG-08).
 */
export const ConfessionBooking = ({
  nodeId,
  parishName,
  unavailablePriests = [],
}: {
  nodeId: string | null;
  parishName?: string | null;
  unavailablePriests?: UnavailablePriest[];
}) => {
  const today = dayjs().format(DAY_FORMAT);
  const thisMonth = monthStartOf(today);
  const [month, setMonth] = useState(thisMonth);
  const [priest, setPriest] = useState<string>(ANY);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const slots = useSlots(nodeId, month < today ? today : month);

  const inMonth = (slots.data ?? []).filter((s) => monthStartOf(s.starts_at) === month);
  const priests = priestsOf(inMonth);
  const filtered = priest === ANY ? inMonth : inMonth.filter((s) => s.priest_id === priest);
  const days = [...new Set(filtered.map((s) => dayjs(s.starts_at).format(DAY_FORMAT)))].sort();
  const activeDay = day && days.includes(day) ? day : (days[0] ?? null);
  const daySlots = activeDay ? slotsOfDay(filtered, activeDay) : [];
  const selected = daySlots.find((s) => s.id === slotId) ?? null;

  const moveMonth = (delta: number) => {
    setMonth(dayjs(month).add(delta, 'month').format(DAY_FORMAT));
    setDay(null);
    setSlotId(null);
  };

  if (!nodeId) {
    return (
      <EmptyState icon="paroisse" title="Choisissez d’abord votre paroisse">
        Les créneaux de confession sont ceux de la paroisse que vous suivez.{' '}
        <NextLink href={paths.app.profil.getHref()}>Choisir ma paroisse</NextLink>
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
      <div className="flex min-w-0 flex-col gap-6">
        <PriestPills
          priests={priests}
          unavailable={unavailablePriests.filter((u) => !priests.some((p) => p.id === u.id))}
          value={priest}
          onChange={(id) => {
            setPriest(id);
            setSlotId(null);
          }}
        />
        {slots.isPending ? (
          <LoadingBlock label="Chargement des créneaux…" lines={3} />
        ) : slots.isError ? (
          <EmptyState tone="err" icon="alerte" title="Les créneaux n’ont pas pu être chargés">
            Vérifiez votre connexion puis réessayez.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[312px_minmax(0,1fr)]">
            <MonthCalendar
              month={month}
              slots={filtered}
              activeDay={activeDay}
              canGoBack={month > thisMonth}
              onMonth={moveMonth}
              onDay={(d) => {
                setDay(d);
                setSlotId(null);
              }}
            />
            <section aria-labelledby="slots-titre" className="min-w-0">
              {activeDay ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 id="slots-titre" className="m-0 text-18 font-semibold text-ink">
                      {dayTitle(activeDay)}
                    </h2>
                    <span className="whitespace-nowrap text-13 text-ink-3">
                      {daySlots.length} libre{daySlots.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-3">
                    <SlotPicker
                      label={`Créneaux du ${dayTitle(activeDay).toLowerCase()}`}
                      slots={daySlots.map((s) => ({
                        id: s.id,
                        startsAt: s.starts_at,
                        priest: priest === ANY ? shortName(s.priest_name) : 'Libre',
                        available: true,
                      }))}
                      selectedId={selected?.id ?? null}
                      onSelect={setSlotId}
                    />
                  </div>
                </>
              ) : (
                <p id="slots-titre" className="m-0 text-15 text-ink-2">
                  Aucun créneau libre en {monthLabel(month).toLowerCase()}
                  {parishName ? ` ${atParish(parishName)}` : ''}. Essayez le mois suivant, ou{' '}
                  <NextLink href={paths.app.pretres.list.getHref()}>écrivez à un prêtre</NextLink> pour convenir d’un autre moment.
                </p>
              )}
            </section>
          </div>
        )}
        {daySlots[0] && <PlaceCard slot={selected ?? daySlots[0]} />}
      </div>

      <aside aria-label="Réservation et rendez-vous à venir" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
        <Recap slot={selected} onBooked={() => setSlotId(null)} />
        <div className="flex gap-3 rounded-16 bg-tint-50 px-6 py-5 text-tint-900">
          <Icon name="bouclier" size={20} className="mt-0.5 shrink-0 text-primary" />
          <span className="flex flex-col">
            <span className="text-15 font-semibold">Aucun motif n’est demandé</span>
            <span className="mt-1 text-14">Le prêtre voit seulement votre nom et l’heure du rendez-vous. Ni motif, ni message.</span>
          </span>
        </div>
        <MyBookings />
      </aside>
    </div>
  );
};
