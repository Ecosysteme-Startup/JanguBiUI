# JanguBiUI — Git flow et CI locale (`act`)

> **Règle d'or : aucun push ni PR vers `develop`, `stage` ou `main` sans `make act` vert en local.**
> Un push raté consomme des minutes GitHub Actions pour rien. Seul un push sur `stage` livre en recette (`livraison-recette.yml` → `Ecosysteme-Startup/Infrastructure`) ; `develop` et `main` ne lancent que la qualité.
> Branches, conventions de commit et règles de merge : identiques au backend (`../../JanguBi/docs/v1/04-CI-LOCALE-ET-GIT.md` §1).

## 1. Jobs de `.github/workflows/nextjs.yml`

| Job | Contenu | Avec `act` ? |
|---|---|---|
| `lint-and-typecheck` | `yarn install --frozen-lockfile`, `yarn lint`, `yarn check-types`, **`yarn test --run` (à ajouter en F0)**, `yarn build` | **Oui, toujours** : c'est le gate |

Livraison en recette : `.github/workflows/livraison-recette.yml` (push `stage`, runner `ceac`), **jamais via `act`** ; pour tester le Dockerfile : `make ci-docker` (build local, sans push). L'ancien déploiement `trigger-deploy` vers `Kamal-Fils/infrastructure` est supprimé (30/09/2026).

## 2. Commandes

```bash
make ci-list        # jobs vus par act
make act            # act push --job lint-and-typecheck (lint + types + tests + build)
make ci-docker      # build local de l'image de prod, sans push
make hooks          # installe le hook pre-push (make act vers develop/stage/main)
```

- `.actrc` (versionné) : `-P ubuntu-24.04=catthehacker/ubuntu:act-24.04`, `--pull=false`, `--rm`.
- `.secrets` (non versionné) contient `NEXT_PUBLIC_API_URL` et, facultativement, `NEXT_PUBLIC_SENTRY_DSN` pour le `yarn build` du job. `.secrets.example` est versionné. **Aucun jeton DockerHub** n'est nécessaire pour le gate.
- Commande complète avec secrets : `act push --job lint-and-typecheck --secret-file .secrets`.
- Le filtre de branches du workflow s'applique aussi à `act push` : lancez-le depuis une branche `develop`, `stage` ou `main` locale, ou simulez l'événement PR : `act pull_request --job lint-and-typecheck`.

**Plan B** (pas de Docker, ou pas de réseau dans le conteneur `act`) : `yarn lint && yarn check-types && yarn test --run && yarn build`. Les quatre doivent être verts, et la PR le mentionne (« gate local : plan B »).

## 3. Modifications du workflow (lot F0.5)

```yaml
on:
  push:
    branches: [main, develop, stage]
    tags: ['v*']
    paths-ignore: ['docs/**', '**/*.md']
  pull_request:
    branches: [main, develop, stage]
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore: ['docs/**', '**/*.md']

jobs:
  lint-and-typecheck:
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    steps:
      # … après « TypeScript check »
      - name: Tests unitaires
        run: yarn test --run
```

## 4. Hook `pre-push`

Même script que le backend (`scripts/git-hooks/pre-push`), qui appelle `make act` si la branche distante est `develop`, `stage` ou `main`.

## 5. Checklist avant chaque PR

- [ ] `make act` vert (ou plan B complet, mentionné)
- [ ] `make ci-docker` vert si `Dockerfile`, `next.config.mjs`, `package.json` ou les variables d'environnement ont changé
- [ ] `yarn generate-api` relancé si le contrat backend a changé
- [ ] Captures de l'écran à côté de sa maquette (clair et sombre) dans la PR
- [ ] Storybook à jour pour les composants touchés
