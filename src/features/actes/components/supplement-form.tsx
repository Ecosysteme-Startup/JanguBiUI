'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { frenchTypo } from '@/utils/french-typo';

import { useSubmitSupplement } from '../api/submit-supplement';
import { useUploadFile } from '../api/upload-file';
import type { DocumentRequest } from '../types/request';

import { AttachmentPicker } from './attachment-picker';

const schema = z.object({ answer: z.string().max(2000, '2 000 caractères au plus.') });
type Values = z.infer<typeof schema>;

/** Réponse du fidèle à une demande de complément (SRS §8.1 : info_requested → under_verification). */
export const SupplementForm = ({ request, message }: { request: DocumentRequest; message: string }) => {
  const [file, setFile] = useState<File | null>(null);
  const [emptyError, setEmptyError] = useState<string | null>(null);
  const upload = useUploadFile();
  const supplement = useSubmitSupplement({ onSuccess: () => toast.ok('Complément envoyé. La paroisse reprend la vérification.') });
  const { register, handleSubmit, watch, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { answer: '' } });
  const answer = watch('answer');

  const onSubmit = handleSubmit(async ({ answer: text }) => {
    if (!text.trim() && !file) {
      setEmptyError('Écrivez votre réponse ou joignez une pièce.');
      return;
    }
    setEmptyError(null);
    try {
      const attachment = file ? await upload.mutateAsync(file) : null;
      supplement.mutate({ id: request.id, body: { additional_info: text.trim(), attachment_file_id: attachment } });
    } catch {
      // Erreur d'envoi du fichier affichée ci-dessous.
    }
  });
  const error = upload.error ?? supplement.error;

  return (
    <section aria-labelledby="sv-complement" className="rounded border border-warn-dot bg-warn-bg p-5 lg:p-6">
      <h2 id="sv-complement" className="m-0 text-base font-semibold text-warn">
        La paroisse a besoin d’un complément
      </h2>
      {message && <p className="m-0 mt-2 max-w-reading text-base text-ink">{frenchTypo(message)}</p>}
      <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <Field
          id="sv-reponse"
          label="Votre réponse"
          error={formState.errors.answer?.message ?? emptyError ?? undefined}
          counter={{ value: answer.length, max: 2000 }}
        >
          <Textarea {...register('answer')} rows={4} className="bg-paper" />
        </Field>
        <AttachmentPicker id="sv-fichier" file={file} onChange={setFile} />
        {error && (
          <Notice tone="err" title="Le complément n’a pas pu être envoyé.">
            {error.message}
          </Notice>
        )}
        <div>
          <Button type="submit" disabled={upload.isPending || supplement.isPending}>
            {supplement.isPending || upload.isPending ? 'Envoi…' : 'Envoyer le complément'}
          </Button>
        </div>
      </form>
    </section>
  );
};
