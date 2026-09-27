'use client';

import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useMe } from '@/hooks/use-me';
import { useCan } from '@/lib/can';
import { dayjs } from '@/utils/dates';

import { useAssignRequest } from '../api/assign-request';
import { useAssignees } from '../api/get-assignees';
import { useTypeDelays } from '../api/get-type-delays';
import type { ProcessorRequest } from '../types/processing';
import { isClosed } from '../utils/transitions';

/** Délai indicatif du type d'acte : lisible avec les réglages du secrétariat (horaires ou structure). */
const DelayFacts = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const canSchedule = useCan('horaires.gerer', nodeId);
  const canStructure = useCan('structure.gerer', nodeId);
  const canRead = canSchedule || canStructure;
  const delays = useTypeDelays(nodeId, canRead);
  const item = delays.data?.items.find((i) => i.document_type === request.document_type);
  const indicative = item ? (item.days ?? delays.data?.default_days) : undefined;
  const age = dayjs().diff(dayjs(request.created_at), 'day');
  return (
    <dl className="m-0 mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
      <div className="flex flex-col gap-0.5">
        <dt className="text-13 text-ink-3">Reçue il y a</dt>
        <dd className="tnum m-0 text-15 text-ink">{age <= 0 ? 'moins d’un jour' : `${age}\u00a0j`}</dd>
      </div>
      {indicative !== undefined && (
        <div className="flex flex-col gap-0.5">
          <dt className="text-13 text-ink-3">Délai indicatif</dt>
          <dd className="tnum m-0 text-15 text-ink">{indicative}&nbsp;j</dd>
        </div>
      )}
    </dl>
  );
};

/** Carte « Attribution » : la file reste celle de la paroisse, la personne choisie suit la demande. */
export const AssignmentControl = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const assignees = useAssignees(nodeId, request.id);
  const { data: me } = useMe();
  const [choice, setChoice] = useState(request.assigned_to_id ?? '');
  const assign = useAssignRequest(nodeId, {
    onSuccess: (r) => toast.ok(r.assigned_to_id ? `Demande assignée à ${r.assigned_to_name || 'la personne choisie'}.` : 'Demande remise « à assigner ».'),
  });
  const closed = isClosed(request.status);
  const current = request.assigned_to_id ? request.assigned_to_name || 'une personne de l’équipe' : null;
  const chosenName = (assignees.data ?? []).find((a) => a.id === choice)?.full_name ?? (choice === request.assigned_to_id ? current : null);
  const mine = me?.id && (assignees.data ?? []).some((a) => a.id === me.id) && request.assigned_to_id !== me.id;
  const error = assign.error?.message ?? (assignees.isError ? 'L’équipe n’a pas pu être chargée.' : undefined);

  return (
    <section aria-labelledby="d-assign" className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <h2 id="d-assign" className="m-0 text-18 font-semibold text-ink">
        Attribution
      </h2>
      {closed ? (
        <p className="m-0 mt-3 text-14 text-ink-2">{current ? `Traitée par ${current}.` : 'Demande close.'}</p>
      ) : (
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            assign.mutate({ id: request.id, body: { assignee_id: choice || null } });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="d-assignee" className="text-14 font-medium text-ink">
              Suivie par
            </label>
            <div className="relative">
              {chosenName ? (
                <Avatar name={chosenName} size={24} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2" />
              ) : (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-6 -translate-y-1/2 rounded-full border border-dashed border-line-field"
                />
              )}
              <Select
                id="d-assignee"
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
                disabled={assignees.isPending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'd-assignee-err' : undefined}
                className="bg-surface pl-11"
              >
                <option value="">Non attribuée</option>
                {(assignees.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                    {a.id === me?.id ? ' (vous)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            {error && (
              <p id="d-assignee-err" role="alert" className="m-0 text-13 text-err">
                {error}
              </p>
            )}
          </div>
          {(choice !== (request.assigned_to_id ?? '') || mine) && (
            <div className="flex flex-wrap items-center gap-3">
              {choice !== (request.assigned_to_id ?? '') && (
                <Button type="submit" variant="outline" size="sm" disabled={assign.isPending}>
                  {assign.isPending ? 'Enregistrement…' : 'Enregistrer l’attribution'}
                </Button>
              )}
              {mine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={assign.isPending}
                  onClick={() => {
                    setChoice(me.id);
                    assign.mutate({ id: request.id, body: { assignee_id: me.id } });
                  }}
                >
                  Me l’attribuer
                </Button>
              )}
            </div>
          )}
        </form>
      )}
      <DelayFacts nodeId={nodeId} request={request} />
    </section>
  );
};
