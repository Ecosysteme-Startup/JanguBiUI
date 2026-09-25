'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Icon } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';

const MAX_LENGTH = 4000;

const schema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Écrivez votre message.')
    .max(MAX_LENGTH, `Votre message dépasse ${MAX_LENGTH} caractères.`),
});
type ComposerInput = z.infer<typeof schema>;

type ComposerProps = {
  peerName: string;
  pending: boolean;
  onSend: (content: string) => Promise<unknown>;
  onTyping?: (typing: boolean) => void;
};

/** Saisie d'un message : Entrée envoie, Maj + Entrée passe à la ligne. */
export const Composer = ({
  peerName,
  pending,
  onSend,
  onTyping,
}: ComposerProps) => {
  const { register, handleSubmit, reset, formState } = useForm<ComposerInput>({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
  });
  const error = formState.errors.content?.message;

  const submit = handleSubmit(async ({ content }) => {
    try {
      await onSend(content);
      reset({ content: '' });
      onTyping?.(false);
    } catch {
      // L'erreur est affichée par le fil (refus expliqué) ; la saisie est conservée.
    }
  });

  const field = register('content', {
    onChange: (event: { target: { value: string } }) =>
      onTyping?.(event.target.value.length > 0),
  });

  return (
    <form
      aria-label={`Écrire à ${peerName}`}
      onSubmit={submit}
      className="flex flex-col gap-1 border-t border-line bg-surface px-4 pb-4 pt-3 lg:px-6"
    >
      <div className="flex items-end gap-2">
        <label htmlFor="message-contenu" className="sr-only">
          Votre message à {peerName}
        </label>
        <Textarea
          id="message-contenu"
          rows={1}
          placeholder={`Écrire à ${peerName}…`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'message-erreur' : undefined}
          className="max-h-40 min-h-12 flex-1 resize-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          {...field}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Envoyer le message"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded border border-primary-fill bg-primary-fill text-on-primary hover:bg-primary-fill-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="envoyer" size={20} />
        </button>
      </div>
      {error && (
        <p id="message-erreur" role="alert" className="m-0 text-sm text-err">
          {error}
        </p>
      )}
    </form>
  );
};
