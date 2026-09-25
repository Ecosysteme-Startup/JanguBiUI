'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

import { useTransitionRequest } from '../api/transition-request';
import type { ProcessorRequest } from '../types/processing';
import { allowedTransitions, isClosed, NEXT_STEP, type Transition } from '../utils/transitions';

import { TransitionModal } from './transition-modal';

const LABELS: Record<Transition, string> = {
  'start-verification': 'Commencer la vérification',
  'mark-ready': 'Marquer comme prête à retirer',
  'request-info': 'Demander un complément',
  reject: 'Rejeter',
  'mark-collected': 'Marquer comme retirée',
};

const DONE: Record<Transition, string> = {
  'start-verification': 'Demande passée en vérification.',
  'mark-ready': 'Demande prête à retirer : le fidèle est prévenu.',
  'request-info': 'Complément demandé au fidèle.',
  reject: 'Demande rejetée : le motif est transmis au fidèle.',
  'mark-collected': 'Original remis : demande close.',
};

/** Étape suivante : seules les transitions permises au statut courant sont proposées (SRS §8.1). */
export const DecisionPanel = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const [open, setOpen] = useState<Transition | null>(null);
  const transition = useTransitionRequest(nodeId, {
    onSuccess: () => {
      if (open) toast.ok(DONE[open]);
      setOpen(null);
    },
  });
  const actions = allowedTransitions(request.status);
  const [primary, ...secondary] = actions;

  const run = (t: Transition) => {
    transition.reset();
    // Sans saisie : la transition part directement.
    if (t === 'start-verification') {
      transition.mutate({ id: request.id, transition: t, body: { message: '', pickup_hours: '' } }, { onSuccess: () => toast.ok(DONE[t]) });
      return;
    }
    setOpen(t);
  };

  return (
    <section aria-labelledby="d-decision" className="rounded border border-line-strong bg-surface p-6">
      <h2 id="d-decision" className="tnum m-0 text-meta font-normal text-primary">
        Étape suivante
      </h2>
      <p className="m-0 mt-3 text-base text-ink">{NEXT_STEP[request.status]}</p>
      {primary && (
        <div className="mt-5 flex flex-col gap-3">
          <Button block onClick={() => run(primary)} disabled={transition.isPending} aria-haspopup={primary === 'start-verification' ? undefined : 'dialog'}>
            {LABELS[primary]}
          </Button>
          {secondary.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {secondary.map((t) => (
                <Button key={t} variant={t === 'reject' ? 'danger' : 'secondary'} onClick={() => run(t)} aria-haspopup="dialog">
                  {LABELS[t]}
                </Button>
              ))}
            </div>
          )}
          {secondary.length > 0 && <p className="m-0 text-sm text-ink-3">Complément et rejet exigent un motif, transmis au fidèle par notification.</p>}
        </div>
      )}
      {!open && transition.error && (
        <p role="alert" className="m-0 mt-3 text-sm text-err">
          {transition.error.message}
        </p>
      )}
      {!primary && !isClosed(request.status) && <p className="m-0 mt-3 text-sm text-ink-3">Aucune action possible pour l’instant.</p>}
      {open && (
        <TransitionModal
          transition={open}
          request={request}
          pending={transition.isPending}
          error={transition.error?.message ?? null}
          onClose={() => setOpen(null)}
          onConfirm={(body) => transition.mutate({ id: request.id, transition: open, body })}
        />
      )}
    </section>
  );
};
