import { getAccessToken } from '@/lib/api-client';

import type { UploadInit } from '../types/schemas';

export type UploadProgress = { loaded: number; total: number };

export class StorageUploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'StorageUploadError';
  }
}

export type StorageUploader = (
  presign: Pick<UploadInit, 'url' | 'fields' | 'method'>,
  file: File,
  onProgress: (p: UploadProgress) => void,
  signal?: AbortSignal,
) => Promise<void>;

/**
 * 2. Téléversement direct vers le stockage (S3/R2/MinIO) par POST présigné.
 * XHR plutôt que fetch : seul XHR expose la progression de l'envoi. Le
 * formulaire contient tous les `fields` puis `file` en dernier (exigence S3).
 * En développement (stockage local), l'URL est celle de l'API et `fields` est
 * vide : on joint alors le jeton.
 */
export const uploadToStorage: StorageUploader = (
  presign,
  file,
  onProgress,
  signal,
) =>
  new Promise<void>((resolve, reject) => {
    const form = new FormData();
    Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open(presign.method || 'POST', presign.url);
    const isLocal = Object.keys(presign.fields).length === 0;
    const token = getAccessToken();
    if (isLocal && token)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress({ loaded: e.loaded, total: e.total });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({ loaded: file.size, total: file.size });
        resolve();
      } else {
        reject(
          new StorageUploadError(
            xhr.status === 403
              ? 'L’autorisation d’envoi a expiré. Réessayez pour en obtenir une nouvelle.'
              : `Le stockage a refusé le fichier (erreur ${xhr.status}).`,
            xhr.status,
          ),
        );
      }
    };
    xhr.onerror = () =>
      reject(
        new StorageUploadError(
          'La connexion a été interrompue pendant l’envoi.',
          0,
        ),
      );
    xhr.onabort = () => reject(new StorageUploadError('Envoi annulé.', 0));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
