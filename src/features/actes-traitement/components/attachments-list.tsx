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
 * Pièces justificatives déposées par le fidèle. « Ouvrir » ouvre un lien personnel qui expire
 * en quelques minutes ; passé ce délai, on renouvelle les liens au lieu d'ouvrir une page d'erreur.
 */
export const AttachmentsList = ({ attachments, onExpired }: Props) => {
  if (attachments.length === 0)
    return <p className="m-0 mt-5 text-14 text-ink-3">Aucune pièce justificative jointe par le fidèle.</p>;

  return (
    <ul aria-label="Pièces jointes du fidèle" className="m-0 mt-5 flex list-none flex-col gap-2 p-0">
      {attachments.map((a) => {
        const meta = [formatSize(a.size), `déposée le ${dotDate(a.uploaded_at)}`, 'effacée 90 j après clôture'].filter(Boolean).join(' · ');
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-12 border border-line bg-surface px-3.5 py-3">
            <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-10 bg-tint-100 text-primary-strong">
              <Icon name={a.content_type.startsWith('image/') ? 'image' : 'document'} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="break-all text-15 font-semibold text-ink">{a.name}</span>
              <span className="tnum text-13 text-ink-3">{meta}</span>
            </span>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ouvrir ${a.name} (nouvel onglet)`}
              className="hit shrink-0 text-14 font-semibold hover:underline"
              onClick={async (event) => {
                if (Date.parse(a.expires_at) - MARGIN_MS > Date.now()) return;
                event.preventDefault();
                await onExpired();
                toast.ok('Lien de consultation renouvelé : cliquez à nouveau sur « Ouvrir ».');
              }}
            >
              Ouvrir
            </a>
          </li>
        );
      })}
    </ul>
  );
};
