'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { applyServerErrors } from '@/utils/form-errors';

import { type Place, PLACE_KINDS, useSavePlace } from '../api/places';

const KIND_VALUES = Object.keys(PLACE_KINDS) as [
  keyof typeof PLACE_KINDS,
  ...(keyof typeof PLACE_KINDS)[],
];

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Indiquez le nom du lieu.')
    .max(200, '200 caractères au plus.'),
  kind: z.enum(KIND_VALUES),
  is_main: z.boolean(),
  address: z.string().trim(),
  city: z.string().trim().max(100, '100 caractères au plus.'),
});
type PlaceFormValues = z.infer<typeof schema>;
const FIELDS = ['name', 'kind', 'is_main', 'address', 'city'] as const;

/** Ajout ou modification d'un lieu de culte (structure.gerer). */
export const PlaceFormModal = ({
  open,
  onOpenChange,
  nodeId,
  nodeName,
  place,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeName: string;
  place?: Place;
}) => {
  const id = React.useId();
  const save = useSavePlace(nodeId);
  const [formError, setFormError] = React.useState<string | null>(null);
  const { register, handleSubmit, reset, setError, formState } =
    useForm<PlaceFormValues>({
      resolver: zodResolver(schema),
      values: {
        name: place?.name ?? '',
        kind: place?.kind ?? 'chapelle',
        is_main: place?.is_main ?? false,
        address: place?.address ?? '',
        city: place?.city ?? '',
      },
    });

  const close = (next: boolean) => {
    if (!next) {
      reset();
      setFormError(null);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: place?.id, body: values });
      toast.ok(place ? 'Lieu de culte modifié.' : `« ${values.name} » ajouté.`);
      close(false);
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS));
    }
  });

  const { errors, isSubmitting } = formState;
  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={place ? `Modifier « ${place.name} »` : 'Ajouter un lieu de culte'}
      description={nodeName}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Annuler
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <Field
          id={`${id}-nom`}
          label="Nom du lieu"
          required
          error={errors.name?.message}
        >
          <Input {...register('name')} autoComplete="off" />
        </Field>
        <Field id={`${id}-type`} label="Type" error={errors.kind?.message}>
          <Select {...register('kind')}>
            {Object.entries(PLACE_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${id}-adresse`}
            label="Adresse ou quartier"
            error={errors.address?.message}
          >
            <Input {...register('address')} autoComplete="off" />
          </Field>
          <Field id={`${id}-ville`} label="Ville" error={errors.city?.message}>
            <Input {...register('city')} autoComplete="off" />
          </Field>
        </div>
        <Choice
          {...register('is_main')}
          label="Lieu principal"
          description="L’église où se tiennent les registres et le secrétariat."
        />
        <div aria-live="polite">
          {formError && <Notice tone="err" title={formError} />}
        </div>
      </form>
    </Modal>
  );
};
