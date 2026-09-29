import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { DEMO_ACCOUNTS } from '@/features/auth/utils/demo-accounts';
import type { CapaciteMe, Me } from '@/lib/auth';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from './dons-analyse';

// Keycloak simulé (point de jeton du realm) et personne connectée (/v1/me/,
// /v1/me/capacites/) calqués sur les vraies réponses du backend V1.
//
// Jetons de démonstration : `demo.<e-mail en base64url>.<n>`. Le code
// d'autorisation du mode mocks est `demo:<e-mail>` (voir lib/oidc.ts).

const b64 = (s: string) =>
  btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64 = (s: string) =>
  decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

let emission = 0;
const jetons = (email: string) => {
  emission += 1;
  return {
    access_token: `demo.${b64(email)}.${emission}`,
    expires_in: 600,
    refresh_token: `demo-refresh.${b64(email)}.${emission}`,
    refresh_expires_in: 43200,
    id_token: `e30.${b64(JSON.stringify({ email }))}.`,
    token_type: 'Bearer',
    scope: 'openid profile email',
  };
};

/** E-mail du compte de démonstration porté par le jeton Bearer, s'il y en a. */
const emailDuJeton = (request: Request): string | null => {
  const auth = request.headers.get('authorization') ?? '';
  const m = /^Bearer demo\.([^.]+)\./.exec(auth);
  if (!m) return null;
  try {
    return unb64(m[1]);
  } catch {
    return null;
  }
};

export const PAROISSE_SAINT_DOMINIQUE = {
  id: NOEUD_SAINT_DOMINIQUE,
  name: 'Saint-Dominique',
};

/** Réponse de GET /v1/me/ (MeOutputSerializer). */
export const meDemo = (overrides: Partial<Me> = {}): Me => ({
  id: '0c7b0000-0000-4000-8000-000000000001',
  email: 'marie-therese.diouf@example.sn',
  profile: {
    first_name: 'Marie-Thérèse',
    last_name: 'Diouf',
    title: 'MRS',
    date_of_birth: null,
    phone: '+221774123658',
  },
  etat_de_vie: 'laic',
  degre_ordre: 'aucun',
  statut_verification: 'declare',
  incardination: null,
  institut: null,
  paroisse_suivie: PAROISSE_SAINT_DOMINIQUE,
  consent: { version: '2026-09', accepted_at: '2026-09-01T10:00:00+00:00' },
  ...overrides,
});

const capacite = (
  code: string,
  office: string,
  office_label: string,
  node: 'paroisse' | 'diocese' | 'plateforme',
): CapaciteMe => ({
  capacite: code,
  node_id:
    node === 'paroisse'
      ? NOEUD_SAINT_DOMINIQUE
      : node === 'diocese'
        ? NOEUD_ARCHIDIOCESE
        : null,
  node_name:
    node === 'paroisse'
      ? 'Saint-Dominique'
      : node === 'diocese'
        ? 'Archidiocèse de Dakar'
        : 'Plateforme',
  node_type: node,
  herite: true,
  office,
  office_label,
});

export const CAPACITES_DEMO: Record<string, CapaciteMe[]> = {
  'marie-therese.diouf@example.sn': [],
  'cecile.coly@saint-dominique.sn': [
    'tableau_bord.voir',
    'dons.voir_fonds',
    'dons.saisir_quete',
    'dons.exporter',
  ].map((c) => capacite(c, 'econome_paroissial', 'Économe', 'paroisse')),
  // Curé (office `cure`) : toutes les capacités paroissiales.
  'emmanuel.tine@saint-dominique.sn': [
    'horaires.gerer',
    'offices.nommer',
    'annonces.publier',
    'evenements.gerer',
    'actes.traiter',
    'messagerie.recevoir_fideles',
    'confessions.gerer',
    'confessions.voir_planning',
    'tableau_bord.voir',
    'audit.voir',
    'dons.voir_fonds',
    'dons.gerer_fonds',
    'dons.saisir_quete',
    'dons.voir_donateurs',
    'dons.exporter',
    'audio.publier',
    'paroissiens.gerer',
    'intentions.gerer',
  ].map((c) => capacite(c, 'cure', 'Curé', 'paroisse')),
  'germaine.faye@saint-dominique.sn': [
    'annonces.publier',
    'audio.publier',
    'dons.voir_fonds',
    // Liste des paroissiens, retrait et rétablissement (API-AUDIO §9).
    'paroissiens.gerer',
    // Intentions de messe (API-V1-COMPLEMENTS §4).
    'intentions.gerer',
  ].map((c) =>
    capacite(c, 'secretaire_paroissial', 'Secrétaire paroissiale', 'paroisse'),
  ),
  'bernard.coly@archidiocese-dakar.sn': [
    'tableau_bord.voir',
    'dons.voir_agregats',
  ].map((c) =>
    capacite(c, 'econome_diocesain', 'Économe diocésain', 'diocese'),
  ),
  'moustoifa.ben@numerisen.sn': [
    'plateforme.admin',
    'tableau_bord.voir',
    // Comptes du clergé (API-V1-COMPLEMENTS §1).
    'comptes.valider',
  ].map((c) =>
    capacite(c, 'plateforme', 'Administrateur plateforme', 'plateforme'),
  ),
};

