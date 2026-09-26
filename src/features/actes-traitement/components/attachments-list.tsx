'use client';

import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import { dotDate } from '@/utils/dates';

import type { Attachment } from '../types/processing';

const KIB = 1024;

/** « 412 Ko », « 1,2 Mo » */
export const formatSize = (bytes: number | null) => {
  if (bytes === null) return null;
  if (bytes < KIB * KIB) return `${Math.max(1, Math.round(bytes / KIB))} Ko`;
  return `${(bytes / (KIB * KIB)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
};

const MARGIN_MS = 10_000;

type Props = { attachments: Attachment[]; onExpired: () => Promise<unknown> };

/**
 * Pièces justificatives déposées par le fidèle. « Consulter » ouvre un lien personnel qui expire
 * en quelques minutes ; passé ce délai, on renouvelle les liens au lieu d'ouvrir une page d'erreur.
 */
export const AttachmentsList = ({ attachments, onExpired }: Props) => {
  if (attachments.length === 0)
    return <p className="m-0 mt-4 text-sm text-ink-3">Aucune pièce justificative jointe par le fidèle.</p>;

  return (
    <ul aria-label="Pièces jointes du fidèle" className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
      {attachments.map((a) => {
        const meta = [formatSize(a.size), `déposée le ${dotDate(a.uploaded_at)}`, 'effacée 90 j après clôture'].filter(Boolean).join(' · ');
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line px-4 py-3">
            <span className="flex min-w-0 items-start gap-3">
              <Icon name="document" size={20} className="mt-0.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block break-all text-sm font-semibold text-ink">{a.name}</span>
                <span className="tnum block text-meta text-ink-3">{meta}</span>
              </span>
            </span>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consulter ${a.name} (nouvel onglet)`}
              className="text-sm font-medium"
              onClick={async (event) => {
                if (Date.parse(a.expires_at) - MARGIN_MS > Date.now()) return;
                event.preventDefault();
                await onExpired();
                toast.ok('Lien de consultation renouvelé : cliquez à nouveau sur « Consulter ».');
              }}
            >
              Consulter
            </a>
          </li>
        );
      })}
    </ul>
  );
};
