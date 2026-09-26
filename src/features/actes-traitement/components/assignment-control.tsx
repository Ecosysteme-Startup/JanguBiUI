'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useMe } from '@/hooks/use-me';

import { useAssignRequest } from '../api/assign-request';
import { useAssignees } from '../api/get-assignees';
import type { ProcessorRequest } from '../types/processing';

const CLOSED = ['collected', 'rejected', 'cancelled'];

/** Assignation : la file reste celle de la paroisse, la personne assignée suit la demande. */
export const AssignmentControl = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const assignees = useAssignees(nodeId, request.id);
  const { data: me } = useMe();
  const [choice, setChoice] = useState(request.assigned_to_id ?? '');
  const assign = useAssignRequest(nodeId, {
    onSuccess: (r) => toast.ok(r.assigned_to_id ? `Demande assignée à ${r.assigned_to_name || 'la personne choisie'}.` : 'Demande remise « à assigner ».'),
  });
  const closed = CLOSED.includes(request.status);
  const current = request.assigned_to_id ? request.assigned_to_name || 'une personne de l’équipe' : null;
  const mine = me?.id && (assignees.data ?? []).some((a) => a.id === me.id) && request.assigned_to_id !== me.id;

  return (
    <section aria-labelledby="d-assign">
      <div className="tnum mb-4 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
        <h2 id="d-assign" className="m-0 text-meta font-normal">
          Assignation
        </h2>
        <span className="text-ink-3">{current ? `Assignée à ${current}` : 'À assigner'}</span>
      </div>
      {closed ? (
        <p className="m-0 text-sm text-ink-2">{current ? `Traitée par ${current}.` : 'Demande close.'}</p>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            assign.mutate({ id: request.id, body: { assignee_id: choice || null } });
          }}
        >
          <Field id="d-assignee" label="Confier la demande à" error={assign.error?.message ?? (assignees.isError ? 'L’équipe n’a pas pu être chargée.' : undefined)}>
            <Select value={choice} onChange={(e) => setChoice(e.target.value)} disabled={assignees.isPending}>
              <option value="">À assigner</option>
              {(assignees.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                  {a.id === me?.id ? ' (vous)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="secondary" size="sm" disabled={assign.isPending || choice === (request.assigned_to_id ?? '')}>
              {assign.isPending ? 'Enregistrement…' : 'Enregistrer l’assignation'}
            </Button>
            {mine && (
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                disabled={assign.isPending}
                onClick={() => {
                  setChoice(me.id);
                  assign.mutate({ id: request.id, body: { assignee_id: me.id } });
                }}
              >
                Me l’assigner
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  );
};
