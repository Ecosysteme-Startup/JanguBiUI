import { useMutation } from '@tanstack/react-query';

import { api, saveBlob } from '@/lib/api-client';

/** Reçu simple (PDF) d'un don confirmé ; ce n'est jamais un reçu fiscal. */
export const downloadReceipt = async ({ donationId, receiptNumber }: { donationId: string; receiptNumber?: string | null }) => {
  const blob = await api.blob(`/me/dons/${encodeURIComponent(donationId)}/recu/`);
  saveBlob(blob, `recu-${receiptNumber ?? donationId}.pdf`);
};

export const useDownloadReceipt = () => useMutation({ mutationFn: downloadReceipt });
