'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
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

/** Réponse toute prête : insérée dans la saisie, jamais envoyée sans relecture. */
export type QuickReply = { label: string; icon?: IconName; text: string };

type ComposerProps = {
  peerName: string;
  pending: boolean;
  onSend: (content: string) => Promise<unknown>;
  onTyping?: (typing: boolean) => void;
  quickReplies?: QuickReply[];
};

/** Saisie d'un message : Entrée envoie, Maj + Entrée passe à la ligne. */
export const Composer = ({
  peerName,
  pending,
  onSend,
  onTyping,
  quickReplies = [],
}: ComposerProps) => {
  const { register, handleSubmit, reset, setValue, setFocus, getValues, formState } = useForm<ComposerInput>({
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

  const insert = (text: string) => {
    const current = getValues('content').trim();
    setValue('content', current ? `${current}\n${text}` : text, { shouldDirty: true });
    onTyping?.(true);
    setFocus('content');
  };

  return (
    <form
      aria-label={`Écrire à ${peerName}`}
      onSubmit={submit}
      className="shrink-0 border-t border-line bg-paper px-4 pb-5 pt-4 lg:pl-8 lg:pr-6"
    >
      {quickReplies.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.label}
              type="button"
              onClick={() => insert(reply.text)}
              className="hit inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-13 font-medium text-ink transition-colors hover:border-line-field hover:bg-surface"
            >
              {reply.icon && <Icon name={reply.icon} size={16} />}
              {reply.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-3">
        <label htmlFor="message-contenu" className="sr-only">
          Votre message à {peerName}
        </label>
        <Textarea
          id="message-contenu"
          rows={1}
          placeholder={`Écrire à ${peerName}…`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'message-erreur message-aide' : 'message-aide'}
          className="max-h-40 min-h-12 min-w-0 flex-1 resize-none py-3 text-15 leading-[22px]"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          {...field}
        />
        <Button type="submit" size="lg" disabled={pending} aria-label="Envoyer le message" className="shrink-0 px-4 sm:px-5">
          <Icon name="envoyer" size={18} />
          <span className="hidden sm:inline">Envoyer</span>
        </Button>
      </div>
      {error && (
        <p id="message-erreur" role="alert" className="m-0 mt-2 text-14 text-err">
          {error}
        </p>
      )}
      <p id="message-aide" className="m-0 mt-2 hidden text-12 text-ink-3 sm:block">
        Entrée pour envoyer, Maj + Entrée pour aller à la ligne.
      </p>
    </form>
  );
};
