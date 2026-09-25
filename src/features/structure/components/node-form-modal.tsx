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
import { useNodeTypes } from '@/hooks/use-node-types';
import { applyServerErrors } from '@/utils/form-errors';

import type { StructureNode } from '../api/node-schema';
import { useCreateNode, useUpdateNode } from '../api/save-node';

const schema = z.object({
  name: z.string().trim().min(1, 'Indiquez le nom du nœud.').max(200, '200 caractères au plus.'),
  type: z.string().min(1, 'Choisissez le type de nœud.'),
  code: z.string().trim().max(64, '64 caractères au plus.'),
  status: z.enum(['en_fondation', 'erige']),
  city: z.string().trim().max(100, '100 caractères au plus.'),
  address: z.string().trim(),
  erected_at: z.string(),
  is_active_on_platform: z.boolean(),
});
type NodeFormValues = z.infer<typeof schema>;
const FIELDS = ['name', 'type', 'code', 'status', 'city', 'address', 'erected_at', 'is_active_on_platform'] as const;

type NodeFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Création : le parent du nouveau nœud. */
  parent?: StructureNode;
  /** Modification : le nœud à modifier. */
  node?: StructureNode;
  onSaved?: (node: StructureNode) => void;
};

/** Création ou modification d'un nœud de l'arbre (structure.gerer). */
export const NodeFormModal = ({ open, onOpenChange, parent, node, onSaved }: NodeFormModalProps) => {
  const id = React.useId();
  const types = useNodeTypes();
  const create = useCreateNode();
  const update = useUpdateNode();
  const [formError, setFormError] = React.useState<string | null>(null);
  const editing = Boolean(node);
  const allowedTypes = (types.data ?? []).filter((t) => (parent ? t.allowed_parent_types.includes(parent.type.code) : true));

  const { register, handleSubmit, reset, setError, formState } = useForm<NodeFormValues>({
    resolver: zodResolver(schema),
    values: {
      name: node?.name ?? '',
      type: node?.type.code ?? '',
      code: node?.code ?? '',
      status: node?.status === 'en_fondation' ? 'en_fondation' : 'erige',
      city: node?.city ?? '',
      address: node?.address ?? '',
      erected_at: node?.erected_at ?? '',
      is_active_on_platform: node?.is_active_on_platform ?? false,
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
    const common = {
      name: values.name,
      status: values.status,
      city: values.city,
      address: values.address,
      erected_at: values.erected_at || null,
      is_active_on_platform: values.is_active_on_platform,
    };
    try {
      const saved = node
        ? await update.mutateAsync({ id: node.id, body: { ...common, ...(values.code ? { code: values.code } : {}) } })
        : await create.mutateAsync({ ...common, type: values.type, code: values.code, parent_id: parent?.id ?? null });
      toast.ok(editing ? 'Nœud modifié.' : `« ${saved.name} » ajouté à l’arbre.`);
      onSaved?.(saved);
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
      title={editing ? `Modifier « ${node?.name} »` : 'Ajouter un nœud'}
      description={parent && !editing ? `Sous ${parent.name}.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Annuler
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter le nœud'}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id={`${id}-nom`} label="Nom" required error={errors.name?.message}>
          <Input {...register('name')} autoComplete="off" />
        </Field>
        {!editing && (
          <Field
            id={`${id}-type`}
            label="Type de nœud"
            required
            error={errors.type?.message}
            hint={parent ? `Types autorisés sous ${parent.type.label.toLowerCase()}.` : undefined}
          >
            <Select {...register('type')}>
              <option value="">Choisir…</option>
              {allowedTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${id}-code`}
            label="Code"
            hint={editing ? undefined : 'Laissé vide : attribué automatiquement.'}
            error={errors.code?.message}
          >
            <Input {...register('code')} autoComplete="off" />
          </Field>
          <Field id={`${id}-statut`} label="Statut canonique" error={errors.status?.message}>
            <Select {...register('status')}>
              <option value="erige">Érigé</option>
              <option value="en_fondation">En fondation</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${id}-ville`} label="Ville" error={errors.city?.message}>
            <Input {...register('city')} autoComplete="off" />
          </Field>
          <Field id={`${id}-erige`} label="Date d’érection" error={errors.erected_at?.message}>
            <Input type="date" {...register('erected_at')} />
          </Field>
        </div>
        <Field id={`${id}-adresse`} label="Adresse" error={errors.address?.message}>
          <Input {...register('address')} autoComplete="off" />
        </Field>
        <Choice
          {...register('is_active_on_platform')}
          label="Active sur Jàngu Bi"
          description="Les fidèles peuvent suivre ce nœud et lui adresser leurs demandes."
        />
        <div aria-live="polite">{formError && <Notice tone="err" title={formError} />}</div>
      </form>
    </Modal>
  );
};
