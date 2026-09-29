/** Redirection vers la page de paiement de l'agrégateur (hors application). */
export const ouvrirPaiement = (url: string): void => {
  window.location.assign(url);
};
