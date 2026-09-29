'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';

export const MAX_JUSTIFICATIF_BYTES = 5 * 1024 * 1024;
export const MAX_JUSTIFICATIFS = 5;
const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/heic';
const ACCEPTED_TYPES = new Set(ACCEPT.split(','));
const ACCEPTED_EXTENSIONS = /\.(pdf|jpe?g|png|webp|heic)$/i;

export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

type JustificatifsPickerProps = {
  id: string;
  files: File[];
  /** Nombre de justificatifs que l'on peut encore joindre (5 au total, déjà joints compris). */
  remaining: number;
  onChange: (files: File[]) => void;
};

/** Justificatifs à joindre (celebret, lettre d'obédience…) : PDF ou photo, 5 Mo au plus chacun. */
export const JustificatifsPicker = ({ id, files, remaining, onChange }: JustificatifsPickerProps) => {
  const [error, setError] = useState<string | null>(null);
  const full = files.length >= remaining;

  const add = (picked: File[]) => {
    const refused = picked.find((f) => !ACCEPTED_TYPES.has(f.type) && !ACCEPTED_EXTENSIONS.test(f.name));
    if (refused) return setError(`« ${refused.name} » n’est ni un PDF ni une image.`);
    const tooBig = picked.find((f) => f.size > MAX_JUSTIFICATIF_BYTES);
    if (tooBig) return setError(`« ${tooBig.name} » dépasse 5 Mo.`);
    if (files.length + picked.length > remaining) return setError(`Vous pouvez encore joindre ${remaining} justificatif(s).`);
    setError(null);
    onChange([...files, ...picked]);
  };

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <ul aria-label="Justificatifs à envoyer" className="m-0 flex list-none flex-col gap-2 p-0">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-12 border border-line bg-surface px-4 py-2">
              <Icon name="document" size={20} className="shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 truncate text-14 text-ink">{file.name}</span>
              <span className="tnum text-13 text-ink-3">{fileSize(file.size)}</span>
              <IconButton icon="x" size="sm" label={`Retirer ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))} />
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-line-field bg-surface px-4 py-4 hover:border-line-active"
        >
          <Icon name="import" size={22} className="shrink-0 text-primary" />
          <span>
            <span className="block text-15 text-ink">
              Joindre un justificatif ou <span className="text-primary underline">parcourir</span>
            </span>
            <span className="block text-14 text-ink-3">Celebret, lettre d’obédience… · PDF ou photo · 5 Mo au plus</span>
          </span>
        </label>
      )}
      <input
        id={id}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={full}
        className="sr-only"
        aria-label="Justificatif"
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (picked.length) add(picked);
        }}
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="m-0 text-14 text-err">
          {error}
        </p>
      )}
    </div>
  );
};
