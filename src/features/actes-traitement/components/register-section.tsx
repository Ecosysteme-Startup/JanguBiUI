'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

import { type RegisterRefBody, useSetRegisterRef } from '../api/set-register-ref';
import type { ProcessorRequest } from '../types/processing';

import { SectionTitle } from './section-title';

type Values = Required<RegisterRefBody>;

/** Recherche dans le registre (EF-ACT-05) et mentions marginales à reporter. */
export const RegisterSection = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const save = useSetRegisterRef(nodeId, { onSuccess: () => toast.ok('Référence du registre enregistrée.') });
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    defaultValues: {
      register_volume: request.register.volume,
      register_page: request.register.page,
      register_number: request.register.number,
      register_marginal_notes: request.register.marginal_notes,
    },
  });

  return (
    <section aria-labelledby="d-registre">
      <SectionTitle id="d-registre" n="02" title="Recherche dans le registre" aside="Non visible du fidèle" />
      <form onSubmit={handleSubmit((values) => save.mutate({ id: request.id, body: values }, { onSuccess: () => reset(values) }))} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-4">
          <Field id="r-volume" label="Volume">
            <Input {...register('register_volume')} maxLength={40} />
          </Field>
          <Field id="r-page" label="Page">
            <Input {...register('register_page')} maxLength={20} inputMode="numeric" />
          </Field>
          <Field id="r-acte" label="N° d’acte">
            <Input {...register('register_number')} maxLength={40} />
          </Field>
        </div>
        <Field
          id="r-mentions"
          label="Mentions marginales à reporter"
          hint="Toute mention inscrite en marge de l’acte est recopiée sur l’extrait. Un extrait destiné à un mariage doit être récent et complet."
        >
          <Textarea {...register('register_marginal_notes')} rows={3} />
        </Field>
        {save.error && <p role="alert" className="m-0 text-sm text-err">{save.error.message}</p>}
        <div>
          <Button type="submit" variant="secondary" disabled={save.isPending || !formState.isDirty}>
            {save.isPending ? 'Enregistrement…' : 'Enregistrer la référence'}
          </Button>
        </div>
      </form>
    </section>
  );
};
