'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-errors';
import { hour } from '@/utils/dates';

import { useCancelSlot } from '../api/cancel-slot';
import type { PlanningSlot } from '../api/schemas';

const MAX = 300;

/**
 * Annulation par le prêtre. Avec un réservant, un message (≤ 300) lui est transmis :
 * c'est le seul texte de toute la brique confession, et il vient du prêtre.
 */
export const CancelSlotForm = ({
  slot,
  onDone,
}: {
  slot: PlanningSlot;
  onDone: () => void;
}) => {
  const booked = slot.booking !== null;
  const schema = z.object({
    message: booked
      ? z
          .string()
          .trim()
          .min(1, 'Écrivez un mot pour prévenir la personne.')
          .max(MAX, `${MAX} caractères au plus.`)
      : z.string().max(MAX),
  });
  const cancel = useCancelSlot();
  const { register, handleSubmit, watch, formState } = useForm<{
    message: string;
  }>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });
  const id = `annulation-${slot.id}`;

  const submit = handleSubmit(({ message }) =>
    cancel.mutate(
      { slotId: slot.id, message },
      {
        onSuccess: () => {
          toast.ok(
            booked
              ? 'Rendez-vous annulé : la personne est prévenue.'
              : 'Créneau retiré.',
          );
          onDone();
        },
        onError: (error) => toast.err(apiErrorMessage(error)),
      },
    ),
  );

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 border border-line-strong bg-surface p-4"
    >
      {booked ? (
        <Field
          id={id}
          label={`Message d’annulation à ${slot.booking!.person}`}
          required
          error={formState.errors.message?.message}
          counter={{ value: watch('message').length, max: MAX }}
        >
          <Textarea rows={3} {...register('message')} />
        </Field>
      ) : (
        <p className="m-0 text-base text-ink">
          Retirer le créneau de {hour(slot.starts_at)} ? Il ne sera plus proposé
          aux fidèles.
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onDone}>
          Garder
        </Button>
        <Button
          type="submit"
          variant="danger"
          size="sm"
          disabled={cancel.isPending}
        >
          {booked ? 'Annuler et prévenir' : 'Retirer ce créneau'}
        </Button>
      </div>
    </form>
  );
};
