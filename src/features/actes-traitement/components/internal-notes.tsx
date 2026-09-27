'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useAddNote } from '../api/add-note';
import { useNotes } from '../api/get-notes';

const schema = z.object({ content: z.string().trim().min(1, 'La note est vide.').max(2000, '2 000 caractères au plus.') });
type Values = z.infer<typeof schema>;

/** « hier, 11:25 », « 22.09, 11:25 » */
const stamp = (iso: string) => {
  const d = dayjs(iso);
  const day = d.isSame(dayjs(), 'day') ? 'aujourd’hui' : d.isSame(dayjs().subtract(1, 'day'), 'day') ? 'hier' : d.format('DD.MM');
  return `${day}, ${d.format('H:mm')}`;
};

/** Notes internes de l'équipe : jamais visibles du fidèle (EF-ACT-02, maquette « Notes et message »). */
export const InternalNotes = ({ nodeId, requestId }: { nodeId: string; requestId: string }) => {
  const notes = useNotes(nodeId, requestId);
  const { data: me } = useMe();
  const { register, handleSubmit, reset, control, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { content: '' } });
  const draft = useWatch({ control, name: 'content' });
  const add = useAddNote(nodeId, requestId, { onSuccess: () => reset({ content: '' }) });
  const error = formState.errors.content?.message ?? add.error?.message;

  return (
    <section aria-labelledby="d-notes" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="d-notes" className="m-0 text-20 font-semibold text-ink">
          Notes internes
        </h2>
        <span className="inline-flex items-center gap-1.5 text-13 text-ink-3">
          <Icon name="cadenas" size={14} />
          Non visibles du fidèle
        </span>
      </div>
      {notes.isPending ? (
        <div className="mt-4">
          <LoadingBlock lines={2} label="Chargement des notes…" />
        </div>
      ) : notes.isError ? (
        <p role="alert" className="m-0 mt-4 text-14 text-err">
          Les notes n’ont pas pu être chargées.
        </p>
      ) : notes.data.length === 0 ? (
        <p className="m-0 mt-4 text-14 text-ink-3">Aucune note pour l’instant.</p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {[...notes.data].reverse().map((note) => (
            <li key={note.id} className="rounded-12 border border-dashed border-line-field bg-surface-2 px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-[22px] items-center gap-1 rounded-6 bg-inverse px-2 text-12 font-semibold text-on-inverse">
                  <Icon name="cadenas" size={12} strokeWidth={2.25} />
                  Interne
                </span>
                <span className="tnum text-13 text-ink-3">
                  {note.author_id && note.author_id === me?.id ? 'Vous' : note.author_name || 'Équipe'} · {stamp(note.created_at)}
                </span>
              </div>
              <p className="m-0 mt-2 whitespace-pre-line text-15 text-ink">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={handleSubmit(({ content }) => add.mutate({ id: requestId, body: { content: content.trim() } }))}
        noValidate
        className="mt-2 flex flex-col gap-1.5"
      >
        <div
          className={cn(
            'flex min-h-10 items-center gap-2 rounded-12 border border-dashed pl-3 pr-1 text-ink-3 focus-within:border-solid focus-within:border-primary',
            error ? 'border-err-line' : 'border-line-field',
          )}
        >
          <Icon name="cadenas" size={16} className="shrink-0" />
          <label htmlFor="d-note" className="sr-only">
            Ajouter une note interne
          </label>
          <input
            id="d-note"
            {...register('content')}
            autoComplete="off"
            maxLength={2000}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'd-note-err' : undefined}
            placeholder="Ajouter une note interne, visible par l’équipe seulement"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent text-14 text-ink placeholder:text-ink-3 focus:outline-none"
          />
          {draft.trim() && (
            <Button type="submit" size="sm" variant="ghost" disabled={add.isPending}>
              {add.isPending ? 'Ajout…' : 'Ajouter'}
            </Button>
          )}
        </div>
        {error && (
          <p id="d-note-err" role="alert" className="m-0 text-13 text-err">
            {error}
          </p>
        )}
      </form>
      <p className="m-0 mt-3 flex items-start gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        Le message au demandeur se rédige au moment du changement de statut. Les notes internes ne lui sont jamais montrées.
      </p>
    </section>
  );
};
