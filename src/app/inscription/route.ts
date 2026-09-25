import { signIn } from '@/lib/auth';

/** `/inscription` : ouvre directement le formulaire d'inscription Keycloak (étape 1 sur 3), puis `/bienvenue`. */
export const GET = async () => signIn('keycloak', { redirectTo: '/bienvenue' }, { prompt: 'create' });
