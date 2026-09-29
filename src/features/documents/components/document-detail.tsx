'use client';

import { Clock, MapPin, Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Spinner } from '@/components/ui/spinner';
import {
  StatusTimeline,
  type TimelineStep,
} from '@/components/ui/status-timeline';

import { useCancelDocument } from '../api/cancel-document';
import { useDocumentRequest } from '../api/get-document';
import { useSubmitSupplement } from '../api/submit-supplement';
import { useUploadDocumentFile } from '../api/upload-document-file';
import { type DocumentStatus, REQUESTER_STATUSES } from '../types';

import {
  DOCUMENT_STATUS_CONFIG,
  DocumentStatusBadge,
} from './document-status-badge';

interface DocumentDetailProps {
  documentId: string;
}

const TZ = 'Africa/Dakar';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}

const isKnownStatus = (s: string): s is DocumentStatus =>
  (REQUESTER_STATUSES as readonly string[]).includes(s);

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const { data, isLoading, isError } = useDocumentRequest(documentId);
  const [supplement, setSupplement] = useState('');
  const [fileId, setFileId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: submitSupplement, isPending: isSubmitting } =
    useSubmitSupplement(documentId);
  const { mutate: upload, isPending: isUploading } = useUploadDocumentFile();
  const { mutate: cancel, isPending: isCancelling } =
    useCancelDocument(documentId);

  useRegisterPageMeta({ title: 'Demande de document', showHeading: false });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Le fichier dépasse 10 Mo.');
      return;
    }
    upload(file, {
      onSuccess: (res) => {
        setFileId(res.id);
        setFileName(file.name);
      },
      onError: () => setFileError('Le fichier n’a pas pu être envoyé.'),
    });
  }

  function handleSupplementSubmit(e: React.FormEvent) {
    e.preventDefault();
    const notes = supplement.trim();
    if (!notes && fileId == null) return;
    submitSupplement(
      {
        ...(notes ? { additional_info: notes } : {}),
        ...(fileId != null ? { attachment_file_id: fileId } : {}),
      },
      {
        onSuccess: () => {
          setSupplement('');
          setFileId(null);
          setFileName(null);
        },
      },
    );
  }

  return (
    <div className="flex flex-col">
      <ContentContainer>
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <p className="py-10 text-center text-sm text-destructive">
            Impossible de charger cette demande.
          </p>
        )}

        {!isLoading && !isError && data && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Label>Type de document</Label>
                <h1 className="mt-1 text-xl font-semibold text-foreground">
                  {data.document_type_free || data.document_type_label}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Réf. {data.reference}
                </p>
              </div>
              <DocumentStatusBadge status={data.status} />
            </div>

            {data.status === 'rejected' && data.rejection_reason && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  Motif du refus
                </p>
                <p className="mt-1 text-sm text-destructive/80">
                  {data.rejection_reason}
                </p>
              </div>
            )}

            {data.status === 'ready_for_pickup' && data.pickup && (
              <Card
                variant="elevated"
                className="space-y-2 border-success/30 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  Votre acte est prêt
                </p>
                {data.pickup.place_name && (
                  <p className="flex items-start gap-1.5 text-sm text-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {data.pickup.place_name}
                      {data.pickup.place_address
                        ? `, ${data.pickup.place_address}`
                        : ''}
                    </span>
                  </p>
                )}
                {data.pickup.hours && (
                  <p className="flex items-center gap-1.5 text-sm text-foreground">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    {data.pickup.hours}
                  </p>
                )}
                {data.pickup.message && (
                  <p className="text-sm text-muted-foreground">
                    {data.pickup.message}
                  </p>
                )}
                {data.pickup.original_notice && (
                  <p className="text-xs text-muted-foreground">
                    {data.pickup.original_notice}
                  </p>
                )}
              </Card>
            )}

            <Card variant="elevated" className="space-y-3 p-4">
              <div>
                <Label>Date de la demande</Label>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDate(data.created_at)}
                </p>
              </div>
              {data.target_node && (
                <div>
                  <Label>Paroisse du registre</Label>
                  <p className="mt-1 text-sm text-foreground">
                    {data.target_node.name}
                  </p>
                </div>
              )}
              <div>
                <Label>Motif</Label>
                <p className="mt-1 text-sm text-foreground">
                  {data.reason_free || data.reason_label}
                </p>
              </div>
              {data.estimated_ready_on && (
                <div>
                  <Label>Délai indicatif</Label>
                  <p className="mt-1 text-sm text-foreground">
                    Vers le {formatDate(data.estimated_ready_on)} (environ{' '}
                    {data.indicative_days} jours)
                  </p>
                </div>
              )}
              {data.additional_info && (
                <div>
                  <Label>Précisions</Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {data.additional_info}
                  </p>
                </div>
              )}
            </Card>

            {data.status === 'info_requested' && (
              <form
                onSubmit={handleSupplementSubmit}
                className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Complément demandé
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Le secrétariat a besoin de précisions pour traiter votre
                    demande (voir l’historique ci-dessous).
                  </p>
                </div>
                <textarea
                  aria-label="Précisions"
                  value={supplement}
                  onChange={(e) => setSupplement(e.target.value)}
                  rows={4}
                  placeholder="Apportez les précisions demandées…"
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFile}
                    aria-label="Joindre un fichier"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isUploading}
                    onClick={() => inputRef.current?.click()}
                    icon={<Paperclip className="size-4" />}
                  >
                    {fileName
                      ? 'Remplacer la pièce jointe'
                      : 'Joindre un fichier'}
                  </Button>
                  {fileName && (
                    <span className="truncate text-xs text-muted-foreground">
                      {fileName}
                    </span>
                  )}
                </div>
                {fileError && (
                  <p role="alert" className="text-xs text-destructive">
                    {fileError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={
                    (!supplement.trim() && fileId == null) || isUploading
                  }
                  icon={<Send className="size-4" />}
                >
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer le complément'}
                </Button>
              </form>
            )}

            {data.history.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Historique
                </h2>
                <StatusTimeline
                  steps={data.history.map((log, idx, arr): TimelineStep => {
                    const cfg = isKnownStatus(log.to_status)
                      ? DOCUMENT_STATUS_CONFIG[log.to_status]
                      : { label: log.to_status, tone: 'neutral' as const };
                    return {
                      label: cfg.label,
                      tone: cfg.tone,
                      state: idx === arr.length - 1 ? 'current' : 'done',
                      timestamp: log.created_at
                        ? formatDateTime(log.created_at)
                        : undefined,
                      description: log.comment || undefined,
                    };
                  })}
                />
              </div>
            )}

            {data.can_cancel && (
              <div className="flex flex-wrap gap-2">
                {confirmCancel ? (
                  <>
                    <Button
                      variant="destructive"
                      isLoading={isCancelling}
                      onClick={() =>
                        cancel(undefined, {
                          onSuccess: () => setConfirmCancel(false),
                        })
                      }
                    >
                      Confirmer l’annulation
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmCancel(false)}
                    >
                      Garder ma demande
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Annuler la demande
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
