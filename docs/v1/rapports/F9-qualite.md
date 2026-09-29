# F9 — Qualité et recette (état au 25/09/2026)

## Vérifications automatiques

| Contrôle | Résultat |
|---|---|
| `yarn lint`, `yarn check-types` | 0 erreur |
| Vitest + Testing Library + MSW | 74 fichiers, 337 tests verts |
| **Audit axe après chaque test d'intégration** (`src/testing/setup-tests.ts`) | 0 violation WCAG 2.1 A/AA sur tous les états rendus (chargement, vide, erreur, succès) de tous les écrans. Contraste et régions exclus sous jsdom. |
| Playwright + `@axe-core/playwright`, desktop et mobile | 28 tests verts : fumée des shells, pages publiques, 404, toutes les pages publiques auditées avec le contraste réel |
| e2e `@keycloak` (connexion puis déconnexion globale) | Vert contre un Keycloak 26.3 local, hors CI (`E2E_KEYCLOAK=1`) |
| `yarn build` | Vert |

Défauts trouvés et corrigés par ces audits :
- `cn()` (tailwind-merge) prenait les tailles de la charte (`text-body`, `text-meta`…) pour des couleurs. Il effaçait `text-on-primary` sur tous les boutons `lg` (texte encre sur bleu, contraste 3:1). Corrigé dans `src/utils/cn.ts`, avec un test.
- Le texte AELF gardait les `<img>` (sans texte alternatif) : la liste blanche est limitée aux balises de texte.
- À l'état d'erreur, la page publique `/parole` n'avait pas de titre `h1`.

## Sécurité et données

- **Sentry** (`src/lib/sentry-scrub.ts`, trois runtimes) : aucun utilisateur, corps de requête, cookie ni en-tête. URL sans paramètres, identifiants masqués (`/app/demandes/:id`), e-mails et téléphones masqués, aucun fil d'Ariane console. Pas de Replay, traces à 20 %.
- **En-têtes** : `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, HSTS en production. CSP limitée à `frame-ancestors`, `base-uri`, `form-action 'self'` et `object-src`. La déconnexion Keycloak passe donc par `fetch` + navigation.
- **Session** : cookie httpOnly Auth.js. Aucun jeton dans `localStorage`, ce que vérifie l'e2e `@keycloak`.
- **Pages d'erreur** 404, 500 (`error.tsx`) et `global-error.tsx`, aux couleurs de la charte. Le 403 s'affiche dans les shells (« Cet espace ne vous est pas ouvert ») et sur chaque écran protégé par une capacité.

## Non fait dans ce lot

- **Lighthouse mobile et budget JS** : à mesurer sur l'environnement de staging (réseau et build de production réels).
- **Parcours dorés e2e de bout en bout** (inscription, demande d'acte, conversation, confession, annonce, traitement) : il faut la pile complète (Django + Keycloak + données). Chaque parcours est couvert en intégration (Vitest + MSW) ; l'e2e réel est à écrire au moment de la recette sur staging.
- **CSP complète avec nonce** (`script-src`) : chantier séparé, à valider sur l'application réelle.

## Écarts backend consolidés (remontés par les lots F4 → F8)

Corrigés dans le backend (develop local) : trames WebSocket `message.read`/`typing`, `last_message` typé avec `sender_id`, `MeNodeRef` pour `/me/`, `GET /public/nodes/by-code/{code}/`, `POST /public/contact/`, `platform/accounts*`.

Restants, par priorité :
1. **Recherche de personne** (`GET /hierarchy/persons/?q=`) : sans elle, une nomination unitaire se fait par identifiant de compte (PAR-Equipe, DIO-Nominations).
2. **Équipe en lecture** : `GET /hierarchy/assignments/` ne renvoie rien avec `tableau_bord.voir` seul.
3. **Actes (staff)** :
   - pièces jointes du fidèle absentes de `ProcessorOutput` ;
   - auteur (nom) des notes et de l'historique ;
   - pas d'endpoint d'assignation ;
   - pas de filtres « motif » ni « date de réception » dans la file.
4. **Vérifications du clergé** : `full_name`, date de déclaration, justificatifs, statut « complément demandé ».
5. **Audit** : `ip` et nom de l'acteur dans `AuditEventOutput`.
6. **Paramètres de paroisse** : `PATCH` du nœud exige `structure.gerer`, donc le secrétariat voit la page en lecture seule. Il manque aussi les champs téléphone, e-mail, accueil et délais d'actes.
7. **Annonces** :
   - pas de filtre `q` ni de filtre lieu ;
   - pas de bannière ni d'option de notification ;
   - pas de `place_id` en modification ;
   - pas d'export de la feuille d'annonces.
8. **Agenda** : filtre par dates dans `staff/agenda` ; inscription sans nombre de personnes ni remarque.
9. **Parole** :
   - la méditation demande un second appel à `/news/{id}/` ;
   - `bible/.../verses/` plafonne à 50 versets ;
   - le chapelet n'a pas de « fruit » du mystère et ses libellés arrivent en anglais.
10. **Public** : secrétariat et clergé d'une paroisse, `parent_name` et messes dominicales dans l'annuaire.
11. **Messagerie** : office du prêtre (curé, vicaire) dans `/messaging/priests/`.
12. **Accès audit** : un titulaire d'`audit.voir` sur un nœud, sans rôle plateforme, ne peut pas ouvrir `/plateforme/audit`. Il faut soit une route `/espace/[nodeId]/audit`, soit un shell plateforme ouvert à `audit.voir`.
13. **Téléphone à l'inscription** (maquette PUB-Inscription-Compte) : il faut un attribut de profil Keycloak et sa lecture côté backend. Aujourd'hui, le téléphone se saisit dans le profil.
