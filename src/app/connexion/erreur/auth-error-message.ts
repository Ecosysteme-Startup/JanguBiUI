/**
 * Messages de la page d'erreur de connexion, selon le code transmis par Auth.js (`?error=`).
 * Auth.js ne transmet tel quel qu'un petit nombre de codes « sûrs » ; toute autre erreur
 * (dont `InvalidCheck: state`, cookie de 15 min expiré) arrive sous le code `Configuration`.
 */
export type AuthErrorMessage = { title: string; body: string };

const MESSAGES: Record<string, AuthErrorMessage> = {
  Configuration: {
    title: 'Votre connexion a expiré.',
    body: 'La page de connexion est restée ouverte trop longtemps, ou la connexion a été interrompue — par exemple si vous venez de confirmer votre adresse e-mail dans un autre onglet. Si c’est le cas, votre compte est bien créé : recommencez la connexion, cela ne prend que quelques secondes.',
  },
  AccessDenied: {
    title: 'La connexion a été refusée.',
    body: 'Votre compte n’a pas pu être ouvert sur Jàngu Bi. Si le problème persiste, le secrétariat de votre paroisse peut vous aider.',
  },
  Verification: {
    title: 'Ce lien n’est plus valable.',
    body: 'Le lien de connexion a expiré ou a déjà servi. Recommencez la connexion pour en obtenir un nouveau.',
  },
};

const DEFAULT_MESSAGE: AuthErrorMessage = {
  title: 'La connexion n’a pas abouti.',
  body: 'Un incident a interrompu la connexion. Recommencez ; si le problème persiste, réessayez un peu plus tard.',
};

export const authErrorMessage = (code?: string | null): AuthErrorMessage =>
  (code && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : undefined) ?? DEFAULT_MESSAGE;
