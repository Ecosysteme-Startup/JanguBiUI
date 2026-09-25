'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

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
    <div className="mt-5 border-t border-line pt-4">
      <p className="m-0 flex items-baseline gap-2">
        <span className="tnum font-serif text-h3 text-ink">{event.registrations_count}</span>
        <span className="text-sm text-ink-2">{max ? `/ ${max} inscrits` : `inscrit${event.registrations_count > 1 ? 's' : ''}`}</span>
      </p>
      {max && (
        <>
          <span role="img" aria-label={`${event.registrations_count} inscrits sur ${max} places`} className="mt-2 block h-1.5 w-full rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-primary-fill" style={{ width: `${Math.min(100, (event.registrations_count / max) * 100)}%` }} />
          </span>
          <p className="m-0 mt-1.5 text-sm text-ink-3">
            {event.is_full ? 'Complet' : `${max - event.registrations_count} places restantes`}
          </p>
        </>
      )}
      {registrations.data && registrations.data.results.length > 0 && (
        <ul className="m-0 mt-3 list-none p-0">
          {registrations.data.results.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-1.5 text-sm">
              <Avatar name={r.full_name || r.email} size={28} />
              <span className="flex-1 text-ink">{r.full_name || r.email}</span>
              <span className="tnum text-meta text-ink-3">{dayjs(r.registered_at).format('DD.MM')}</span>
            </li>
          ))}
        </ul>
      )}
      {registrations.data && registrations.data.count > 3 && (
        <p className="m-0 mt-1 text-sm text-ink-3">et {registrations.data.count - 3} autres</p>
      )}
      {event.registrations_count > 0 && (
        <Button variant="secondary" size="sm" className="mt-3" disabled={exporting} onClick={exportCsv}>
          <Icon name="export" size={16} /> {exporting ? 'Export…' : 'Exporter les inscrits'}
        </Button>
      )}
    </div>
  );
};

type EventDetailProps = { event: StaffEvent; onClose: () => void; onEdit: () => void };

/** Détail d'un événement sélectionné (popover de la maquette PAR-Agenda). */
export const EventDetail = ({ event, onClose, onEdit }: EventDetailProps) => {
  const [confirm, setConfirm] = useState(false);
  const cancel = useCancelEvent({
    onSuccess: () => {
      setConfirm(false);
      toast.ok('Événement annulé : les inscrits sont prévenus.');
    },
  });
  return (
    <section aria-labelledby="ag-titre" className="rounded border border-line-strong bg-paper p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="tnum m-0 text-meta text-primary">{eventWhen(event)}</p>
        <button type="button" aria-label="Fermer le détail" onClick={onClose} className="hit inline-flex size-9 items-center justify-center rounded hover:bg-surface-2">
          <Icon name="x" size={18} />
        </button>
      </div>
      <h2 id="ag-titre" className="m-0 mt-2 font-serif text-h3 font-normal text-ink">
        {frenchTypo(event.title)}
      </h2>
      {event.is_cancelled && (
        <p className="m-0 mt-2 text-sm font-semibold text-err" role="status">
          Événement annulé
        </p>
      )}
      <p className="m-0 mt-2 text-sm text-ink-2">
        {EVENT_TYPE_LABELS[event.event_type]}
        {event.location && <> · {event.location}</>}
      </p>
      {event.description && <p className="m-0 mt-2 text-sm text-ink-2">{frenchTypo(event.description)}</p>}
      <Registrations event={event} />
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {!event.is_cancelled && (
          <>
            <Button size="sm" onClick={onEdit}>
              <Icon name="crayon" size={16} /> Modifier
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
              Annuler l’événement
            </Button>
          </>
        )}
        <NextLink href={paths.app.paroisse.evenement.getHref(event.id)} className="text-sm font-medium">
          Voir côté fidèle
        </NextLink>
      </div>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Annuler cet événement ?"
        description={`Les ${event.registrations_count} inscrits reçoivent une notification. L’annulation est définitive.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Garder l’événement
            </Button>
            <Button variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(event.id)}>
              {cancel.isPending ? 'Annulation…' : 'Annuler l’événement'}
            </Button>
          </>
        }
      >
        {cancel.isError && (
          <p role="alert" className="m-0 text-sm text-err">
            {apiErrorMessage(cancel.error)}
          </p>
        )}
      </Modal>
    </section>
  );
};
