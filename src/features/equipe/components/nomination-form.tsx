'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CapabilityChips } from '@/components/signature/capability-chips';
import { PersonCombobox } from '@/components/signature/person-combobox';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { PersonOption } from '@/hooks/use-person-search';
import { apiErrorCode, apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useCreateAssignment } from '../api/assignments';
import type { Office } from '../api/office-catalogue';

const schema = z.object({
  person_id: z.string().min(1, 'Choisissez la personne à nommer.'),
  node_id: z.string().min(1, 'Choisissez le lieu.'),
  office: z.string().min(1, 'Choisissez l’office.'),
  start_date: z.string().min(1, 'Indiquez la date de début.'),
  decree_ref: z.string().max(120, '120 caractères au plus.'),
  note: z.string().max(255, '255 caractères au plus.'),
});
type Values = z.infer<typeof schema>;

/** Accès sensibles qu'un office ne donne pas (rappel de la maquette PAR-Equipe). */
const SENSITIVE: [string, string][] = [
  ['actes.traiter', 'aux demandes d’actes'],
  ['messagerie.recevoir_fideles', 'à la messagerie prêtre'],
  ['confessions.gerer', 'aux confessions'],
];

export const withoutAccess = (capabilities: string[]): string => {
  const missing = SENSITIVE.filter(([code]) => !capabilities.includes(code)).map(([, label]) => label);
  if (missing.length === 0) return '';
  if (missing.length === 1) return `Sans accès ${missing[0]}.`;
  return `Sans accès ${missing.slice(0, -1).join(', ')} ni ${missing.at(-1)}.`;
};

export type NominationTarget = { id: string; name: string; type: string };

type NominationFormProps = {
  targets: NominationTarget[];
  offices: Office[];
  onClose: () => void;
};

/** Panneau « Nommer une personne » (PAR-Equipe). Le serveur vérifie le droit de nommer et la MFA. */
export const NominationForm = ({ targets, offices, onClose }: NominationFormProps) => {
  const create = useCreateAssignment({
    onSuccess: (a) => {
      toast.ok(`Nomination enregistrée : ${a.person.full_name}, ${a.office_label.toLowerCase()}.`);
      onClose();
    },
  });
  const [person, setPerson] = useState<PersonOption | null>(null);
  const { register, handleSubmit, watch, setError, setValue, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { person_id: '', node_id: targets[0]?.id ?? '', office: '', start_date: dayjs().format('YYYY-MM-DD'), decree_ref: '', note: '' },
  });
  const nodeType = targets.find((t) => t.id === watch('node_id'))?.type;
  const available = offices.filter((o) => !nodeType || o.node_types.length === 0 || o.node_types.includes(nodeType));
  const office = offices.find((o) => o.code === watch('office'));

  const onSubmit = handleSubmit(async (v) => {
    try {
      await create.mutateAsync({ ...v, end_date: null });
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field in v) setError(field as keyof Values, { message });
      });
    }
  });

  const e = formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tnum m-0 text-meta text-ink-3">Nouvelle nomination</p>
          <h2 id="n-titre" className="m-0 mt-1 font-serif text-h3 font-normal text-ink">
            Nommer une personne
          </h2>
        </div>
        <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="hit inline-flex size-10 items-center justify-center rounded hover:bg-surface-2">
          <Icon name="x" size={20} />
        </button>
      </div>
      <Notice tone="info" icon="bouclier" title="Double authentification exigée">
        Votre session doit être validée par votre second facteur. La personne nommée activera le sien à sa première connexion.
      </Notice>

      <Field id="n-personne" label="Personne" required error={e.person_id?.message}>
        <PersonCombobox
          value={person}
          onChange={(p) => {
            setPerson(p);
            setValue('person_id', p?.id ?? '', { shouldValidate: formState.isSubmitted });
          }}
        />
      </Field>
      <Field id="n-lieu" label="Lieu ou CEB" required hint="Sans date de fin, révocable par qui a nommé." error={e.node_id?.message}>
        <Select {...register('node_id')}>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="n-office" label="Office" required error={e.office?.message}>
        <Select {...register('office')}>
          <option value="">Choisir un office</option>
          {available.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="n-debut" label="Début" required error={e.start_date?.message}>
        <Input type="date" {...register('start_date')} />
      </Field>

      {office && (
        <div>
          <p className="m-0 flex justify-between text-sm font-semibold text-ink">
            Capacités de l’office <span className="font-normal text-ink-3">Lecture seule</span>
          </p>
          <div className="mt-2">
            {office.capabilities.length > 0 ? (
              <CapabilityChips capabilities={office.capabilities} />
            ) : (
              <p className="m-0 text-sm text-ink-3">Aucune capacité de gestion.</p>
            )}
          </div>
          <p className="m-0 mt-2 text-sm text-ink-3">
            {withoutAccess(office.capabilities)} Défini par le catalogue d’offices{office.inherits_down ? ', hérité par les nœuds rattachés' : ''}.
          </p>
        </div>
      )}

      <Field id="n-decret" label="Référence du justificatif" hint="Décret ou lettre de mission signée (référence, pas de fichier)." error={e.decree_ref?.message}>
        <Input {...register('decree_ref')} />
      </Field>
      <Field id="n-note" label="Note" error={e.note?.message}>
        <Input {...register('note')} />
      </Field>

      {create.isError && (
        <p role="alert" className="m-0 flex items-center gap-2 text-sm text-err">
          <Icon name="alerte" size={16} />
          {apiErrorCode(create.error) === 'mfa_required'
            ? 'Validez d’abord votre double authentification, puis recommencez.'
            : apiErrorMessage(create.error)}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Nomination…' : 'Nommer'}
        </Button>
      </div>
    </form>
  );
};
