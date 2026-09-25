# JanguBiUI — Kit de démarrage du frontend V1

> Dossier : `JanguBiUI/docs/v1/` · Version du 24/09/2026 · Cible : Claude Code et l'équipe front.
> **Source de vérité de la V1 côté front.** Les anciens documents (`docs/redesign/`, `frontend_integration_guide.md.resolved`) sont archivés dans `docs/archive/`.

| # | Fichier | Contenu |
|---|---|---|
| 1 | `01-PLAN-FRONT-V1.md` | Plan de A à Z : 10 lots (F0 → F9), alignement sur les lots backend, estimations, critères de sortie |
| 2 | `02-SPEC-FRONT-V1.md` | Charte, **carte des routes ↔ maquettes ↔ API ↔ capacités**, architecture, composants signature, exigences non fonctionnelles |
| 3 | `03-DECISIONS-ADR-FRONT.md` | Décisions : Auth.js/Keycloak, capacités, thèmes, polices, contrat d'abord, gel, React 19, CI |
| 4 | `04-CI-LOCALE-ET-GIT.md` | `make act` avant tout push, ajout des tests à la CI, hook `pre-push` |
| 5 | `05-PROMPTS-CLAUDE-CODE.md` | Prompts prêts à coller, un par lot |
| — | `design/tokens.css` | Tokens de couleur générés depuis les maquettes : 4 palettes × clair/sombre |
| — | `maquettes/` | Les 103 écrans de référence (Lumière, clair et sombre) au format `.dc.html`, avec `INDEX.md` |

Contrat de données et règles métier : `../../JanguBi/docs/v1/` (SRS backend §6 à §8).
Maquettes interactives, et les 3 autres palettes : Claude Design (canvas « Jàngu Bi — Maquettes V1 », « · Ciel », « · Atlantique », « · Cathédrale »).
