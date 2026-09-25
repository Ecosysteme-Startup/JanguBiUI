# Jàngu Bi — Spécification frontend V1

> Version 1.0 du 24/09/2026. Contrat de données : `../../JanguBi/docs/v1/02-SRS-BACKEND-V1.md` (§7 API, §6 capacités, §8 cycles de vie).
> Maquettes de référence : `docs/v1/maquettes/` (version Lumière, clair et sombre). Les 4 palettes sont dans Claude Design.

---

## 1. Charte

| Élément | Règle |
|---|---|
| Palettes | `lumiere` (défaut), `ciel`, `atlantique`, `cathedrale` × clair/sombre. Tokens `--jb-*` (`design/tokens.css`). Choix final de la palette : à trancher par la direction ; le code supporte les 4. |
| Polices | Source Serif 4 (titres, Parole, citations) + Libre Franklin (interface). Aucune autre. |
| Signature | Bandeau liturgique (date, temps, pastille de couleur liturgique, références) en tête de l'espace fidèle et du back-office. |
| Interdits | Palette Tailwind brute, dégradés de fond, cartes à bordure gauche colorée, emoji, tuiles d'action identiques en grille, rangées de « stat cards », petites capitales espacées, polices Inter/Geist/Instrument/Fraunces. |
| Images | Emplacements `PhotoSlot` (SVG art-dirigé + légende) en attendant de vraies photos ; attribut `data-photo-slot` conservé pour le remplacement. |
| Français | Espaces insécables, guillemets « », dates longues (« jeudi 24 septembre 2026 »), `dayjs` en locale `fr`. |
| Accessibilité | WCAG 2.1 AA ; contrastes vérifiés par palette ; cibles ≥ 44 px ; focus visible ; `aria-label` sur les boutons icône. |

---

## 2. Carte des routes et maquettes de référence

### 2.1 Public (shell public)
| Route | Écran | Maquette | API |
|---|---|---|---|
| `/` | Accueil public | `Main.dc.html` | `/liturgy/today/`, annuaire (extrait) |
| `/paroisses` | Annuaire | `PUB-Paroisses.dc.html` | `/hierarchy/nodes/?type=paroisse` (public) |
| `/paroisses/[code]` | Fiche paroisse | `PUB-Fiche-Paroisse.dc.html` | nœud, lieux, `/public/nodes/{id}/week/`, annonces publiques |
| `/parole` | Parole du jour | `PUB-Parole-du-jour.dc.html` | `/liturgy/{date}/` |
| `/pour-les-paroisses` | Offre et contact | `PUB-Pour-les-paroisses.dc.html` | `POST /public/contact/` (à ajouter au SRS) |
| `/connexion` | Connexion | `PUB-Connexion.dc.html` (thème Keycloak) | Keycloak |
| `/inscription` | Inscription 1/3 | `PUB-Inscription-Compte.dc.html` (thème Keycloak) | Keycloak |
| `/bienvenue` | Inscription 2-3/3 (paroisse + consentement) | `PUB-Inscription-Paroisse.dc.html` | `PATCH /me/`, `POST /me/consent/` |

