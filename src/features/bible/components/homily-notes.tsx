'use client';

import { NotebookPen, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';

import { useHomilyNotes } from '../api/get-homily-notes';
import { useSaveHomilyNote } from '../api/save-homily-note';

interface HomilyNotesProps {
  passageId: number;
}

type FormValues = {
  content: string;
};

export function HomilyNotes({ passageId }: HomilyNotesProps) {
  const { data, isLoading } = useHomilyNotes(passageId);
  const { mutate, isPending } = useSaveHomilyNote();

  const existingNote = data?.results[0];

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { content: existingNote?.content ?? '' },
  });

  useEffect(() => {
    reset({ content: existingNote?.content ?? '' });
  }, [existingNote, reset]);

  const onSubmit = (values: FormValues) => {
    mutate({ passage_start_id: passageId, content: values.content });
  };

  return (
    <Card variant="elevated" className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Notes d&apos;homélie
        </h3>
        {existingNote && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Modifié le{' '}
            {new Date(existingNote.updated_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-24 rounded-lg bg-muted/30 animate-pulse" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <textarea
            {...register('content')}
            rows={6}
            placeholder="Vos notes privées pour cette lecture — idées d'homélie, références patristiques…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="gap-1.5"
          >
            <Save className="size-3.5" />
            {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </form>
      )}
    </Card>
  );
}
