'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { useNotifications } from '@/components/ui/notifications';

import {
  type EvenementInput,
  TYPES_EVENEMENT as EVENT_TYPES,
  useCreerEvenement,
} from '../api/staff-events';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

interface EventFormProps {
  /** Nœud (paroisse, CEB…) de l'événement : `evenements.gerer` requis dessus. */
  nodeId: string;
  onSuccess?: () => void;
}

/** Création d'un événement (`POST /v1/staff/agenda/`). */
export function EventForm({ nodeId, onSuccess }: EventFormProps) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('mass');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [dateError, setDateError] = useState('');

  const { mutate: createEvent, isPending } = useCreerEvenement();
  const apresCreation = {
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Événement créé',
        message: "L'événement a été publié.",
      });
      setTitle('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setLocation('');
      setMaxParticipants('');
      setDateError('');
      onSuccess?.();
    },
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startAt || !endAt || !location) return;
    if (endAt <= startAt) {
      setDateError('La date de fin doit être après la date de début.');
      return;
    }
    setDateError('');

    const payload: EvenementInput = {
      node_id: nodeId,
      title: title.trim(),
      description: description.trim(),
      event_type: eventType,
      start_at: startAt,
      end_at: endAt,
      location: location.trim(),
      max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
    };
    createEvent(payload, apresCreation);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="evt-title" className={labelClass}>
          Titre *
        </label>
        <input
          id="evt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Messe de Pentecôte, Retraite paroissiale…"
          required
        />
      </div>

      <div>
        <label htmlFor="evt-type" className={labelClass}>
          Type
        </label>
        <select
          id="evt-type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className={inputClass}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="evt-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="evt-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Détails de l'événement…"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="evt-start" className={labelClass}>
            Début *
          </label>
          <input
            id="evt-start"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="evt-end" className={labelClass}>
            Fin *
          </label>
          <input
            id="evt-end"
            type="datetime-local"
            value={endAt}
            onChange={(e) => {
              setEndAt(e.target.value);
              setDateError('');
            }}
            className={inputClass}
            required
          />
        </div>
      </div>
      {dateError && <p className="text-xs text-destructive">{dateError}</p>}

      <div>
        <label htmlFor="evt-location" className={labelClass}>
          Lieu *
        </label>
        <input
          id="evt-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
          placeholder="Église Saint-Jean, Salle paroissiale…"
          required
        />
      </div>

      <div>
        <label htmlFor="evt-max" className={labelClass}>
          Participants max (optionnel)
        </label>
        <input
          id="evt-max"
          type="number"
          min="1"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          className={inputClass}
          placeholder="Illimité si vide"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        isLoading={isPending}
        disabled={!title || !startAt || !endAt || !location}
      >
        Publier l&apos;événement
      </Button>
    </form>
  );
}
