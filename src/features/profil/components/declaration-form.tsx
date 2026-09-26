'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

import { DEGRES_ORDRE, type Declaration, ETATS_DE_VIE } from '../api/get-declaration';
import { type DeclarationBody, useSubmitDeclaration } from '../api/submit-declaration';
import { useUploadJustificatif } from '../api/upload-justificatif';
import { DEGRE_LABELS, ETAT_LABELS } from '../utils/life-state-labels';

import { DirectoryPicker } from './directory-picker';
import { JustificatifsPicker, MAX_JUSTIFICATIFS } from './justificatifs-picker';

const nodeSchema = z.object({ id: z.string(), name: z.string() }).nullable();

const schema = z
  .object({
    etat_de_vie: z.enum(ETATS_DE_VIE),
    degre_ordre: z.enum(DEGRES_ORDRE),
    incardination: nodeSchema,
    institut: nodeSchema,
  })
  .superRefine((v, ctx) => {
    if (v.etat_de_vie === 'clerc' && v.degre_ordre === 'aucun') {
      ctx.addIssue({ code: 'custom', path: ['degre_ordre'], message: 'Indiquez votre degré d’ordre.' });
    }
    if (v.etat_de_vie === 'clerc' && !v.incardination) {
      ctx.addIssue({ code: 'custom', path: ['incardination'], message: 'Choisissez votre diocèse d’incardination.' });
    }
    if (v.etat_de_vie === 'consacre' && !v.institut) {
      ctx.addIssue({ code: 'custom', path: ['institut'], message: 'Choisissez votre institut de vie consacrée.' });
    }
  });
type Values = z.infer<typeof schema>;

const toBody = (v: Values, attachmentIds: number[]): DeclarationBody => ({
  etat_de_vie: v.etat_de_vie,
  degre_ordre: v.etat_de_vie === 'clerc' ? v.degre_ordre : 'aucun',
  incardination_node_id: v.etat_de_vie === 'clerc' ? (v.incardination?.id ?? null) : null,
  institut_node_id: v.etat_de_vie === 'laic' ? null : (v.institut?.id ?? null),
  attachment_file_ids: attachmentIds,
});

type DeclarationFormProps = { declaration: Declaration; onDone: () => void; onCancel?: () => void };

/** Déclarer, modifier ou compléter son état de vie (POST /me/declaration/). */
export const DeclarationForm = ({ declaration, onDone, onCancel }: DeclarationFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const upload = useUploadJustificatif();
  const submit = useSubmitDeclaration({
    onSuccess: () => {
      toast.ok('Déclaration envoyée. La chancellerie la vérifiera.');
      setFiles([]);
      onDone();
    },
  });
  const { control, register, handleSubmit, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      etat_de_vie: declaration.etat_de_vie,
      degre_ordre: declaration.degre_ordre,
      incardination: declaration.incardination_node,
      institut: declaration.institut_node,
    },
  });
  const etat = watch('etat_de_vie');
  const remaining = MAX_JUSTIFICATIFS - declaration.attachments.length;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const ids: number[] = [];
      for (const file of values.etat_de_vie === 'laic' ? [] : files) ids.push(await upload.mutateAsync(file));
      await submit.mutateAsync(toBody(values, ids));
    } catch {
      // Erreur affichée sous le formulaire.
    }
  });
  const error = upload.error ?? submit.error;
  const pending = upload.isPending || submit.isPending;

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Déclaration d’état de vie" className="mt-5 flex flex-col gap-5">
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 text-sm font-semibold text-ink">Mon état de vie</legend>
        {ETATS_DE_VIE.map((value) => (
          <Choice key={value} type="radio" value={value} label={ETAT_LABELS[value].long} {...register('etat_de_vie')} />
        ))}
      </fieldset>

      {etat === 'clerc' && (
        <>
          <Field id="ev-degre" label="Degré d’ordre" required error={formState.errors.degre_ordre?.message}>
            <Select {...register('degre_ordre')}>
              <option value="aucun">Choisissez…</option>
              {DEGRES_ORDRE.filter((d) => d !== 'aucun').map((d) => (
                <option key={d} value={d}>
                  {DEGRE_LABELS[d]}
                </option>
              ))}
            </Select>
          </Field>
          <Controller
            control={control}
            name="incardination"
            render={({ field, fieldState }) => (
              <DirectoryPicker
                id="ev-incardination"
                label="Diocèse d’incardination"
                type="diocese"
                required
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </>
      )}

      {etat !== 'laic' && (
        <Controller
          control={control}
          name="institut"
          render={({ field, fieldState }) => (
            <DirectoryPicker
              id="ev-institut"
              label={etat === 'consacre' ? 'Institut de vie consacrée' : 'Institut (si vous êtes religieux)'}
              type="institut"
              required={etat === 'consacre'}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      )}

      {etat !== 'laic' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink">Justificatifs</span>
          {remaining > 0 ? (
            <JustificatifsPicker id="ev-justificatifs" files={files} remaining={remaining} onChange={setFiles} />
          ) : (
            <p className="m-0 text-sm text-ink-2">Vous avez joint {MAX_JUSTIFICATIFS} justificatifs, le maximum.</p>
          )}
        </div>
      )}

      {error && (
        <Notice tone="err" title="La déclaration n’a pas pu être envoyée.">
          {error.message}
        </Notice>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Envoi…' : 'Envoyer ma déclaration'}
        </Button>
        {onCancel && (
          <Button variant="tertiary" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
};
