'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';

import { type ImpereeCreateBody, useCreateImperee } from '../../api/imperees';
import type { Imperee } from '../../types/schemas';
import { OptionCheckbox } from '../donner/donation-controls';

const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Indiquez l’objet de la quête.')
      .max(200, '200 caractères au plus.'),
    starts_on: z.string().min(1, 'Indiquez la date de la quête.'),
    ends_on: z.string(),
    authorization_ref: z
      .string()
      .trim()
      .min(1, 'Indiquez la référence de la décision.')
      .max(120, '120 caractères au plus.'),
    messe_anticipee_incluse: z.boolean(),
  })
  .refine((v) => !v.ends_on || !v.starts_on || v.ends_on >= v.starts_on, {
    path: ['ends_on'],
    message: 'La fin de collecte doit suivre la date de la quête.',
  });
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  title: '',
  starts_on: '',
  ends_on: '',
  authorization_ref: '',
  messe_anticipee_incluse: false,
};

/** Champs du panneau (maquette : 44 px, fond surface, 15 px). */
const FIELD = 'bg-surface text-15';

/**
 * Panneau « Définir une quête impérée » (WEB-DIO-Quetes-Imperees) : objet, date, fin de collecte,
 * paroisses concernées et référence de la décision de l'Ordinaire. « Publier » crée un fonds
 * dans chaque paroisse concernée (le serveur retient toutes celles où la collecte est activée).
 */
export const ImpereePanel = ({
  nodeId,
  onClose,
  onCreated,
}: {
  nodeId: string;
  onClose: () => void;
  onCreated: (i: Imperee) => void;
}) => {
  const create = useCreateImperee(nodeId);
  const { register, handleSubmit, reset, setError, formState, watch } =
    useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: EMPTY,
    });
  const reference = watch('authorization_ref').trim();

  const onSubmit = handleSubmit(async (v) => {
    const body: ImpereeCreateBody = {
      node: nodeId,
      title: v.title.trim(),
      description: '',
      starts_on: v.starts_on,
      ends_on: v.ends_on || null,
      authorization_ref: v.authorization_ref.trim(),
      messe_anticipee_incluse: v.messe_anticipee_incluse,
    };
    try {
      const imperee = await create.mutateAsync(body);
      toast.ok(`Quête publiée : ${imperee.title}. Inscrit au journal d’audit.`);
      reset(EMPTY);
      onCreated(imperee);
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field in EMPTY) setError(field as keyof Values, { message });
      });
    }
  });

  const e = formState.errors;
  return (
    <Card
      as="aside"
      padding="none"
      aria-labelledby="qi-def"
      className="overflow-hidden shadow-menu"
    >
      <div className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-5">
        <div className="min-w-0 flex-1">
          <h2 id="qi-def" className="m-0 text-20 font-semibold">
            Définir une quête impérée
          </h2>
          <p className="m-0 mt-0.5 text-14 text-ink-2">
            Elle apparaît comme fonds dans chaque paroisse concernée.
          </p>
        </div>
        <IconButton
          icon="x"
          label="Fermer le panneau"
          size="sm"
          className="-mr-1.5 -mt-1.5 size-9 text-ink-2"
          onClick={onClose}
        />
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5 p-5">
        {create.isError &&
          Object.keys(apiFieldErrors(create.error)).length === 0 && (
            <Notice
              tone="err"
              role="alert"
              title={apiErrorMessage(create.error)}
            />
          )}
        <Field id="qi-objet" label="Objet" required error={e.title?.message}>
          <Input
            controlSize="sm"
            className={FIELD}
            autoComplete="off"
            {...register('title')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="qi-date"
            label="Date de la quête"
            required
            error={e.starts_on?.message}
          >
            <Input
              controlSize="sm"
              type="date"
              className={`${FIELD} tnum`}
              {...register('starts_on')}
            />
          </Field>
          <Field
            id="qi-fin"
            label="Fin de collecte"
            optional
            error={e.ends_on?.message}
          >
            <Input
              controlSize="sm"
              type="date"
              className={`${FIELD} tnum`}
              {...register('ends_on')}
            />
          </Field>
          <p className="col-span-2 m-0 -mt-1 text-13 text-ink-3">
            Les dons en ligne restent ouverts jusqu’à la fin de collecte.
          </p>
        </div>
        <OptionCheckbox
          id="qi-anticipee"
          label="Inclure la messe anticipée"
          description="La quête de la messe anticipée de la veille au soir fait partie de la quête impérée."
          {...register('messe_anticipee_incluse')}
        />
        <div className="flex flex-col gap-2">
          <p className="m-0 text-14 font-medium">Paroisses concernées</p>
          <div className="flex gap-2.5 rounded-12 border-2 border-primary bg-tint-50 px-3.5 py-3">
            <Icon name="paroisse" size={20} className="shrink-0 text-primary" />
            <span className="flex flex-col">
              <span className="text-15 font-semibold leading-5">
                Toutes les paroisses où la collecte est ouverte
              </span>
              <span className="text-13 text-ink-2">
                Chaque paroisse du diocèse dont la collecte est activée à la
                publication.
              </span>
            </span>
          </div>
        </div>
        <Field
          id="qi-ref"
          label="Référence de la décision de l’Ordinaire"
          required
          hint="Affichée aux fidèles avec la mention d’autorisation."
          error={e.authorization_ref?.message}
        >
          <Input
            controlSize="sm"
            className={`${FIELD} tnum`}
            autoComplete="off"
            {...register('authorization_ref')}
          />
        </Field>
        {reference && (
          <div className="flex gap-2.5 rounded-12 bg-surface px-3.5 py-3 text-13 text-ink-2">
            <Icon
              name="bouclier"
              size={16}
              className="mt-px shrink-0 text-ok"
            />
            <span>
              Aperçu&nbsp;: «&nbsp;Quête prescrite par l’Ordinaire (réf.&nbsp;
              <span className="whitespace-nowrap">{reference}</span>).&nbsp;»
            </span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            block
            className="min-h-11"
            loading={create.isPending}
          >
            Publier
          </Button>
          <p className="m-0 text-13 text-ink-3">
            Les paroisses concernées sont prévenues à la publication.
            L’opération est inscrite au journal d’audit.
          </p>
        </div>
      </form>
    </Card>
  );
};
