'use client';

import { Trash2 } from 'lucide-react';
import * as React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button/button';
import { useNotifications } from '@/components/ui/notifications';
import { useEffacerHistoriqueLecture } from '@/lib/personnalisation/parole';
import { cn } from '@/utils/cn';

/**
 * « Effacer l'historique de lecture » (spec C3 §5) : confirmation, puis
 * `DELETE bible/evenements/` et « Historique effacé ». Signets et surlignages
 * sont conservés.
 */
export function EffacerHistoriqueLecture({
  className,
  onEfface,
}: {
  className?: string;
  onEfface?: () => void;
}) {
  const { addNotification } = useNotifications();
  const { mutate, isPending } = useEffacerHistoriqueLecture();
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <AlertDialog open={ouvert} onOpenChange={setOuvert}>
      <AlertDialogTrigger
        className={cn(
          'inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Effacer l&apos;historique de lecture
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Effacer l&apos;historique de lecture ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vos signets et surlignages sont conservés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              mutate(undefined, {
                onSuccess: () => {
                  setOuvert(false);
                  addNotification({
                    type: 'success',
                    title: 'Historique effacé',
                  });
                  onEfface?.();
                },
                onError: () =>
                  addNotification({
                    type: 'error',
                    title: "L'historique n'a pas pu être effacé",
                    message: 'Réessayez dans quelques instants.',
                  }),
              });
            }}
          >
            Effacer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
