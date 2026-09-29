'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { dayjs } from '@/utils/dates';

import { useDesepingler, useEpingler, useEpinglage } from '../api/epinglage';

/** Fin de la journée locale choisie, envoyée en ISO (UTC). */
export const finDeJournee = (jour: string): string =>
  dayjs(jour).hour(23).minute(59).second(0).toISOString();

/**
 * « Épingler en tête, jusqu'au… » (PAR-Annonce-Editeur, compléments V1) : seule une annonce
 * publiée ou programmée s'épingle, 60 jours au plus.
 */
export const EpinglagePanel = ({ articleId }: { articleId: string }) => {
  const id = useId();
  const { data } = useEpinglage(articleId);
  const [jour, setJour] = useState(() =>
    dayjs().add(7, 'day').format('YYYY-MM-DD'),
  );
  const epingler = useEpingler(articleId);
  const desepingler = useDesepingler(articleId);
  const erreur = epingler.error ?? desepingler.error;
  if (!data || (data.status !== 'published' && data.status !== 'scheduled'))
    return null;

  return (
    <section
      aria-labelledby={`${id}-titre`}
      className="flex flex-col gap-3 rounded-16 border border-line bg-paper p-5 shadow-card"
    >
      <h2
        id={`${id}-titre`}
        className="m-0 flex items-center gap-2 text-20 font-semibold text-ink"
      >
        <Icon name="epingle" size={20} className="text-ink-2" />
        Épingler en tête
      </h2>
      {data.is_pinned && data.pinned_until ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-14 text-ink-2">
            Épinglée jusqu’au {dayjs(data.pinned_until).format('dddd D MMMM')}.
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={desepingler.isPending}
            onClick={() => desepingler.mutate()}
          >
            Désépingler
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            epingler.mutate(finDeJournee(jour));
          }}
        >
          <Field
            id={`${id}-jour`}
            label="Jusqu’au"
            hint="L’annonce reste en tête du fil de la paroisse jusqu’à cette date (60 jours au plus)."
          >
            <Input
              type="date"
              required
              controlSize="sm"
              min={dayjs().format('YYYY-MM-DD')}
              max={dayjs().add(60, 'day').format('YYYY-MM-DD')}
              value={jour}
              onChange={(e) => setJour(e.target.value)}
            />
          </Field>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            loading={epingler.isPending}
            className="self-start"
          >
            Épingler
          </Button>
        </form>
      )}
      {erreur && (
        <p role="alert" className="m-0 text-14 text-err">
          {erreur.message}
        </p>
      )}
    </section>
  );
};