### 2.2 Espace fidèle (shell fidèle ; mobile = même route, shell mobile)
| Route | Écran | Maquette desktop | Maquette mobile |
|---|---|---|---|
| `/app` | Accueil | `FID-Accueil` | `MOB-Accueil` |
| `/app/parole` | Lectures du jour | `FID-Parole` | `MOB-Parole` |
| `/app/bible/[livre]/[chapitre]` | Bible | `FID-Bible` | — |
| `/app/chapelet` | Chapelet | `FID-Chapelet` | — |
| `/app/paroisse` | Ma paroisse | `FID-Ma-Paroisse` | `MOB-Ma-Paroisse` |
| `/app/paroisse/annonces/[id]` | Annonce | `FID-Annonce` | — |
| `/app/paroisse/evenements/[id]` | Événement | `FID-Evenement` | — |
| `/app/notifications` | Notifications | `FID-Notifications` | — |
| `/app/demandes` | Mes demandes | `FID-Demandes` | — |
| `/app/demandes/nouvelle` | Nouvelle demande | `FID-Demande-Nouvelle` | `MOB-Demande-Nouvelle` |
| `/app/demandes/[id]` | Suivi | `FID-Demande-Suivi` | `MOB-Demande-Suivi` |
| `/app/pretres` | Parler à un prêtre | `FID-Pretres` | — |
| `/app/pretres/conversations/[id]` | Conversation | `FID-Conversation` | `MOB-Conversation` |
| `/app/confession` | Rendez-vous de confession | `FID-Confession-RDV` | `MOB-Confession` |
| `/app/profil` | Profil et sécurité | `FID-Profil` | `MOB-Menu` (menu « Plus ») |

### 2.3 Back-office (shell back-office, `[nodeId]` = contexte courant)
| Route | Écran | Maquette | Capacité requise |
|---|---|---|---|
| `/espace/[nodeId]` | Tableau de bord du nœud | `PAR-Tableau-de-bord` / `DIO-Tableau-de-bord` | `tableau_bord.voir` |
| `/espace/[nodeId]/demandes` | File des demandes | `PAR-Demandes` | `actes.traiter` |
| `/espace/[nodeId]/demandes/[id]` | Traitement | `PAR-Demande-Detail` | `actes.traiter` |
| `/espace/[nodeId]/annonces` | Annonces | `PAR-Annonces` | `annonces.publier` |
| `/espace/[nodeId]/annonces/nouvelle`, `/[id]` | Éditeur | `PAR-Annonce-Editeur` | `annonces.publier` |
| `/espace/[nodeId]/horaires` | Horaires et lieux | `PAR-Horaires` | `horaires.gerer` |
| `/espace/[nodeId]/agenda` | Agenda | `PAR-Agenda` | `evenements.gerer` |
| `/espace/[nodeId]/messagerie` | Messagerie prêtre | `PAR-Messagerie` | `messagerie.recevoir_fideles` |
| `/espace/[nodeId]/confessions` | Créneaux de confession | `PAR-Confessions` | `confessions.gerer` ou `confessions.voir_planning` |
| `/espace/[nodeId]/equipe` | Équipe et nominations | `PAR-Equipe` | `offices.nommer` (lecture : `tableau_bord.voir`) |
| `/espace/[nodeId]/parametres` | Paramètres | `PAR-Parametres` | `horaires.gerer` |
| `/espace/[nodeId]/structure` | Arbre | `DIO-Structure` | `structure.gerer` |
| `/espace/[nodeId]/nominations` | Nominations et import | `DIO-Nominations` | `offices.nommer` |
| `/espace/[nodeId]/clerge` | Clergé et vérifications | `DIO-Clerge` | `personnes.verifier` |
| `/plateforme` | Tableau de bord plateforme | `PLA-Tableau-de-bord` | `plateforme.admin` |
| `/plateforme/referentiels` | Référentiels | `PLA-Referentiels` | `plateforme.admin` |
| `/plateforme/comptes` | Comptes | `PLA-Comptes` | `plateforme.admin` |
| `/plateforme/audit` | Journal d'audit | `PLA-Audit` | `plateforme.admin` ou `audit.voir` |

La sidebar du back-office est **calculée** à partir de `useCan()` sur le nœud courant. Une entrée n'apparaît que si la capacité est présente. Le sélecteur de contexte liste les nœuds où l'utilisateur a au moins une capacité (`GET /me/capacites/`), groupés par niveau.

---

## 3. Architecture technique

