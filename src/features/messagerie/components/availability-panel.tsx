'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-error-details';
import {
  availabilityStatus,
  isAbsent,
  WEEKDAYS_SHORT,
  windowsLabel,
} from '@/utils/availability-label';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import {
  type Availability,
  type ReplyWindow,
  useAvailability,
  useUpdateAvailability,
} from '../api/availability';

type Mode = 'en_ligne' | 'absent' | 'plages';

const modeOf = (a: Availability): Mode =>
  isAbsent(a) ? 'absent' : a.reply_windows.length ? 'plages' : 'en_ligne';

const MODES: { value: Mode; label: string }[] = [
  { value: 'en_ligne', label: 'En ligne' },
  { value: 'absent', label: 'Absent jusqu’au…' },
  { value: 'plages', label: 'Selon mes plages' },
];

const WindowsEditor = ({
  initial,
  pending,
  onSave,
  onClose,
}: {
  initial: ReplyWindow[];
  pending: boolean;
  onSave: (windows: ReplyWindow[]) => void;
  onClose: () => void;
}) => {
  const [rows, setRows] = useState<ReplyWindow[]>(
    initial.length ? initial : [{ weekday: 0, start: '09:00', end: '12:00' }],
  );
  const invalid = rows.some((r) => !r.start || !r.end || r.end <= r.start);
  const update = (index: number, patch: Partial<ReplyWindow>) =>
    setRows((current) =>
      current.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Mes plages de réponse"
      description="Les fidèles voient quand vous répondez en général. Rien ne vous oblige à répondre en dehors."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={invalid || pending} onClick={() => onSave(rows)}>
            Enregistrer les plages
          </Button>
        </>
      }
    >
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((row, index) => (
          <li
            key={index}
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
          >
            <Field id={`plage-jour-${index}`} label="Jour">
              <Select
                value={row.weekday}
                onChange={(e) =>
                  update(index, { weekday: Number(e.target.value) })
                }
              >
                {WEEKDAYS_SHORT.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id={`plage-debut-${index}`} label="De">
              <Input
                type="time"
                value={row.start}
                onChange={(e) => update(index, { start: e.target.value })}
              />
            </Field>
            <Field id={`plage-fin-${index}`} label="À">
              <Input
                type="time"
                value={row.end}
                onChange={(e) => update(index, { end: e.target.value })}
              />
            </Field>
            <Button
              variant="tertiary"
              onClick={() =>
                setRows((current) => current.filter((_, i) => i !== index))
              }
            >
              Retirer
            </Button>
          </li>
        ))}
      </ul>
      {invalid && (
        <p role="alert" className="m-0 mt-3 text-sm text-err">
          Chaque plage doit finir après son début.
        </p>
      )}
      <Button
        variant="tertiary"
        className="mt-2"
        onClick={() =>
          setRows((current) => [
            ...current,
            { weekday: 5, start: '09:00', end: '12:00' },
          ])
        }
      >
        Ajouter une plage
      </Button>
    </Modal>
  );
};

/** « Ma disponibilité » du prêtre (PAR-Messagerie, EF-PRE-07). */
export const AvailabilityPanel = () => {
  const availability = useAvailability();
  const update = useUpdateAvailability();
  const [editing, setEditing] = useState(false);
  const [absentUntil, setAbsentUntil] = useState('');
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  if (availability.isPending)
    return (
      <p className="tnum m-0 text-meta text-ink-3">
        Chargement de votre disponibilité…
      </p>
    );
  if (availability.isError)
    return (
      <p role="alert" className="m-0 text-sm text-err">
        Votre disponibilité n’a pas pu être chargée.
      </p>
    );

  const data = availability.data;
  const mode = pendingMode ?? modeOf(data);
  const save = (body: Partial<Availability>, done?: () => void) =>
    update.mutate(body, {
      onSuccess: () => {
        setPendingMode(null);
        done?.();
        toast.ok('Disponibilité enregistrée.');
      },
      onError: (error) => toast.err(apiErrorMessage(error)),
    });

  const choose = (next: Mode) => {
    if (next === 'en_ligne') save({ absent_until: null, reply_windows: [] });
    if (next === 'absent') setPendingMode('absent');
    if (next === 'plages') {
      setPendingMode(null);
      setEditing(true);
    }
  };
  const status = availabilityStatus(data);
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <div
        role="radiogroup"
        aria-labelledby="dispo-titre"
        className="flex flex-wrap items-center gap-3"
      >
        <span id="dispo-titre" className="tnum text-meta text-ink-3">
          Ma disponibilité
        </span>
        <div className="flex flex-wrap rounded border border-line-strong">
          {MODES.map((m, i) => (
            <label
              key={m.value}
              className={cn(
                'inline-flex h-11 cursor-pointer items-center gap-2 px-3.5 text-sm',
                i > 0 && 'border-l border-line-strong',
                mode === m.value
                  ? 'bg-ink font-medium text-paper'
                  : 'text-ink hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name="disponibilite"
                className="size-4"
                checked={mode === m.value}
                disabled={update.isPending}
                onChange={() => choose(m.value)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>
      {mode === 'absent' && !isAbsent(data) && (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (absentUntil) save({ absent_until: absentUntil });
          }}
        >
          <Field id="dispo-absent" label="Absent jusqu’au">
            <Input
              type="date"
              min={tomorrow}
              value={absentUntil}
              required
              onChange={(e) => setAbsentUntil(e.target.value)}
            />
          </Field>
          <Button
            type="submit"
            size="md"
            disabled={!absentUntil || update.isPending}
          >
            Enregistrer
          </Button>
        </form>
      )}
      <p className="m-0 flex flex-wrap items-center gap-3 text-sm text-ink-2">
        {data.reply_windows.length > 0 && (
          <span>Plages : {windowsLabel(data.reply_windows)}</span>
        )}
        <Button variant="tertiary" size="sm" onClick={() => setEditing(true)}>
          {data.reply_windows.length ? 'Modifier' : 'Définir mes plages'}
        </Button>
        <span aria-hidden="true" className="h-3.5 w-px bg-line" />
        <span className={status.tone === 'ok' ? 'text-ok' : 'text-warn'}>
          Les fidèles voient : {status.label}
          {status.detail ? ` · ${status.detail}` : ''}
        </span>
      </p>
      <Switch
        id="dispo-nouveaux"
        label="J’accepte de nouveaux échanges"
        description={
          data.accepts_new_conversations
            ? undefined
            : 'Vous n’apparaissez plus dans la liste des prêtres joignables.'
        }
        checked={data.accepts_new_conversations}
        disabled={update.isPending}
        onCheckedChange={(checked) =>
          save({ accepts_new_conversations: checked })
        }
      />
      {editing && (
        <WindowsEditor
          initial={data.reply_windows}
          pending={update.isPending}
          onClose={() => setEditing(false)}
          onSave={(windows) =>
            save({ reply_windows: windows, absent_until: null }, () =>
              setEditing(false),
            )
          }
        />
      )}
    </div>
  );
};
