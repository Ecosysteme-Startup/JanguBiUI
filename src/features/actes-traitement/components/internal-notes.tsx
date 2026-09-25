'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMe } from '@/hooks/use-me';
import { dayjs, hour } from '@/utils/dates';

import { useAddNote } from '../api/add-note';
import { useNotes } from '../api/get-notes';

import { SectionTitle } from './section-title';

const schema = z.object({ content: z.string().trim().min(1, 'La note est vide.').max(2000, '2 000 caractères au plus.') });
type Values = z.infer<typeof schema>;

/** Notes internes de l'équipe : jamais visibles du fidèle (EF-ACT-02). */
export const InternalNotes = ({ nodeId, requestId }: { nodeId: string; requestId: string }) => {
  const notes = useNotes(nodeId, requestId);
  const { data: me } = useMe();
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { content: '' } });
  const add = useAddNote(nodeId, requestId, { onSuccess: () => reset({ content: '' }) });

  return (
    <section aria-labelledby="d-notes">
      <SectionTitle id="d-notes" n="05" title="Notes internes" aside="Non visibles du fidèle" />
      {notes.isPending ? (
        <LoadingBlock lines={2} label="Chargement des notes…" />
      ) : notes.isError ? (
        <p role="alert" className="m-0 text-sm text-err">
          Les notes n’ont pas pu être chargées.
        </p>
      ) : notes.data.length === 0 ? (
        <p className="m-0 text-sm text-ink-3">Aucune note pour l’instant.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {[...notes.data].reverse().map((note) => (
            <li key={note.id} className="rounded bg-surface-2 px-4 py-3">
              <p className="m-0 whitespace-pre-line text-sm text-ink">{note.content}</p>
              <p className="tnum m-0 mt-1.5 text-meta text-ink-3">
                {note.author_id && note.author_id === me?.id ? 'Vous' : 'Équipe'} · {dayjs(note.created_at).format('DD.MM')} {hour(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={handleSubmit(({ content }) => add.mutate({ id: requestId, body: { content: content.trim() } }))}
        noValidate
        className="mt-4 flex flex-col gap-3"
      >
        <Field id="d-note" label="Ajouter une note interne" error={formState.errors.content?.message ?? add.error?.message}>
          <Textarea {...register('content')} rows={2} placeholder="Ajouter une note pour l’équipe…" />
        </Field>
        <div>
          <Button type="submit" variant="secondary" size="sm" disabled={add.isPending}>
            {add.isPending ? 'Ajout…' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </section>
  );
};