| Sujet | Règle |
|---|---|
| Rendu | App Router. Pages publiques en rendu serveur (SEO), espaces connectés en composants client avec TanStack Query. |
| Données | Un fichier par endpoint : schéma Zod, fetcher, hook. Clés de requête hiérarchiques (`['demandes', nodeId, filtres]`). Mutations avec invalidation ciblée. |
| Contrat | `src/types/api.ts` généré ; `RequestBody<'operationId'>` pour les corps. |
| Formulaires | react-hook-form + Zod ; messages d'erreur en français sous le champ ; état validé visible. |
| État global | Zustand réservé à l'UI (contexte de nœud courant, préférences d'affichage). Aucune donnée serveur dans Zustand. |
| Temps réel | `src/lib/ws.ts` : un socket de notifications global, un socket par conversation ouverte, jeton frais à chaque connexion, reprise avec plafond de tentatives puis état « hors ligne » actionnable. |
| Autorisation | `useCan(capacite, nodeId?)`, `useNodes(capacite)`, garde de route `<RequireCapability>` ; plus aucune fonction par rôle. |
| Thème | `next-themes` (clair, sombre, système) + `data-palette`. |
| Erreurs | Boundaries par feature, Sentry, pages 404, 403 et 500 aux couleurs de la charte. |
| Tests | Vitest + Testing Library + MSW (handlers conformes au contrat) ; Playwright pour les parcours dorés ; Storybook + addon a11y. |

---

## 4. Composants signature (à implémenter en F1)

| Composant | Rôle | Référence |
|---|---|---|
| `LiturgicalBanner` | Date, jour, temps liturgique, pastille de couleur, références ; variantes desktop, mobile, back-office | `DS-Fondations`, toutes les pages fidèle |
| `PhotoSlot` | Emplacement photo art-dirigé, ratio fixe, légende, `data-photo-slot` | `DS-Fondations` |
| `StatusDot` | Point + libellé pour les 6 statuts d'acte, et variantes pour nominations et réservations | `DS-Composants` |
| `RequestTimeline` | Timeline de suivi d'une demande | `FID-Demande-Suivi` |
| `ConfessionNotice` | Bandeau permanent « La confession ne se fait pas par message » | `FID-Conversation` |
| `E2EBadge` | Indicateur de chiffrement de bout en bout | `FID-Conversation` |
| `SlotPicker` | Grille de créneaux (libre, pris, sélectionné) | `FID-Confession-RDV` |
| `ScheduleWeek` | Semaine des horaires par lieu de culte | `FID-Ma-Paroisse`, `PAR-Horaires` |
| `AnnouncementCard` | Carte éditoriale (sans boîte) | `FID-Ma-Paroisse` |
| `NodeContextSwitcher` | Sélecteur de contexte du back-office | Shell back-office |
| `CapabilityChips` | Capacités d'un office (lecture) | `PAR-Equipe` |
| `TreeView` | Arbre des juridictions navigable | `DIO-Structure` |
| `ImportWizard` | Import CSV en 3 étapes avec simulation | `DIO-Nominations` |
| `Stepper` | Formulaires en étapes | `FID-Demande-Nouvelle` |

---

## 5. Exigences non fonctionnelles

| ID | Exigence |
|---|---|
| ENF-F01 | Lighthouse mobile ≥ 90 (performance, accessibilité, bonnes pratiques) sur `/`, `/app`, `/app/parole` |
| ENF-F02 | JS initial < 200 ko gzip sur l'espace fidèle ; import dynamique de l'éditeur TipTap et du client E2E |
| ENF-F03 | Utilisable en 3G : squelettes de chargement, pagination, pas de requêtes en cascade (N+1 côté client) |
| ENF-F04 | Aucun jeton ni donnée religieuse dans `localStorage` ou dans les logs Sentry (scrubbing configuré) |
| ENF-F05 | CSP stricte, en-têtes de sécurité (Next `headers()`), aucune ressource tierce hors Google Fonts via `next/font` (auto-hébergées) |
| ENF-F06 | Navigateurs : Chrome et Safari des 2 dernières versions, Android Go, iOS 15+ |
| ENF-F07 | Accessibilité WCAG 2.1 AA, test axe dans la CI e2e |
