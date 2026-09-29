import { DONATION_SOURCES, type DonationSource } from '../types/schemas';

/**
 * Canal d'entrée d'un don (`source` du checkout). L'application mobile ouvre la page de don
 * avec `?src=app_ios|app_android`, un QR code avec `?src=qr` ; sinon le don vient du web.
 */
export const donationSource = (raw: string | null | undefined): DonationSource =>
  DONATION_SOURCES.find((s) => s === raw) ?? 'web';

/** Lieu de culte relayé par un QR code (`?lieu=`) : entier positif, sinon rien. */
export const donationPlaceId = (raw: string | null | undefined): number | null => {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
};
