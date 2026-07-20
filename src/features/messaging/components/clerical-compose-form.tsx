'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form/input';
import { Select } from '@/components/ui/form/select';
import { Textarea } from '@/components/ui/form/textarea';
import { useUser } from '@/lib/auth';
import { isEvequeOrAbove } from '@/lib/authorization';

import { usePriests } from '../api/get-priests';
import { useSendClericalMessage } from '../api/send-clerical-message';

/**
 * Option de paroisse passée en prop par la couche `app`.
 * Le fetch des paroisses (`useParishes`) reste dans la page : une feature ne
 * peut pas importer une autre feature (`org`). La page compose les deux.
 */
export interface ParishOption {
  id: number;
  name: string;
  city: string;
}

const schema = z.object({
  subject: z.string().min(1, 'Sujet requis').max(200),
  body: z.string().min(1, 'Message requis'),
  recipient_scope: z.enum([
    'individual',
    'parish_clergy',
    'diocese_clergy',
    'province_bishops',
  ]),
  scope_id: z.number().optional(),
  // UUID de BaseUser (`priest.user_id`), PAS l'entier `priest.id` qui est la PK
  // de PriestProfile. Le backend attend l'identifiant de l'utilisateur.
  individual_recipient_id: z.string().optional(),
});

type FormInput = z.infer<typeof schema>;

const SCOPE_OPTIONS = [
  { value: 'individual', label: 'Individuel' },
  { value: 'parish_clergy', label: 'Clergé de la paroisse' },
  { value: 'diocese_clergy', label: 'Clergé du diocèse' },
  { value: 'province_bishops', label: 'Évêques de la province' },
] as const;

interface ClericalComposeFormProps {
  onSuccess?: () => void;
  /** Paroisses disponibles pour le scope `parish_clergy` (fournies par la page). */
  parishes?: ParishOption[];
  /** Indique si la liste des paroisses est en cours de chargement. */
  parishesLoading?: boolean;
}

export function ClericalComposeForm({
  onSuccess,
  parishes = [],
  parishesLoading = false,
}: ClericalComposeFormProps) {
  const { data: user } = useUser();
  const { mutate, isPending } = useSendClericalMessage({ onSuccess });
  const { data: priests = [] } = usePriests();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { recipient_scope: 'individual' },
  });

  const scope = watch('recipient_scope');

  const availableScopes = SCOPE_OPTIONS.filter((opt) => {
    if (opt.value === 'province_bishops') return isEvequeOrAbove(user);
    return true;
  });

  const onSubmit = (data: FormInput) => {
    mutate({
      subject: data.subject,
      body: data.body,
      recipient_scope: data.recipient_scope,
      scope_id: data.scope_id ?? null,
      // `||` et non `??` : l'option « — Choisir un prêtre — » vaut la chaîne
      // vide, que `??` laisserait passer telle quelle au backend.
      individual_recipient_id: data.individual_recipient_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Destinataires"
        error={errors.recipient_scope}
        registration={register('recipient_scope')}
        options={availableScopes.map((opt) => ({
          label: opt.label,
          value: opt.value,
        }))}
      />

      {scope === 'individual' && (
        <Select
          label="Destinataire"
          registration={register('individual_recipient_id')}
          options={[
            { label: '— Choisir un prêtre —', value: '' },
            ...priests.map((priest) => ({
              label: priest.full_name,
              value: priest.user_id,
            })),
          ]}
        />
      )}

      {scope === 'parish_clergy' && (
        <Select
          label="Paroisse"
          registration={register('scope_id', { valueAsNumber: true })}
          options={[
            {
              label: parishesLoading
                ? 'Chargement des paroisses…'
                : '— Choisir une paroisse —',
              value: '',
            },
            ...parishes.map((parish) => ({
              label: `${parish.name} — ${parish.city}`,
              value: parish.id,
            })),
          ]}
        />
      )}

      {(scope === 'diocese_clergy' || scope === 'province_bishops') && (
        <Input
          type="number"
          label={scope === 'diocese_clergy' ? 'ID diocèse' : 'ID province'}
          placeholder={
            scope === 'diocese_clergy' ? 'ID du diocèse' : 'ID de la province'
          }
          registration={register('scope_id', { valueAsNumber: true })}
        />
      )}

      <Input
        type="text"
        label="Sujet"
        placeholder="Objet du message"
        error={errors.subject}
        registration={register('subject')}
      />

      <Textarea
        label="Message"
        rows={6}
        placeholder="Votre message…"
        className="resize-none"
        error={errors.body}
        registration={register('body')}
      />

      <Button
        type="submit"
        isLoading={isPending}
        icon={<Send className="size-4" />}
        className="w-full"
      >
        {isPending ? 'Envoi…' : 'Envoyer'}
      </Button>
    </form>
  );
}
