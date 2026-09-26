# Harnais de comparaison visuelle (maquettes « Ciel produit »)

Capture un écran de l'app (1440 × 900, pleine page) **en clair et en sombre**, le pose à côté de la
capture de référence de la maquette (`docs/v1/maquettes-ciel/captures/<maquette>.png` et
`Sombre-<maquette>.png`) et calcule une carte des différences.

## Prérequis

- Pile locale lancée : front `http://localhost:3000` (`yarn dev`, **ne pas le relancer**), API :8001, Keycloak :8180.
- Mot de passe des comptes de démo dans l'environnement, **jamais dans un fichier versionné** :
  `export KC_DEMO_PASSWORD=…` (valeur : clé `KC_DEMO_PASSWORD` de `../JanguBi/.env`).
- Les secrets TOTP des comptes staff sont partagés par `e2e/stack/helpers/totp.ts` (enrôlement automatique).

## Lancer

```bash
# Écrans du registre (e2e/visuel/ecrans.ts), filtrés par nom de maquette (sous-chaîne, virgules)
KC_DEMO_PASSWORD=… npx tsx e2e/visuel/capture.ts WEB-FID-Parole,WEB-PAR-Tableau-de-bord,WEB-Erreur-404

# Écran ad hoc (route + compte + maquette), un seul thème
KC_DEMO_PASSWORD=… npx tsx e2e/visuel/capture.ts --route /app/demandes/12 --compte fidele --maquette WEB-FID-Demande-Suivi --theme sombre

# Même chose via Playwright (un test par écran, un seul worker)
KC_DEMO_PASSWORD=… VISUEL_ECRANS=WEB-FID npx playwright test -c e2e/visuel/playwright.visuel.config.ts
KC_DEMO_PASSWORD=… VISUEL_ROUTE=/app/profil VISUEL_COMPTE=fidele VISUEL_MAQUETTE=WEB-FID-Profil npx playwright test -c e2e/visuel/playwright.visuel.config.ts
```

Comptes (`--compte`) : `public`, `fidele`, `cure`, `admin_paroissial`, `chancelier`, `plateforme`
(tous `@demo.jangubi.sn`).

Trous de route : `{node}` = premier espace du compte (redirection de `/espace`) ; les autres
(`{demande}`, `{annonce}`, `{conversation}`…) sont résolus depuis une page de liste (voir `trous` dans
`ecrans.ts`) ou forcés par variable : `VISUEL_NODE=…`, `VISUEL_DEMANDE=…`.

## Résultats (non versionnés)

`e2e/visuel/resultats/<maquette>/` :

| Fichier | Contenu |
|---|---|
| `app-clair.png`, `app-sombre.png` | l'app, pleine page |
| `maquette-clair.png`, `maquette-sombre.png` | copies des captures de référence |
| `comparaison-clair.png`, `comparaison-sombre.png` | planche App · Maquette · Différences (pixels en rouge), taux en titre |
| `rapport.json` | route, compte, chemins, taux de différence par thème |

Le taux n'est qu'un indicateur (les données de démo diffèrent des textes de maquette) : **regarder la
planche** (outil Read sur le PNG) et corriger composition, tailles, couleurs, rayons et espacements.

## Règles

- Connexions : un verrou par compte (`e2e/visuel/.auth/<compte>.lock`) évite deux connexions TOTP
  simultanées ; la session (`.auth/<compte>.json`, 20 min) est réutilisée. Ne jamais lancer deux
  harnais en parallèle sur le même compte hors de ce verrou (Keycloak bloque après 3 échecs).
- Le thème est forcé par `localStorage.theme` (next-themes) + `prefers-color-scheme` émulé.
- Ajouter ses écrans au registre `ecrans.ts` plutôt que d'écrire un script par lot.
