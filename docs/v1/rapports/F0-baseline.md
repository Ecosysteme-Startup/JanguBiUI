# F0 — Baseline (25/09/2026)

Mesurée sur `fix/audit-beta` (fbe7c99) avant toute modification :

| Vérification | Résultat |
|---|---|
| `yarn check-types` | 0 erreur |
| `yarn lint` | 0 erreur |
| `yarn test --run` | 112 fichiers, 751 tests verts |

Ce code repose sur l'ancien contrat (rôles `UserRole`, JWT maison, `org`, dons, intentions…) que le backend V1 a retiré (ADR-015, ADR-016 backend). Il est remplacé lot par lot (ADR-F10).
