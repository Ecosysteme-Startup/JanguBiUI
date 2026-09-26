import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';

/**
 * Statuts d'acte (SRS §8.1) et leur badge (WEB-Design-System, « Six statuts de demande ») :
 * pilule 24 px, point de 6 px, libellé toujours visible. Retirée : coche, sans point.
 */
export const REQUEST_STATUS = {
  submitted: { label: 'Soumise', tone: 'neutral', hint: 'Reçue par la paroisse du sacrement' },
  under_verification: { label: 'En vérification', tone: 'info', hint: 'Le secrétariat recherche l’acte au registre' },
  info_requested: { label: 'Complément demandé', tone: 'warn', hint: 'Action attendue du fidèle' },
  ready_for_pickup: { label: 'Prête à retirer', tone: 'ok', hint: 'Original papier signé et scellé, à retirer' },
  collected: { label: 'Retirée', tone: 'muted', hint: 'Terminée' },
  rejected: { label: 'Rejetée', tone: 'err', hint: 'Motif toujours expliqué au fidèle' },
  cancelled: { label: 'Annulée', tone: 'muted', hint: 'Par le demandeur' },
} as const satisfies Record<string, { label: string; tone: BadgeTone; hint: string }>;
export type RequestStatus = keyof typeof REQUEST_STATUS;

const STATUS_ICON: Partial<Record<RequestStatus, IconName>> = { collected: 'check', cancelled: 'x' };

/** Autres familles (réservations, nominations, vérifications) → ton de badge. */
const GENERIC: Record<StatusTone, BadgeTone> = {
  ok: 'ok',
  primary: 'info',
  warn: 'warn',
  err: 'err',
  muted: 'muted',
  outline: 'neutral',
};
export type StatusTone = 'ok' | 'primary' | 'warn' | 'err' | 'muted' | 'outline';

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
  const badgeTone: BadgeTone = status ? REQUEST_STATUS[status].tone : GENERIC[tone ?? 'muted'];
  const text = label ?? (status ? REQUEST_STATUS[status].label : '');
  const icon = status ? STATUS_ICON[status] : undefined;
  return (
    <Badge tone={badgeTone} dot={!icon && badgeTone !== 'muted'} icon={icon} className={className}>
      {text}
    </Badge>
  );
};
