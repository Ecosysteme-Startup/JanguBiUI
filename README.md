# Jàngu Bi — web (Next.js)

## Démarrer

Prérequis : Node 20+, Yarn 1.22+.

```bash
cp .env.example .env
yarn install
yarn dev            # http://localhost:3000
```

## Variables

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API Django (les appels sont en `/v1/...`) | `http://localhost:8001/api` |
| `NEXT_PUBLIC_URL` | Origine du site (rappel OIDC, retour après déconnexion) | `http://localhost:3000` |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Serveur Keycloak | `http://localhost:8180` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Realm | `jangubi` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Client public OIDC | `jangubi-web` |
| `NEXT_PUBLIC_API_MOCKING` | Mode mocks (dev, tests) ; ignoré en production | `false` |
| `NEXT_PUBLIC_WS_URL` | WebSocket (sinon déduite de l'API) | — |

## Authentification (Keycloak)

Keycloak est la seule authentification de l'API : chaque appel porte
`Authorization: Bearer <jeton d'accès Keycloak>`, l'API valide le jeton (JWKS,
`aud=jangubi-api`, `azp=jangubi-web`) et provisionne la personne.

- **Connexion** : `/auth/login` prépare une demande Authorization Code + PKCE
  (S256, `state`, `nonce`) et envoie le navigateur sur la page Keycloak (thème
  Jàngu Bi). **Inscription** : `/auth/register`, même flux avec `prompt=create`.
  Mot de passe oublié, vérification et changement d'e-mail : pages Keycloak.
- **Rappel** : `/auth/callback` vérifie `state`, échange le code (avec le
  vérificateur PKCE) au point de jeton, lit `/v1/me/` puis revient à la page
  demandée.
- **Jetons** : accès (10 min) en mémoire ; rafraîchissement et `id_token` dans
  le `sessionStorage` de l'onglet. Rafraîchissement silencieux une minute avant
  l'échéance, et sur tout 401 (puis relance de la requête). Échec : retour à la
  connexion (la session SSO Keycloak évite la saisie).
- **Déconnexion** : `end_session_endpoint` avec `id_token_hint`, retour sur `/`.
- **Personne et droits** : `useUser()` lit `GET /v1/me/` et
  `GET /v1/me/capacites/` ; les gardes lisent les capacités (`dons.voir_fonds`,
  `dons.voir_agregats`, `audio.publier`, `plateforme.admin`…). Temps réel :
  ticket `POST /v1/me/ws-ticket/` ; flux SSE des dons avec l'en-tête Bearer.
- **Profil** : `PATCH /v1/me/` ; mot de passe et double authentification dans
  la console de compte Keycloak.

Côté Keycloak, le client `jangubi-web` doit accepter la redirection
`${NEXT_PUBLIC_URL}/auth/callback` et l'origine web `${NEXT_PUBLIC_URL}`.

## Mode mocks

```bash
yarn run-mock-server   # http://localhost:8080 (handlers MSW de src/testing/mocks)
NEXT_PUBLIC_API_MOCKING=true NEXT_PUBLIC_API_URL=http://localhost:8080/api \
  NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080 yarn dev
```

La page de connexion propose alors des comptes de démonstration (fidèle,
économe, secrétaire paroissiale, économe diocésain, administrateur plateforme) ;
le serveur de mocks simule le point de jeton Keycloak et renvoie `/v1/me/` et
`/v1/me/capacites/` au format du backend. Les tests Vitest utilisent les mêmes
handlers.

## Vérifications

```bash
yarn lint && yarn check-types && yarn test --run
```
