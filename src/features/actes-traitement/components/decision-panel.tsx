'use client';

import { useState } from 'react';

import { RequestStatusBadge } from '@/components/signature/status-dot';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useTransitionRequest } from '../api/transition-request';
import type { ProcessorRequest } from '../types/processing';
import { statusSince } from '../utils/history';
import { allowedTransitions, isClosed, NEXT_STEP, type Transition } from '../utils/transitions';

import { TransitionModal } from './transition-modal';

const LABELS: Record<Transition, string> = {
  'start-verification': 'Commencer la vérification',
  'mark-ready': 'Marquer prête à retirer',
  'request-info': 'Demander un complément',
  reject: 'Rejeter la demande',
  'mark-collected': 'Marquer comme retirée',
};

/** Choix du statut suivant quand plusieurs transitions sont permises (ordre de la maquette). */
const OPTIONS: { transition: Transition; label: string; description: string; tone?: 'err' }[] = [
  { transition: 'request-info', label: 'Complément demandé', description: 'Une information ou une pièce manque encore.' },
  { transition: 'mark-ready', label: 'Prête à retirer', description: 'L’original attend au secrétariat.' },
  { transition: 'reject', label: 'Rejetée', description: 'Motif obligatoire, communiqué au demandeur.', tone: 'err' },
];

const DONE: Record<Transition, string> = {
  'start-verification': 'Demande passée en vérification.',
  'mark-ready': 'Demande prête à retirer : le fidèle est prévenu.',
  'request-info': 'Complément demandé au fidèle.',
  reject: 'Demande rejetée : le motif est transmis au fidèle.',
  'mark-collected': 'Original remis : demande close.',
};

/** Carte « Statut » : seules les transitions permises au statut courant sont proposées (SRS §8.1). */
export const DecisionPanel = ({ nodeId, request }: { nodeId: string; request: ProcessorRequest }) => {
  const [open, setOpen] = useState<Transition | null>(null);
  const actions = allowedTransitions(request.status);
  const choices = OPTIONS.filter((o) => actions.includes(o.transition));
  const [chosen, setChosen] = useState<Transition>(actions.includes('mark-ready') ? 'mark-ready' : actions[0]);
  const [signed, setSigned] = useState(false);
  const transition = useTransitionRequest(nodeId, {
    onSuccess: () => {
      if (open) toast.ok(DONE[open]);
      setOpen(null);
    },
  });
  const since = statusSince(request);
  // Un seul choix possible : un bouton direct ; plusieurs : liste de statuts puis confirmation.
  const current = choices.length > 1 ? (actions.includes(chosen) ? chosen : actions[0]) : actions[0];
  const needsSignature = current === 'mark-ready';

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
    <section aria-labelledby="d-decision" className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <h2 id="d-decision" className="m-0 text-18 font-semibold text-ink">
        Statut
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <RequestStatusBadge status={request.status} />
        {since && <span className="text-13 text-ink-3">depuis le {dayjs(since).format('D MMM')}</span>}
      </div>
      <p className="m-0 mt-3 text-14 text-ink-2">{NEXT_STEP[request.status]}</p>

      {choices.length > 1 && (
        <fieldset className="m-0 mt-4 border-0 p-0">
          <legend className="p-0 text-14 font-medium text-ink">Changer le statut</legend>
          <div className="mt-2 overflow-hidden rounded-12 border border-line">
            {choices.map((option, index) => (
              <div key={option.transition} className={cn('px-3.5 py-3 has-[:checked]:bg-tint-50', index > 0 && 'border-t border-line')}>
                <Choice
                  type="radio"
                  name="statut-suivant"
                  value={option.transition}
                  checked={current === option.transition}
                  onChange={() => setChosen(option.transition)}
                  label={
                    <span className={cn(current === option.transition ? 'font-semibold' : 'font-medium', option.tone === 'err' ? 'text-err' : 'text-ink')}>
                      {option.label}
                    </span>
                  }
                  description={option.description}
                />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {needsSignature && (
        <Choice
          className="mt-4 text-14"
          checked={signed}
          onChange={(e) => setSigned(e.target.checked)}
          label="L’original papier est signé par le curé et scellé."
        />
      )}

      {current && (
        <Button
          block
          size="lg"
          className="mt-5 text-15"
          variant={current === 'reject' ? 'danger' : 'primary'}
          onClick={() => run(current)}
          disabled={transition.isPending || (needsSignature && !signed)}
          aria-haspopup={current === 'start-verification' ? undefined : 'dialog'}
        >
          {LABELS[current]}
        </Button>
      )}
      {choices.length > 1 && <p className="m-0 mt-3 text-13 text-ink-3">Complément et rejet exigent un motif, transmis au fidèle par notification.</p>}
      {!open && transition.error && (
        <p role="alert" className="m-0 mt-3 text-14 text-err">
          {transition.error.message}
        </p>
      )}
      {!current && !isClosed(request.status) && <p className="m-0 mt-3 text-14 text-ink-3">Aucune action possible pour l’instant.</p>}
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
