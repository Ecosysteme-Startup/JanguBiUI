import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const EXPORT_FILENAME = 'jangubi-mes-donnees.json';

/** Export de mes données personnelles (JSON, 5 par heure) ; le fichier est construit dans le navigateur. */
export const exportMyData = async (): Promise<Blob> => {
  const data = await api.get<unknown>('/me/export/');
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
};

const download = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const useExportMyData = ({ onDownload = download }: { onDownload?: (blob: Blob) => void } = {}) =>
  useMutation({ mutationFn: exportMyData, onSuccess: onDownload });
