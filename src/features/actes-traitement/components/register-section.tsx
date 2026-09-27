'use client';

import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

import { type RegisterRefBody, useSetRegisterRef } from '../api/set-register-ref';
import type { ProcessorRequest } from '../types/processing';

type Values = Required<RegisterRefBody>;

/** Recherche dans le registre (EF-ACT-05) et mentions marginales à reporter. */
export const RegisterSection = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const registered = Boolean(request.register.volume && request.register.number);
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
    <section aria-labelledby="d-registre" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="d-registre" className="m-0 text-20 font-semibold text-ink">
            Données du registre
          </h2>
          <p className="m-0 mt-0.5 text-13 text-ink-3">Où l’acte est inscrit dans le registre de la paroisse. Non visible du fidèle.</p>
        </div>
        {registered && (
          <Badge tone="ok" icon="check">
            Acte retrouvé
          </Badge>
        )}
      </div>
      <form
        onSubmit={handleSubmit((values) => save.mutate({ id: request.id, body: values }, { onSuccess: () => reset(values) }))}
        noValidate
        className="mt-5 flex flex-col gap-5 border-t border-line pt-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="r-volume" label="Volume">
            <Input {...register('register_volume')} maxLength={40} controlSize="sm" />
          </Field>
          <Field id="r-page" label="Page">
            <Input {...register('register_page')} maxLength={20} inputMode="numeric" controlSize="sm" />
          </Field>
          <Field id="r-acte" label="N° d’acte">
            <Input {...register('register_number')} maxLength={40} controlSize="sm" />
          </Field>
        </div>
        <Field
          id="r-mentions"
          label="Mentions marginales à reporter"
          hint="Toute mention inscrite en marge de l’acte est recopiée sur l’extrait. Un extrait destiné à un mariage doit être récent et complet."
        >
          <Textarea {...register('register_marginal_notes')} rows={2} controlSize="sm" />
        </Field>
        {save.error && <p role="alert" className="m-0 text-14 text-err">{save.error.message}</p>}
        <div>
          <Button type="submit" variant="outline" disabled={save.isPending || !formState.isDirty}>
            {save.isPending ? 'Enregistrement…' : 'Enregistrer la référence'}
          </Button>
        </div>
      </form>
    </section>
  );
};
