import type { TimelineStep } from '@/components/signature/request-timeline';
import { dayjs, hour } from '@/utils/dates';

import type { DocumentRequest, HistoryEntry } from '../types/request';

/** Chemin nominal (SRS §8.1) : ce qui reste à venir est calculé sur ce chemin. */
const MAIN_PATH = ['submitted', 'under_verification', 'ready_for_pickup', 'collected'] as const;

const TITLES: Record<string, string> = {
  submitted: 'Demande soumise',
  under_verification: 'En vérification dans le registre',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Retirée',
  rejected: 'Demande rejetée',
  cancelled: 'Demande annulée',
};

const UPCOMING_DETAIL: Record<string, string> = {
  under_verification: 'Le secrétariat recherche l’acte dans le registre.',
  ready_for_pickup: 'Vous serez prévenu par notification.',
  collected: 'Remise de l’original signé et scellé, sur présentation d’une pièce d’identité.',
};

export const OPEN_STATUSES = ['submitted', 'under_verification', 'info_requested', 'ready_for_pickup'] as const;
export const isOpen = (status: string) => (OPEN_STATUSES as readonly string[]).includes(status);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « Lun. 21.09 · 10 h 14 » */
export const stamp = (iso: string) => `${capitalize(dayjs(iso).format('ddd DD.MM'))} · ${hour(iso)}`;

const detailOf = (entry: HistoryEntry, request: DocumentRequest): string | undefined => {
  if (entry.to_status === 'submitted') return `Transmise à ${request.target_node?.name ?? 'la paroisse du sacrement'}, paroisse du sacrement.`;
  if (entry.to_status === 'rejected') return entry.comment || request.rejection_reason || undefined;
  return entry.comment || undefined;
};

/** Étapes de la timeline du fidèle : journal réel, puis étapes à venir du chemin nominal. */
export const buildTimeline = (request: DocumentRequest): TimelineStep[] => {
  const history: HistoryEntry[] = request.history.length
    ? request.history
    : [{ from_status: '', to_status: request.status, comment: '', created_at: request.updated_at }];
  const finished = request.status === 'collected';
  const past: TimelineStep[] = history.map((entry, index) => {
    const isLast = index === history.length - 1;
    const current = isLast && !finished;
    return {
      key: `h-${index}`,
      when: current && index > 0 ? `Depuis ${dayjs(entry.created_at).format('ddd DD.MM')}` : stamp(entry.created_at),
      title: TITLES[entry.to_status] ?? entry.to_status,
      detail: detailOf(entry, request),
      state: current ? 'current' : 'done',
    };
  });
  const position = request.status === 'info_requested' ? 1 : (MAIN_PATH as readonly string[]).indexOf(request.status);
  if (position < 0) return past;
  const upcoming: TimelineStep[] = MAIN_PATH.slice(position + 1).map((status) => ({
    key: `u-${status}`,
    when:
      status === 'ready_for_pickup' && request.estimated_ready_on
        ? `À venir · estimé ${dayjs(request.estimated_ready_on).format('ddd DD.MM')}`
        : 'À venir',
    title: TITLES[status],
    detail: UPCOMING_DETAIL[status],
    state: 'upcoming',
  }));
  return [...past, ...upcoming];
};

/** Dernier message de la paroisse demandant un complément (journal, statut info_requested). */
export const pendingInfoRequest = (request: DocumentRequest): HistoryEntry | undefined =>
  [...request.history].reverse().find((entry) => entry.to_status === 'info_requested');

export type ParishMessage = { key: string; from: 'paroisse' | 'fidele'; when: string; text: string; status: string };

/** Messages échangés, tirés du journal : ce que la paroisse a écrit en faisant avancer la demande. */
export const messagesOf = (request: DocumentRequest): ParishMessage[] =>
  request.history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.comment.trim() && entry.to_status !== 'submitted')
    .map(({ entry, index }) => ({
      key: `m-${index}`,
      from: entry.from_status === 'info_requested' && entry.to_status === 'under_verification' ? 'fidele' : 'paroisse',
      when: `${dayjs(entry.created_at).format('DD.MM')}, ${hour(entry.created_at)}`,
      text: entry.comment,
      status: entry.to_status,
    }));