const meDuCompte = (email: string): Me => {
  const index = DEMO_ACCOUNTS.findIndex((c) => c.email === email);
  const compte = DEMO_ACCOUNTS[index];
  if (!compte) return meDemo({ email });
  return meDemo({
    id: `0c7b0000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    email,
    profile: {
      first_name: compte.first_name,
      last_name: compte.last_name,
      // Le contrat n'a que MR / MRS (apps.users.enums.Title).
      title: compte.title === 'Mme' ? 'MRS' : 'MR',
      date_of_birth: null,
      phone: null,
    },
    ...(compte.title === 'Père'
      ? {
          etat_de_vie: 'clerc',
          degre_ordre: 'pretre',
          statut_verification: 'verifie',
        }
      : {}),
  });
};

let profilModifie: Partial<Me['profile']> = {};

export const authHandlers = [
  // --- Keycloak : point de jeton du realm (code PKCE, rafraîchissement) ---------
  http.post(
    '*/realms/:realm/protocol/openid-connect/token',
    async ({ request }) => {
      // Formulaire (navigateur, tests) ; objet JSON derrière le serveur de
      // mocks Express (@mswjs/http-middleware resérialise req.body).
      const texte = await request.text();
      const form = texte.trim().startsWith('{')
        ? new URLSearchParams(JSON.parse(texte) as Record<string, string>)
        : new URLSearchParams(texte);
      const grant = form.get('grant_type');
      const invalide = () =>
        HttpResponse.json(
          { error: 'invalid_grant', error_description: 'Session expirée' },
          { status: 400 },
        );
      if (form.get('client_id') !== env.KEYCLOAK_CLIENT_ID) {
        return HttpResponse.json({ error: 'invalid_client' }, { status: 401 });
      }
      if (grant === 'authorization_code') {
        const code = form.get('code') ?? '';
        if (!code.startsWith('demo:') || !form.get('code_verifier')) {
          return invalide();
        }
        return HttpResponse.json(
          jetons(code.slice(5) || DEMO_ACCOUNTS[0].email),
        );
      }
      if (grant === 'refresh_token') {
        const refresh = form.get('refresh_token') ?? '';
        if (!refresh || refresh === 'expired') return invalide();
        const m = /^demo-refresh\.([^.]+)\./.exec(refresh);
        if (m) return HttpResponse.json(jetons(unb64(m[1])));
        // Jeton de rafraîchissement des tests : jeton d'accès neutre.
        return HttpResponse.json({
          ...jetons(''),
          access_token: 'refreshed-access-token',
        });
      }
      return HttpResponse.json(
        { error: 'unsupported_grant_type' },
        { status: 400 },
      );
    },
  ),

  // --- Personne connectée --------------------------------------------------------
  http.get(`${env.API_URL}/v1/me/`, ({ request }) => {
    const email = emailDuJeton(request);
    const me = email ? meDuCompte(email) : meDemo();
    return HttpResponse.json({
      ...me,
      profile: { ...me.profile, ...profilModifie },
    });
  }),

  http.patch(`${env.API_URL}/v1/me/`, async ({ request }) => {
    const body = (await request.json()) as Partial<Me['profile']>;
    profilModifie = { ...profilModifie, ...body };
    const me = meDemo();
    return HttpResponse.json({
      ...me,
      profile: { ...me.profile, ...profilModifie },
    });
  }),

  http.delete(`${env.API_URL}/v1/me/`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Capacités du compte de démonstration connecté ; sans jeton de
  // démonstration (tests) : aucune, comme un fidèle.
  http.get(`${env.API_URL}/v1/me/capacites/`, ({ request }) => {
    const email = emailDuJeton(request);
    return HttpResponse.json(email ? (CAPACITES_DEMO[email] ?? []) : []);
  }),
];
