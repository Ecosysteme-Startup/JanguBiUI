# syntax=docker/dockerfile:1
# =================================================================
# STAGE 1 : deps
# Installe UNIQUEMENT les dépendances de production
# Ce stage sera jeté après — on garde juste node_modules
# =================================================================
FROM node:22-alpine AS deps

# Pourquoi alpine ?
# → Image Linux ultra-légère (~5MB vs ~200MB pour node:22)
# → Moins de surface d'attaque en sécurité
WORKDIR /app

# Copier SEULEMENT les fichiers de dépendances
# Pas tout le code — si le code change mais pas package.json,
# Docker réutilise le cache de ce layer (plus rapide)
COPY package.json yarn.lock ./

# --frozen-lockfile = échoue si yarn.lock ne correspond pas à package.json
# Garantit des versions exactes et reproductibles
RUN yarn install --frozen-lockfile

# =================================================================
# STAGE 2 : builder
# Compile le code TypeScript + optimise pour la production
# Ce stage sera aussi jeté — on garde juste le résultat du build
# =================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Récupérer node_modules du stage précédent
COPY --from=deps /app/node_modules ./node_modules

# Copier tout le code source maintenant
COPY . .

# Désactiver la télémétrie Next.js (données envoyées à Vercel)
ENV NEXT_TELEMETRY_DISABLED=1

# Variables nécessaires au BUILD (pas seulement au runtime)
# NEXT_PUBLIC_* sont intégrées dans le bundle JS au moment du build
# → d'où DEUX images par commit en livraison : sha-<commit>-staging et
#   sha-<commit>-prod (contrat Infrastructure §6). Aucune n'est un secret.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_KEYCLOAK_CONSOLE_URL
ARG NEXT_PUBLIC_FEATURES
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_KEYCLOAK_CONSOLE_URL=$NEXT_PUBLIC_KEYCLOAK_CONSOLE_URL \
    NEXT_PUBLIC_FEATURES=$NEXT_PUBLIC_FEATURES \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
# La connexion Keycloak (Auth.js) se règle À L'EXÉCUTION, pas au build :
# AUTH_SECRET, AUTH_URL, AUTH_KEYCLOAK_ID, AUTH_KEYCLOAK_ISSUER
# (et AUTH_KEYCLOAK_INTERNAL_ISSUER) sont fournis au conteneur par l'Infrastructure.

# Le build Next.js :
# → Compile TypeScript
# → Optimise les images, CSS, JS
# → Génère le dossier .next/standalone (grâce à output: 'standalone')
# SENTRY_AUTH_TOKEN (envoi des source maps) arrive par un SECRET BuildKit
# (`--secret id=sentry_auth_token`), jamais par ARG/ENV : il ne reste ainsi
# dans aucune couche ni dans l'historique de l'image. Absent → pas d'envoi.
RUN --mount=type=secret,id=sentry_auth_token \
    if [ -s /run/secrets/sentry_auth_token ]; then \
      export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
    fi; \
    yarn build

# =================================================================
# STAGE 3 : runner
# Image finale ultra-légère qui tourne en production
# Contient SEULEMENT ce qui est nécessaire pour faire tourner l'app
# =================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
# Ne jamais faire tourner une app en production en tant que root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier uniquement les fichiers nécessaires depuis le builder
# .next/standalone = le serveur Node.js minimal généré par Next.js
# .next/static     = les assets statiques (JS, CSS optimisés)
# public/          = images, fonts, fichiers publics

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static ./.next/static

# Basculer sur l'utilisateur non-root
USER nextjs

# Le port sur lequel Next.js écoute
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js = le mini-serveur Node.js généré par output: 'standalone'
# C'est lui qui remplace 'next start'
# Sonde : la page d'accueil répond (outil présent dans l'image : node, pas curl).
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]