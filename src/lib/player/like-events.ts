/**
 * Événement « j'aime » du lecteur global. Aimer une piste depuis le lecteur doit rafraîchir la
 * bibliothèque (titres aimés) de la sonothèque, sans que le lecteur (couche partagée) connaisse la
 * requête React Query de la feature `sonotheque`. On passe donc par un petit émetteur : le lecteur
 * émet, la feature s'abonne et invalide sa propre requête.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** S'abonne aux changements de « j'aime » venant du lecteur. Renvoie une fonction de désabonnement. */
export const onTrackLikeChanged = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Signale qu'un « j'aime » a changé depuis le lecteur. */
export const emitTrackLikeChanged = (): void => {
  listeners.forEach((listener) => listener());
};
