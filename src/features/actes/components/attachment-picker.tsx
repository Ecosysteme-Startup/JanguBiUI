'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,application/pdf';

const size = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`);

/** Pièce justificative facultative du fidèle (carte de baptême, livret de famille chrétienne). */
export const AttachmentPicker = ({ id, file, onChange }: { id: string; file: File | null; onChange: (file: File | null) => void }) => {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 rounded-12 border border-line bg-surface px-4 py-2">
          <Icon name="document" size={20} className="shrink-0 text-ink-3" />
          <span className="min-w-0 flex-1 truncate text-14 text-ink">{file.name}</span>
          <span className="tnum text-13 text-ink-3">{size(file.size)}</span>
          <IconButton icon="x" size="sm" label={`Retirer le fichier ${file.name}`} onClick={() => onChange(null)} />
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-12 border border-dashed border-line-field bg-surface px-4 py-4 hover:border-primary has-[:focus-visible]:outline"
        >
          <Icon name="import" size={22} className="shrink-0 text-primary" />
          <span>
            <span className="block text-15 text-ink">
              Déposer un fichier ou <span className="text-primary underline">parcourir</span>
            </span>
            <span className="block text-13 text-ink-3">Carte de baptême, livret · photo ou scan · 5 Mo au plus</span>
          </span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Pièce justificative"
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          e.target.value = '';
          if (picked && picked.size > MAX_ATTACHMENT_BYTES) {
            setError('Le fichier dépasse 5 Mo.');
            return;
          }
          setError(null);
          onChange(picked);
        }}
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="m-0 mt-2 text-13 text-err">
          {error}
        </p>
      )}
    </div>
  );
};
