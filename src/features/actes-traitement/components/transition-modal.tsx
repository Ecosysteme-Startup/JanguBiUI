'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useNodePlaces } from '../api/get-node-places';
import type { TransitionBody } from '../api/transition-request';
import type { ProcessorRequest } from '../types/processing';
import type { Transition } from '../utils/transitions';

type ModalTransition = Exclude<Transition, 'start-verification'>;

const CONFIG: Record<ModalTransition, { title: string; confirm: string; message: string; required: string | null; hint: string }> = {
  'request-info': {
    title: 'Demander un complément',
    confirm: 'Envoyer la demande de complément',
    message: 'Complément attendu',
    required: 'Précisez le complément attendu.',
    hint: 'Transmis au fidèle par notification. Il pourra répondre depuis le suivi de sa demande.',
  },
  reject: {
    title: 'Rejeter la demande',
    confirm: 'Rejeter la demande',
    message: 'Motif du rejet',
    required: 'Le motif du rejet est obligatoire.',
    hint: 'Transmis au fidèle. Par exemple : sacrement célébré dans une autre paroisse, aucun acte à ce nom.',
  },
  'mark-ready': {
    title: 'Marquer comme prête à retirer',
    confirm: 'Confirmer : prête à retirer',
    message: 'Message au fidèle',
    required: null,
    hint: 'Facultatif. Par exemple : casier des retraits, se présenter avec une pièce d’identité.',
  },
  'mark-collected': {
    title: 'Confirmer la remise de l’original',
    confirm: 'Confirmer la remise',
    message: 'Commentaire',
    required: null,
    hint: 'Facultatif. La demande sera close.',
  },
};

type Props = {
  transition: Transition;
  request: ProcessorRequest;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (body: TransitionBody) => void;
};

/** Modale de transition : motif obligatoire pour le complément et le rejet ; lieu et horaires pour le retrait. */
export const TransitionModal = ({ transition, request, pending, error, onClose, onConfirm }: Props) => {
  const config = CONFIG[transition as ModalTransition];
  const ready = transition === 'mark-ready';
  const places = useNodePlaces(ready ? (request.target_node?.id ?? null) : null);
  const schema = z.object({
    message: config.required ? z.string().trim().min(1, config.required).max(2000) : z.string().max(2000),
    place: z.string(),
    hours: z.string().max(255, '255 caractères au plus.'),
  });
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', place: '', hours: '' },
  });

  const submit = handleSubmit((v) =>
    onConfirm({ message: v.message.trim(), pickup_hours: ready ? v.hours.trim() : '', pickup_place_id: ready && v.place ? Number(v.place) : null }),
  );

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={config.title}
      description={`${request.reference} · ${request.requester_first_names} ${request.requester_last_name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="transition-form" variant={transition === 'reject' ? 'danger' : 'primary'} disabled={pending}>
            {pending ? 'Envoi…' : config.confirm}
          </Button>
        </>
      }
    >
      <form id="transition-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        {ready && (
          <>
            <Notice title="Un original, jamais un fichier.">
              L’acte signé et scellé est remis en main propre au fidèle, sur présentation d’une pièce d’identité.
            </Notice>
            <Field id="t-lieu" label="Lieu de retrait">
              <Select {...register('place')}>
                <option value="">Secrétariat de la paroisse</option>
                {(places.data ?? []).map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="t-horaires" label="Horaires du secrétariat" error={formState.errors.hours?.message}>
              <Input {...register('hours')} placeholder="Lundi – vendredi, 9 h-12 h · 16 h-18 h" />
            </Field>
          </>
        )}
        <Field id="t-message" label={config.message} required={config.required !== null} hint={config.hint} error={formState.errors.message?.message}>
          <Textarea {...register('message')} rows={4} />
        </Field>
        {error && (
          <p role="alert" className="m-0 text-sm text-err">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};
