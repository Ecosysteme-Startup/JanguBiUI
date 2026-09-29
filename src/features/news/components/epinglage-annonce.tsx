'use client';

import { Pin } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';

import {
  type ContenuStaff,
  useDesepinglerContenu,
  useEpinglerContenu,
} from '../api/staff-articles';

const p2 = (n: number) => String(n).padStart(2, '0');
const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** Fin de journée locale du jour choisi, envoyée en ISO (UTC). */
export const finDeJournee = (jour: string): string => {
  const [a, m, j] = jour.split('-').map(Number);
  return new Date(a, m - 1, j, 23, 59, 0).toISOString();
};

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/**
 * « Épingler en tête, jusqu'au… » (WEB-PAR-Annonce-Editeur) : seul un contenu
 * publié ou programmé s'épingle ; 60 jours au plus.
 */
export function EpinglageAnnonce({ contenu }: { contenu: ContenuStaff }) {
  const id = useId();
  const aujourdhui = new Date();
  const max = new Date(aujourdhui.getTime() + 60 * 86_400_000);
  const dans7 = new Date(aujourdhui.getTime() + 7 * 86_400_000);
  const [jour, setJour] = useState(isoLocal(dans7));
  const epingler = useEpinglerContenu();
  const desepingler = useDesepinglerContenu();
  const erreur = epingler.error ?? desepingler.error;
  const publiable =
    contenu.status === 'published' || contenu.status === 'scheduled';

  if (!publiable) return null;

  return (
    <section
      aria-labelledby={`${id}-titre`}
      className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <h2
        id={`${id}-titre`}
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <Pin className="size-4 text-primary" aria-hidden="true" />
        Épingler en tête
      </h2>
      {contenu.is_pinned && contenu.pinned_until ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Épinglée jusqu’au {dateLongue(contenu.pinned_until)}.
          </p>
          <Button
            size="sm"
            variant="outline"
            isLoading={desepingler.isPending}
            onClick={() => desepingler.mutate(contenu.id)}
          >
            Désépingler
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            epingler.mutate({ id: contenu.id, until: finDeJournee(jour) });
          }}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-jour`} className="text-xs font-medium">
              Jusqu’au
            </label>
            <input
              id={`${id}-jour`}
              type="date"
              required
              min={isoLocal(aujourdhui)}
              max={isoLocal(max)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={jour}
              onChange={(e) => setJour(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" isLoading={epingler.isPending}>
            Épingler
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            L’annonce reste en tête du fil de la paroisse jusqu’à cette date (60
            jours au plus).
          </p>
        </form>
      )}
      {erreur && (
        <p role="alert" className="text-sm text-destructive">
          {erreur instanceof ApiError
            ? erreur.message
            : 'L’opération n’a pas abouti.'}
        </p>
      )}
    </section>
  );
}
