# ==============================================================================
# JanguBiUI — Frontend Next.js
# Raccourcis dev (yarn) + CI locale (act), calqués sur le Makefile backend.
# Toutes les commandes se lancent depuis ce dossier (JanguBiUI/).
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help install dev build start lint lint-fix format check-types test test-watch \
        generate-api ci-list ci act ci-docker ci-docker-act hooks

help: ## Affiche cette aide
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# DEV (yarn) — le projet utilise yarn, pas npm
# ==============================================================================
install: ## Installe les dépendances (lockfile figé)
	yarn install --frozen-lockfile

dev: ## Serveur de développement (port 3000)
	yarn dev

build: ## Build de production (doit être clean : 0 erreur TS)
	yarn build

start: ## Démarre le build de production
	yarn start

lint: ## ESLint (eslint src)
	yarn lint

lint-fix: ## ESLint --fix
	yarn lint:fix

format: ## Prettier --write
	yarn format

check-types: ## tsc --noEmit
	yarn check-types

test: ## Vitest (run unique, comme en CI)
	yarn test --run

test-watch: ## Vitest en mode watch
	yarn test

generate-api: ## Régénère les types depuis le schéma OpenAPI backend (django sur :8001)
	yarn generate-api

# ==============================================================================
# CI LOCALE (act) — reproduit .github/workflows/nextjs.yml en local
# ==============================================================================
# Image runner act (catthehacker ≈ runner ubuntu de GitHub).
ACT_RUNNER := ubuntu-24.04=catthehacker/ubuntu:act-24.04

# Build-args du Dockerfile (Next.js les intègre AU BUILD). Surchargeables :
#   make ci-docker NEXT_PUBLIC_API_URL=https://api-jangubi.kamalfils.app/api
NEXT_PUBLIC_API_URL    ?=
NEXT_PUBLIC_SENTRY_DSN ?=
SENTRY_AUTH_TOKEN      ?=

# Liste les jobs du workflow sans rien exécuter (colonnes Job ID / Workflow / Events).
ci-list: ## Liste les jobs du workflow (act --list)
	act --list

# Lance le job qualité en local (install + eslint + tsc + build), comme la CI.
# NB : nextjs.yml filtre push sur main/develop/stage → lancer depuis une de ces
# branches (sinon le job peut être ignoré par le filtre de branche d'act).
ci: ## Lance le job lint-and-typecheck via act (push)
	act push -P $(ACT_RUNNER) --rm --job lint-and-typecheck

# Alias pratique.
act: ci

hooks: ## Installe le hook pre-push (make act vers develop/stage/main)
	git config core.hooksPath scripts/git-hooks
	chmod +x scripts/git-hooks/pre-push

# Valide EN LOCAL le build de l'image de production (dernier stage = runner).
# NE POUSSE PAS — pour débugger le Dockerfile avant un tag/push.
ci-docker: ## Build local de l'image frontend (jangubi-frontend:local, sans push)
	docker build -f Dockerfile \
		--build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		--build-arg NEXT_PUBLIC_SENTRY_DSN=$(NEXT_PUBLIC_SENTRY_DSN) \
		--build-arg SENTRY_AUTH_TOKEN=$(SENTRY_AUTH_TOKEN) \
		-t jangubi-frontend:local .

# Lance le job build-docker via act (build + push DockerHub). Nécessite un fichier
# `.secrets` (git-ignoré) avec : DOCKERHUB_USERNAME, DOCKERHUB_TOKEN,
# NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN.
# ⚠️ pousse réellement l'image sur DockerHub.
ci-docker-act: ## Lance le job build-docker via act (build + push, requiert .secrets)
	act push -P $(ACT_RUNNER) --rm --job build-docker --secret-file .secrets
