'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { apiErrorMessage } from '@/utils/api-errors';

import { COVER_TYPES, useUploadCover } from '../api/upload-cover';

export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export type CoverValue = { id: number | null; url: string | null };

type CoverPickerProps = {
  id: string;
  value: CoverValue;
  onChange: (value: CoverValue) => void;
  /** Erreur renvoyée par le serveur à l'enregistrement (fichier refusé). */
  error?: string;
};

/**
 * Bannière de l'annonce (PAR-Annonce-Editeur §03) : image téléversée tout de suite
 * (`/files/upload/standard/`), attachée à l'enregistrement. L'aperçu local précède l'URL serveur.
 */
export const CoverPicker = ({ id, value, onChange, error }: CoverPickerProps) => {
  const upload = useUploadCover();
  const [localError, setLocalError] = useState<string | null>(null);
  const message = localError ?? error ?? (upload.isError ? apiErrorMessage(upload.error) : null);

  const pick = async (file: File | null) => {
    if (!file) return;
    if (!(COVER_TYPES as readonly string[]).includes(file.type)) {
      setLocalError('Choisissez une image JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setLocalError('L’image dépasse 5 Mo.');
      return;
    }
    setLocalError(null);
    try {
      const fileId = await upload.mutateAsync(file);
      onChange({ id: fileId, url: URL.createObjectURL(file) });
    } catch {
      // Message affiché via upload.error.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {value.id !== null ? (
        <figure className="m-0">
          {/* URL signée du stockage (MinIO/S3) ou aperçu local : balise img simple. */}
          {value.url && <img src={value.url} alt="Bannière de l’annonce" className="aspect-[4/1] w-full border border-line object-cover" />}
          <figcaption className="mt-2 flex flex-wrap items-center gap-3">
            <label htmlFor={id} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded border border-line-field px-3 text-sm text-ink hover:border-ink">
              <Icon name="import" size={16} /> Remplacer
            </label>
            <Button variant="tertiary" size="sm" onClick={() => onChange({ id: null, url: null })}>
              Retirer la bannière
            </Button>
          </figcaption>
        </figure>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-line-field bg-surface px-4 py-4 hover:border-ink"
        >
          <Icon name="import" size={22} className="shrink-0 text-primary" />
          <span>
            <span className="block text-base text-ink">
              {upload.isPending ? 'Envoi de l’image…' : 'Ajouter une bannière'}
            </span>
            <span className="block text-sm text-ink-3">Format 4:1 · 1 600 × 400 px minimum · JPEG, PNG ou WebP · 5 Mo au plus</span>
          </span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={COVER_TYPES.join(',')}
        className="sr-only"
        aria-label="Image de bannière"
        aria-describedby={message ? `${id}-err` : undefined}
        disabled={upload.isPending}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          e.target.value = '';
          void pick(picked);
        }}
      />
      {message && (
        <p id={`${id}-err`} role="alert" className="m-0 text-sm text-err">
          {message}
        </p>
      )}
    </div>
  );
};
