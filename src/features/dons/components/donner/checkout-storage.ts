import type { Checkout } from '../../types/schemas';

/**
 * Passage du formulaire à l'écran de redirection : la réponse du serveur (URL de la page de
 * l'agrégateur, montants, référence) est gardée en `sessionStorage` sous `jb-dons-checkout-<id>`.
 *
 * Pourquoi pas l'URL : une adresse `…/redirection?don=…&url=…` permettrait à n'importe qui de
 * fabriquer un lien Jàngu Bi qui renvoie vers une page de paiement contrefaite (redirection
 * ouverte). Le stockage de session est propre à l'onglet et à l'origine, vidé à la fermeture, et
 * ne contient **aucune donnée de paiement** : seulement ce que le serveur a renvoyé au checkout.
 */
export type StoredCheckout = Pick<
  Checkout,
  | 'donation_id'
  | 'reference'
  | 'checkout_url'
  | 'amount'
  | 'fee_amount'
  | 'charged_amount'
  | 'net_amount'
> & {
  fund_id: string;
  fund_title: string;
  parish_name: string;
  /** Parcours sans compte : code de la paroisse, pour « Réessayer ». */
  parish_code?: string;
};

export const checkoutStorageKey = (donationId: string) =>
  `jb-dons-checkout-${donationId}`;

export const saveCheckout = (checkout: StoredCheckout) => {
  try {
    window.sessionStorage.setItem(
      checkoutStorageKey(checkout.donation_id),
      JSON.stringify(checkout),
    );
  } catch {
    // Stockage indisponible (navigation privée stricte) : l'écran de redirection le signalera.
  }
};

export const readCheckout = (donationId: string): StoredCheckout | null => {
  try {
    const raw = window.sessionStorage.getItem(checkoutStorageKey(donationId));
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredCheckout;
    return value && value.donation_id === donationId ? value : null;
  } catch {
    return null;
  }
};

export const forgetCheckout = (donationId: string) => {
  try {
    window.sessionStorage.removeItem(checkoutStorageKey(donationId));
  } catch {
    // rien à faire
  }
};

/** Seule une page de paiement en HTTPS est ouverte (jamais `javascript:` ni une adresse en clair). */
export const isSafeCheckoutUrl = (
  url: string | undefined | null,
): url is string => {
  if (!url) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};
