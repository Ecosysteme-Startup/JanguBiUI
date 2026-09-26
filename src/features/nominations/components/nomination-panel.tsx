'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { PersonCombobox } from '@/components/signature/person-combobox';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { officeTypesQueryOptions } from '@/hooks/use-office-types';
import type { PersonOption } from '@/hooks/use-person-search';
import { apiErrorCode, apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useCreateAssignment } from '../api/create-assignment';
import { usePlaceSearch } from '../api/search-places';

const schema = z.object({
  person_id: z.string().min(1, 'Choisissez la personne à nommer.'),
  node_id: z.string().min(1, 'Choisissez le lieu.'),
  office: z.string().min(1, 'Choisissez l’office.'),
  start_date: z.string().min(1, 'Indiquez la date de début.'),
  decree_ref: z.string().max(120, '120 caractères au plus.'),
});
type Values = z.infer<typeof schema>;

type Place = { id: string; name: string; type: string };

type NominationPanelProps = { nodeId: string; nodeName: string; nodeType: string; onClose: () => void };

/** Panneau « Nouvelle nomination » (DIO-Nominations) : personne, lieu du sous-arbre, office, début, décret. */
export const NominationPanel = ({ nodeId, nodeName, nodeType, onClose }: NominationPanelProps) => {
  const [person, setPerson] = React.useState<PersonOption | null>(null);
  const [placeQuery, setPlaceQuery] = React.useState('');
  const debouncedPlace = useDebounce(placeQuery.trim(), 300);
  const places = usePlaceSearch(nodeId, debouncedPlace);
  const offices = useQuery(officeTypesQueryOptions());
  const create = useCreateAssignment({
    onSuccess: (a) => {
      toast.ok(`Nomination enregistrée : ${a.person.full_name}, ${a.office_label.toLowerCase()}. Inscrit au journal d’audit.`);
      onClose();
    },
  });
  const { register, handleSubmit, setValue, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { person_id: '', node_id: nodeId, office: '', start_date: dayjs().format('YYYY-MM-DD'), decree_ref: '' },
  });

  const context: Place = { id: nodeId, name: nodeName, type: nodeType };
  const found: Place[] = (places.data?.results ?? []).map((p) => ({ id: p.id, name: `${p.name} · ${p.type.label}`, type: p.type.code }));
  // Le lieu choisi reste proposé même quand la recherche change.
  const [chosen, setChosen] = React.useState<Place>(context);
  const options = [context, ...(chosen.id !== nodeId && !found.some((p) => p.id === chosen.id) ? [chosen] : []), ...found];
  const available = (offices.data ?? []).filter((o) => o.node_types.length === 0 || o.node_types.includes(chosen.type));

  const onSubmit = handleSubmit(async (v) => {
    try {
      await create.mutateAsync({ ...v, end_date: null, note: '' });
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field in v) setError(field as keyof Values, { message });
      });
    }
  });

  const e = formState.errors;
  return (
    <section aria-labelledby="nn-titre" className="border border-line-strong bg-surface p-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tnum m-0 text-meta text-ink-3">Nouvelle nomination</p>
            <h2 id="nn-titre" className="m-0 mt-1 font-serif text-h3 font-normal text-ink">
              Nommer une personne
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={onClose}
            className="hit inline-flex size-10 items-center justify-center rounded hover:bg-surface-2"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <Notice tone="info" icon="bouclier" title="Double authentification exigée">
          Votre session doit être validée par votre second facteur. La nomination est inscrite au journal d’audit.
        </Notice>

        <Field id="nn-personne" label="Personne" required error={e.person_id?.message}>
          <PersonCombobox
            value={person}
            onChange={(p) => {
              setPerson(p);
              setValue('person_id', p?.id ?? '', { shouldValidate: formState.isSubmitted });
            }}
          />
        </Field>

        <Field id="nn-lieu-recherche" label="Rechercher un lieu" hint="Paroisse, doyenné ou CEB du sous-arbre ; 2 caractères au moins.">
          <Input type="search" value={placeQuery} onChange={(ev) => setPlaceQuery(ev.target.value)} autoComplete="off" />
        </Field>
        <Field id="nn-lieu" label="Lieu" required error={e.node_id?.message}>
          <Select
            {...register('node_id', {
              onChange: (ev: React.ChangeEvent<HTMLSelectElement>) => {
                setChosen(options.find((o) => o.id === ev.target.value) ?? context);
                setValue('office', '');
              },
            })}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="nn-office" label="Office" required error={e.office?.message}>
          <Select {...register('office')}>
            <option value="">Choisir un office</option>
            {available.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="nn-debut" label="Début" required hint="Une date future crée une nomination proposée." error={e.start_date?.message}>
          <Input type="date" {...register('start_date')} />
        </Field>
        <Field id="nn-decret" label="Référence du décret" error={e.decree_ref?.message}>
          <Input {...register('decree_ref')} />
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
    </section>
  );
};
