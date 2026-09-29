'use client';

import * as React from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import { useEffacerHistoriqueLecture } from '@/lib/personnalisation/parole';
import { cn } from '@/utils/cn';

/**
 * « Effacer l'historique de lecture » (spec C3 §5) : confirmation, puis `DELETE bible/evenements/`
 * et « Historique effacé ». Signets et surlignages sont conservés.
 */
export function EffacerHistoriqueLecture({
  className,
  onEfface,
}: {
  className?: string;
  onEfface?: () => void;
}) {
  const { mutate, isPending } = useEffacerHistoriqueLecture();
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={cn(
          'hit inline-flex min-h-10 items-center gap-2 rounded-10 px-2 text-14 font-medium text-err hover:bg-err-bg',
          className,
        )}
      >
        <Icon name="corbeille" size={16} />
        Effacer l&apos;historique de lecture
      </button>
      <ConfirmDialog
        open={ouvert}
        onOpenChange={setOuvert}
        title="Effacer l'historique de lecture ?"
        description="Vos signets et surlignages sont conservés."
        confirmLabel="Effacer"
        tone="danger"
        pending={isPending}
        onConfirm={() =>
          mutate(undefined, {
            onSuccess: () => {
              setOuvert(false);
              toast.ok('Historique effacé.');
              onEfface?.();
            },
            onError: () =>
              toast.err(
                "L'historique n'a pas pu être effacé. Réessayez dans quelques instants.",
              ),
          })
        }
      />
    </>
  );
}
