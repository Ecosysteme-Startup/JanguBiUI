import { cn } from '@/utils/cn';

/** Statuts d'acte (SRS §8.1) et leur rendu « point + texte » (DS-Composants §02). */
export const REQUEST_STATUS = {
  submitted: { label: 'Soumise', text: 'text-ink-2', dot: 'border-[1.5px] border-ink-2', hint: 'Reçue, non ouverte' },
  under_verification: {
    label: 'En vérification',
    text: 'font-medium text-ink',
    dot: 'border-[1.5px] border-primary bg-[linear-gradient(90deg,var(--jb-primary)_50%,transparent_50%)]',
    hint: 'Registre ouvert',
  },
  info_requested: { label: 'Complément demandé', text: 'font-semibold text-warn', dot: 'bg-warn-dot', hint: 'Au fidèle' },
  ready_for_pickup: { label: 'Prête à retirer', text: 'font-semibold text-primary', dot: 'bg-primary', hint: 'Au secrétariat' },
  collected: { label: 'Retirée', text: 'text-ink-3', dot: 'bg-ink-3', hint: 'Original remis' },
  rejected: { label: 'Rejetée', text: 'font-medium text-err', dot: 'bg-err', hint: 'Motif transmis' },
  cancelled: { label: 'Annulée', text: 'text-ink-3', dot: 'border-[1.5px] border-ink-3', hint: 'Par le demandeur' },
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

/** Autres familles : réservations, nominations, vérifications. */
const GENERIC = {
  ok: { text: 'font-semibold text-ok', dot: 'bg-ok' },
  primary: { text: 'font-semibold text-primary', dot: 'bg-primary' },
  warn: { text: 'font-semibold text-warn', dot: 'bg-warn-dot' },
  err: { text: 'font-medium text-err', dot: 'bg-err' },
  muted: { text: 'text-ink-3', dot: 'bg-ink-3' },
  outline: { text: 'text-ink-2', dot: 'border-[1.5px] border-ink-2' },
} as const;
export type StatusTone = keyof typeof GENERIC;

export const StatusDot = ({
  status,
  tone,
  label,
  className,
}: {
  status?: RequestStatus;
  tone?: StatusTone;
  label?: string;
  className?: string;
}) => {
  const style = status ? REQUEST_STATUS[status] : GENERIC[tone ?? 'muted'];
  const text = label ?? (status ? REQUEST_STATUS[status].label : '');
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm', style.text, className)}>
      <span className={cn('inline-block size-2 shrink-0 rounded-full', style.dot)} aria-hidden="true" />
      {text}
    </span>
  );
};
