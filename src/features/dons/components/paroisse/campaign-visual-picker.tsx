'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';

import { FUND_IMAGE_TYPES, MAX_FUND_IMAGE_BYTES, useUploadFundImage } from '../../api/upload-fund-image';

import { CampaignImage } from './campaign-art';

/** `changed` : le visuel a été déposé ou retiré dans cette session (sinon `image_id` n'est pas envoyé). */
export type VisualValue = { id: number | null; url: string | null; name?: string; size?: number; changed: boolean };

const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')}\u00a0Mo`;

/**
 * Visuel de la campagne (WEB-PAR-Campagne-Editeur, « Visuel ») : vignette + zone de dépôt.
 * L'image est téléversée tout de suite (`/files/upload/standard/`), puis attachée au fonds par `image_id`.
 */
export const CampaignVisualPicker = ({ value, onChange, error }: { value: VisualValue; onChange: (v: VisualValue) => void; error?: string }) => {
  const upload = useUploadFundImage();
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const message = localError ?? error ?? (upload.isError ? apiErrorMessage(upload.error) : null);
  const hasImage = value.id !== null || Boolean(value.url);

  const pick = async (file: File | null | undefined) => {
    if (!file) return;
    if (!(FUND_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setLocalError('Choisissez une image JPG ou PNG.');
      return;
    }
    if (file.size > MAX_FUND_IMAGE_BYTES) {
      setLocalError('L’image dépasse 5 Mo.');
      return;
    }
    setLocalError(null);
    try {
      const id = await upload.mutateAsync(file);
      const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
      onChange({ id, url, name: file.name, size: file.size, changed: true });
    } catch {
      // Message affiché via upload.error.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('grid gap-4', hasImage && 'sm:grid-cols-[200px_minmax(0,1fr)]')}>
        {hasImage && (
          <div className="flex flex-col gap-2">
            <CampaignImage url={value.url} className="h-28 w-full rounded-12" />
            <div className="flex items-center justify-between gap-2 text-13 text-ink-2">
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{value.name ?? 'Visuel actuel'}</span>
                {value.size !== undefined && <span className="tnum text-ink-3">{megabytes(value.size)}</span>}
              </span>
              <IconButton icon="corbeille" label="Retirer le visuel" size="sm" onClick={() => onChange({ id: null, url: null, changed: true })} />
            </div>
          </div>
        )}
        <label
          htmlFor="campagne-visuel"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-12 border-1.5 border-dashed border-line-field bg-surface p-4 text-center hover:border-primary',
            dragging && 'border-primary bg-tint-50',
          )}
        >
          <Icon name="export" size={22} className="text-primary" />
          <span className="text-15 font-semibold text-ink">
            {upload.isPending ? (
              'Envoi de l’image…'
            ) : (
              <>
                {hasImage ? 'Déposer une autre image' : 'Déposer une image'} ou <span className="text-primary">parcourir</span>
              </>
            )}
          </span>
          <span className="text-13 text-ink-3">JPG ou PNG, 5&nbsp;Mo au plus, format paysage de préférence</span>
        </label>
      </div>
      <input
        id="campagne-visuel"
        type="file"
        accept={FUND_IMAGE_TYPES.join(',')}
        className="sr-only"
        aria-label="Visuel de la campagne"
        aria-describedby={message ? 'campagne-visuel-erreur' : undefined}
        disabled={upload.isPending}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          e.target.value = '';
          void pick(picked);
        }}
      />
      {message && (
        <p id="campagne-visuel-erreur" role="alert" className="m-0 flex gap-1.5 text-13 text-err">
          <Icon name="erreur" size={14} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
};
