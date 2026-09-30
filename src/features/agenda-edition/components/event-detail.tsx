'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { plural, pluralWord } from '@/utils/plural';

import { downloadRegistrationsCsv, useEventRegistrations } from '../api/event-registrations';
import { EVENT_TYPE_LABELS, type StaffEvent, useCancelEvent } from '../api/staff-events';

/** « Sam. 10.10 · 8 h 30-16 h » ; sur plusieurs jours : « Sam. 10.10 8 h 30 → dim. 11.10 16 h ». */
export const eventWhen = (event: Pick<StaffEvent, 'start_at' | 'end_at'>) => {
  const start = dayjs(event.start_at);
  const end = dayjs(event.end_at);
  const day = start.format('ddd DD.MM');
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  if (start.isSame(end, 'day')) return `${cap} · ${hour(start)}-${hour(end)}`;
  return `${cap} ${hour(start)} → ${end.format('ddd DD.MM')} ${hour(end)}`;
};

const Registrations = ({ event }: { event: StaffEvent }) => {
  const registrations = useEventRegistrations(event.id);
  const [exporting, setExporting] = useState(false);
  const max = event.max_participants;
  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadRegistrationsCsv(event.id);
    } catch (error) {
      toast.err(apiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="mt-4 rounded-12 border border-line p-3.5">
      <p className="m-0 flex items-baseline gap-2">
        <span className="tnum text-20 font-semibold text-ink">{event.seats_taken}</span>
        <span className="text-14 text-ink-2">
          {max ? `/ ${plural(max, 'place', 'places')}` : pluralWord(event.seats_taken, 'personne', 'personnes')} ·{' '}
          {plural(event.registrations_count, 'inscription', 'inscriptions')}
        </span>
      </p>
      {max && (
        <span role="img" aria-label={`${plural(event.seats_taken, 'place réservée', 'places réservées')} sur ${max}`} className="mt-2 block h-1.5 w-full rounded-full bg-surface-2">
          <span className="block h-full origin-left animate-jb-grow rounded-full bg-primary-fill" style={{ width: `${Math.min(100, (event.seats_taken / max) * 100)}%` }} />
        </span>
      )}
      <p className="m-0 mt-1.5 text-13 text-ink-3">
        {max && (event.is_full ? 'Complet' : plural(event.seats_remaining ?? 0, 'place restante', 'places restantes'))}
        {max && event.registration_closes_at && ' · '}
        {event.registration_closes_at && `clôture ${dayjs(event.registration_closes_at).format('ddd DD.MM')} à ${hour(event.registration_closes_at)}`}
      </p>
      {registrations.data && registrations.data.results.length > 0 && (
        <ul className="m-0 mt-3 list-none p-0">
          {registrations.data.results.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-1.5 text-14">
              <Avatar name={r.full_name || r.email} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block">
                  <span className="text-ink">{r.full_name || r.email}</span>
                  {r.seats > 1 && <span className="text-ink-3"> · {r.seats} personnes</span>}
                </span>
                {r.note && <span className="block text-13 text-ink-2">« {frenchTypo(r.note)} »</span>}
              </span>
              <span className="tnum text-13 text-ink-3">{dayjs(r.registered_at).format('DD.MM')}</span>
            </li>
          ))}
        </ul>
      )}
      {registrations.data && registrations.data.count > 3 && (
        <p className="m-0 mt-1 text-13 text-ink-3">et {plural(registrations.data.count - 3, 'autre', 'autres')}</p>
      )}
      {event.registrations_count > 0 && (
        <Button variant="ghost" size="sm" className="-ml-2 mt-2" disabled={exporting} onClick={exportCsv}>
          <Icon name="export" size={16} /> {exporting ? 'Export…' : 'Exporter les inscrits'}
        </Button>
      )}
    </div>
  );
};

type EventDetailProps = { event: StaffEvent; onClose: () => void; onEdit: () => void; onDuplicate: () => void };

/** Détail de l'événement choisi, sous la liste du jour (PAR-Agenda) : inscrits, modifier, dupliquer, annuler. */
export const EventDetail = ({ event, onClose, onEdit, onDuplicate }: EventDetailProps) => {
  const [confirm, setConfirm] = useState(false);
  const cancel = useCancelEvent({
    onSuccess: () => {
      setConfirm(false);
      toast.ok('Événement annulé : les inscrits sont prévenus.');
    },
  });
  return (
    <section aria-labelledby="ag-titre" className="mt-4 border-t border-line pt-4">
      <div className="flex items-start justify-between gap-3">
        <p className="tnum m-0 text-13 font-medium text-primary">{eventWhen(event)}</p>
        <button type="button" aria-label="Fermer le détail" onClick={onClose} className="hit -mr-1 -mt-1 inline-flex size-8 items-center justify-center rounded-8 text-ink-2 hover:bg-surface-2">
          <Icon name="x" size={16} />
        </button>
      </div>
      <h3 id="ag-titre" className="m-0 mt-1 text-17 font-semibold text-ink">
        {frenchTypo(event.title)}
      </h3>
      {event.is_cancelled && (
        <p className="m-0 mt-2" role="status">
          <Badge tone="err" dot>
            Événement annulé
          </Badge>
        </p>
      )}
      <p className="m-0 mt-1 text-14 text-ink-2">
        {EVENT_TYPE_LABELS[event.event_type]}
        {event.location && <> · {event.location}</>}
      </p>
      {event.description && <p className="m-0 mt-2 text-14 text-ink-2">{frenchTypo(event.description)}</p>}
      <Registrations event={event} />
      <div className="mt-4 flex gap-2">
        {!event.is_cancelled && (
          <Button variant="outline" className="flex-1 text-14" onClick={onEdit}>
            <Icon name="crayon" size={18} className="text-ink-2" /> Modifier
          </Button>
        )}
        <Button variant="outline" className="flex-1 text-14" onClick={onDuplicate}>
          <Icon name="copier" size={18} className="text-ink-2" /> Dupliquer
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <NextLink href={paths.app.paroisse.evenement.getHref(event.id)} className="hit text-14 font-semibold">
          Voir côté fidèle
        </NextLink>
        {!event.is_cancelled && (
          <Button variant="ghost" size="sm" className="text-err hover:bg-err-bg hover:text-err" onClick={() => setConfirm(true)}>
            Annuler l’événement
          </Button>
        )}
      </div>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Annuler cet événement ?"
        description={`${event.registrations_count > 1 ? `Les ${event.registrations_count} inscrits reçoivent` : 'La personne inscrite reçoit'} une notification. L’annulation est définitive.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Garder l’événement
            </Button>
            <Button variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(event.id)}>
              {cancel.isPending ? 'Annulation…' : 'Annuler l’événement'}
            </Button>
          </>
        }
      >
        {cancel.isError && (
          <p role="alert" className="m-0 text-14 text-err">
            {apiErrorMessage(cancel.error)}
          </p>
        )}
      </Modal>
    </section>
  );
};
