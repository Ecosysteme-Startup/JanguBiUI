# Recette 03 — Accessibilité et responsive (pile réelle)

> Agent n° 03 · 26/09/2026 · front `localhost:3000` (dev), API `:8001`, Keycloak `:8180`.
> Code de test : `JanguBiUI/e2e/audit/` (aucune modification de `src/`). Captures : `docs/v1/recette/captures/03/`.

---

## 1. Plan de test

### 1.1 Périmètre (51 écrans + 5 états Keycloak)

| Espace | Écrans (id de capture) | Persona |
|---|---|---|
| Public | `pub-accueil` `/`, `pub-paroisses`, `pub-fiche-paroisse` (`DAK-SAINT-DOMINIQUE`), `pub-parole`, `pub-offre`, `pub-confidentialite`, `pub-conditions`, `pub-404` | anonyme |
| Keycloak (thème Jàngu Bi) | `kc-connexion`, `kc-inscription`, `kc-connexion-erreur`, `kc-inscription-erreur`, `kc-otp` (code demandé, non soumis) | anonyme / cure@ |
| Fidèle | `app-accueil`, `app-parole`, `app-bible`, `app-bible-chapitre` (Genèse 1), `app-chapelet`, `app-paroisse`, `app-annonce`, `app-evenement`, `app-notifications`, `app-demandes`, `app-demande-nouvelle`, `app-demande-suivi`, `app-pretres`, `app-confession`, `app-profil`, `app-bienvenue` | fidele@ |
| Fidèle mineur | `app-pretres-mineur` (messagerie refusée) | mineur@ |
| Back-office paroisse | `bo-tableau-de-bord`, `bo-demandes`, `bo-demande-detail`, `bo-annonces`, `bo-annonce-nouvelle`, `bo-annonce-edition`, `bo-feuille`, `bo-horaires`, `bo-agenda`, `bo-messagerie`, `bo-confessions`, `bo-equipe`, `bo-parametres`, `bo-audit` | cure@ (TOTP) |
| Back-office diocèse | `dio-tableau-de-bord`, `dio-structure`, `dio-nominations`, `dio-clerge`, `dio-audit` | chancelier@ (TOTP) |
| Plateforme | `pla-tableau-de-bord`, `pla-referentiels`, `pla-comptes`, `pla-audit` | plateforme@ (TOTP) |

Hors périmètre faute de données : `/app/pretres/conversations/[id]` (aucune conversation en base, voir §4).

### 1.2 Critères (WCAG 2.1 AA + exigences projet de la spec §1 et ENF-F07)

| Axe | Mesure automatisée | Critère d'acceptation |
|---|---|---|
| axe-core | `wcag2a/aa`, `wcag21a/aa`, clair et sombre, à 375 et 1440 px | 0 violation |
| Reflow (1.4.10) | `scrollWidth > clientWidth` à 320, 375, 768, 1024, 1440, 1920 | aucun débordement de page |
| Hors écran / tronqué | éléments texte ou interactifs hors viewport ; `overflow:hidden` + contenu plus large/haut | aucun contenu perdu |
| Cibles (2.5.8 + spec) | taille réelle, zone `::after` de `.hit` comprise, liens en phrase exclus | ≥ 24 px (WCAG 2.2), ≥ 44 px (exigence projet) |
| Texte | taille calculée | ≥ 12 px |
| Chevauchement | `elementFromPoint` au centre de chaque cible, en défilant | aucune cible recouverte |
| Clavier (2.1.1, 2.4.3, 2.4.7) | parcours scriptés : menu mobile, sélecteur de contexte, arbre, modale, combobox, agenda Semaine | atteignable, focus visible, ordre logique, Échap ferme et rend le focus |
| Mouvement (2.3.3 bonne pratique) | `reducedMotion: reduce` : animations et transitions actives | 0 |
| Texte 200 % (1.4.4) | racine à 200 % (réglage « taille du texte ») et zoom navigateur 200 % (= 640 px) | pas de perte de contenu |

### 1.3 Outillage

| Fichier | Rôle |
|---|---|
| `e2e/audit/playwright.audit.config.ts` | config dédiée, baseURL `http://localhost:3000`, pas de webServer |
| `e2e/audit/specs/auth.setup.ts` + `helpers/login.ts` | une session par persona (TOTP partagé ; enrôlement via la console de compte si absent) |
| `e2e/audit/specs/00-discover.spec.ts` | découverte des identifiants réels (nœuds, annonces, demandes) |
| `e2e/audit/specs/10-ecrans.spec.ts` + `helpers/measure.ts` | axe × 4 variantes, mesures × 6 largeurs, captures 375/1440 |
| `e2e/audit/specs/20-clavier.spec.ts` + `helpers/keyboard.ts` | 6 scénarios clavier |
| `e2e/audit/specs/30-mouvement-zoom.spec.ts` | reduced-motion et texte 200 % (3 écrans) |
| `e2e/audit/specs/40-keycloak.spec.ts` | états d'erreur Keycloak et écran OTP |
| `e2e/audit/summarize.mjs` | agrégation des JSON bruts |

Lancement : `set -a; . ../JanguBi/.env; set +a; npx playwright test -c e2e/audit/playwright.audit.config.ts` (≈ 6 min, 3 workers). Les mesures brutes (JSON) et les sessions vont dans `AUDIT_OUT` (scratchpad, hors dépôt).

---

## 2. Exécution

### 2.1 Écrans : axe et mise en page (dernier passage complet, 26/09 ~10 h 30)

| Constat | Résultat |
|---|---|
| axe, thème **clair** (375 et 1440) | **OK : 0 violation sur les 51 écrans** et les 5 états Keycloak |
| axe, thème **sombre** | **KO : 38 écrans**, `color-contrast` (A11Y-02 à 04) |
| axe `scrollable-region-focusable` | KO : `dio-tableau-de-bord`, `pla-tableau-de-bord` à 375 (A11Y-12) |
| Débordement horizontal | KO : `dio-structure` 320/375/1024, `bo-annonces` 320/375, `bo-equipe` 320, `bo-audit` · `dio-audit` · `pla-audit` 1024, `app-bienvenue` · `app-demande-nouvelle` · `kc-inscription` 320 |
| Chevauchements | KO : filtres des journaux d'audit et des comptes à 1024 ; sommaire des pages légales ≥ 1024 |
| Texte < 12 px | seulement les ordinaux en exposant (« 25ᵉ », 7,4 px) : accepté |
| Écran en erreur | KO : `pla-referentiels` affiche « Un incident nous empêche d'afficher cette page » (A11Y-01) |

Captures : `captures/03/<id>-375.jpg` et `<id>-1440.jpg` (clair) pour chaque écran, plus `zoom200-*`, `kc-*-erreur-*`, `kc-otp-*` et `defaut-*`.

### 2.2 Clavier

| # | Scénario | Résultat | Preuve |
|---|---|---|---|
| K1 | Menu mobile (« Ouvrir le menu », 375 px) : lien d'évitement en 1ᵉʳ arrêt, Entrée ouvre, focus dans le menu, piégé (25 Tab), Échap ferme, focus rendu | **OK** | `keyboard/K1-menu-mobile.json` |
| K1b | Ordre de tabulation `/app` desktop (40 arrêts) : logique, indicateur 2 px `--jb-primary` partout | **OK** | `K1b-ordre-fidele.json` |
| K2 | Sélecteur de contexte BO (1440 et 375) : 3ᵉ arrêt, menu Radix, focus sur l'item, Échap ferme et rend le focus | **OK** | `K2-selecteur-contexte.json` |
| K3 | Arbre de structure : un seul arrêt Tab, flèches, Droite/Gauche, Début/Fin, Entrée sélectionne (motif APG) | **OK** | `K3-arbre.json` |
| K4 | Modale « Terminer la nomination » : focus initial dans la modale, piégé, Échap ferme | **KO** : focus rendu à `body` (A11Y-05) | `K4-K5-equipe.json` |
| K5 | Combobox de personne : liste, `aria-activedescendant`, option `aria-selected`, 1ᵉʳ Échap ferme la liste seule | **OK** (le panneau reste ouvert au 2ᵉ Échap : A11Y-16) | idem |
| K6 | Agenda : groupe radio Mois/Semaine/Liste, grille Semaine | **KO partiel** : les flèches ne sélectionnent pas (A11Y-11) ; grille Semaine atteignable, focus visible ; défilement horizontal à 375 non focalisable (A11Y-12) | `K6-agenda-semaine.json` |

### 2.3 Mouvement et texte 200 %

| Scénario | Résultat |
|---|---|
| `prefers-reduced-motion` sur `/`, `/app/demandes/nouvelle`, `/espace/…/demandes` (et ouverture du menu mobile) | **OK** : 0 transition ni animation active avec `reduce` (9 transitions sur `/` sans la préférence) |
| Zoom navigateur 200 % (640 px CSS) sur les 3 écrans | **OK** : aucun débordement |
| Texte seul à 200 % | **KO mineur** : 171 textes sur 173 ne grossissent pas sur `/` (tailles en px) ; `/` déborde à 375 (410 px) (A11Y-14) |

### 2.4 Keycloak

| Scénario | Résultat |
|---|---|
| Connexion erronée (compte inexistant) : `aria-invalid` + `aria-describedby` vers le message, focus sur le champ | **OK** |
| Écran OTP : libellé, `autocomplete="one-time-code"`, autofocus, axe clair/sombre | **OK** |
| Inscription soumise vide : e-mail, prénom et nom en `aria-invalid="true"` **sans** `aria-describedby` | **KO** (A11Y-10) |
| Débordement à 320 px de l'inscription (335 px) | KO mineur (A11Y-15) |

---

## 3. Défauts

### CRITIQUE

**A11Y-01 — `/plateforme/referentiels` ne s'affiche jamais.**
Compte plateforme@. Ouvrir « Référentiels ». Attendu : les onglets. Obtenu : la page d'erreur « Un incident nous empêche d'afficher cette page », `TypeError: … is not a function` dans `Page`.
Cause : `src/app/plateforme/referentiels/page.tsx` (composant serveur) appelle `REFERENTIEL_TABS.includes(...)`, une constante importée d'un module `'use client'` (`features/referentiels/components/referentiels-page.tsx`). Côté serveur, c'est une référence client, pas un tableau.
Correctif : déplacer `REFERENTIEL_TABS` et `ReferentielTab` dans un module sans `'use client'` (ex. `features/referentiels/utils/tabs.ts`).

### MAJEUR

**A11Y-02 — Initiales d'avatar illisibles en sombre (1,17:1), 38 écrans.** `text-night-2` (#082438) sur `bg-tint-100`, qui devient #13304a en sombre. Visible dans la sidebar, les tableaux Équipe, Nominations, Comptes, Structure et Clergé, et dans la liste des prêtres. Fichiers : `src/components/ui/avatar.tsx`, `src/features/confessions-planning/components/day-grid.tsx`. Correctif : tokens de texte qui basculent aussi (`text-ink` / `text-primary-strong`) ou fond fixe.

**A11Y-03 — Texte `text-tint-200` sur fond nuit en sombre (1,77:1).** Paragraphe du pied de page public (toutes les pages publiques), légende et texte de `/bienvenue`. Fichiers : `src/components/layouts/public-footer.tsx:45`, `auth-shell.tsx`, `ui/toast.tsx`. Ces surfaces restent « nuit » dans les deux thèmes. Correctif : un token `on-night-muted` fixe.

**A11Y-04 — Créneau sélectionné en sombre (2,35:1).** `text-tint-100` sur `--jb-primary` (#0a6ba3) pour l'heure ou la mention du créneau choisi. Pages `/app/confession` et `/espace/…/confessions`. Fichiers : `components/signature/slot-picker.tsx:36`, `features/confession/components/confession-booking.tsx:87`, `features/confessions-planning/components/confessions-planning.tsx:73`.

**A11Y-05 — Modales : le focus n'est pas rendu au déclencheur (2.4.3).** cure@, `/espace/…/equipe`. Tabuler jusqu'à « Terminer la nomination de Joseph Sarr », Entrée, puis Échap. Attendu : focus sur ce bouton. Obtenu : `document.body` (l'utilisateur de clavier ou de lecteur d'écran repart du haut). Cause : `src/components/ui/modal.tsx` utilise un Radix `Dialog` contrôlé sans `Dialog.Trigger`, donc `onCloseAutoFocus` n'a pas de cible. Correctif : mémoriser `document.activeElement` à l'ouverture et le restaurer dans `onCloseAutoFocus`. Même point à vérifier dans `ui/confirm-dialog.tsx`.

**A11Y-06 — Back-office sous 1024 px : la sidebar entière passe au-dessus du contenu.** À 375 px, environ 850 px de navigation (12 liens, sélecteur, profil) précèdent chaque page. Aucun menu repliable. Capture : `captures/03/bo-tableau-de-bord-375.jpg`. Fichiers : `components/layouts/backoffice-shell.tsx` (`flex-col` puis `lg:flex-row`) et `backoffice-sidebar.tsx`. Correctif : tiroir (Radix Dialog) derrière un bouton « Menu » sous `lg`, comme dans l'espace fidèle.

**A11Y-07 — Bandeau liturgique (variantes desktop et back-office) cassé sous 768 px.** La hauteur fixe coupe « Samedi 26 » en haut. La date et les références se superposent aux filets doubles (en-tête public `/` et toutes les pages BO à 320 et 375). Captures : `pub-accueil-375.jpg` (haut), `bo-demandes-375.jpg`. Fichier : `components/signature/liturgical-banner.tsx`. Correctif : hauteur auto et bascule sur la variante `mobile` sous `md`.

**A11Y-08 — Débordements horizontaux avec contenu hors écran (1.4.10).**
- `dio-structure` : à 320 et 375, « Ajouter un enfant » et le lien parent « Province ecclésiastique de Dakar » sortent de l'écran (403/431 px) ; « Ajouter un enfant » aussi à 1024 (1041 px). Panneau du nœud dans `features/structure/components/` : en-tête `flex` sans `flex-wrap`.
- `bo-equipe` à 320 (353 px) et `bo-annonces` à 320/375 (465 px) : tableaux et onglets sans défilement contenu. Les boutons « Modifier la qualité » et « Terminer » sont à 479 px, et les puces de capacité `h-6` débordent (« Planning des confessions » chevauche). Fichiers : `features/equipe/components/equipe-screen.tsx`, `components/signature/capability-chips.tsx`, `features/annonces-edition/components/annonces-list.tsx`. Correctif : envelopper dans le conteneur défilant de `ui/table.tsx`, ou passer en cartes sous `md`.
- Journaux d'audit (paroisse, diocèse, plateforme) à 1024 : 1164 px. « Nœud » et « Réinitialiser » sont hors écran et le champ Acteur est recouvert par le select Action. Fichier : `features/audit/components/audit-journal.tsx:121` (`lg:grid-cols-[150px_150px_minmax(0,1fr)_200px_200px_auto]`). Correctif : passer à `xl:`, ou `minmax(0,…)` partout.
- `pla-comptes` à 1024 : le champ de recherche est recouvert par le select Rôle. Fichier : `features/comptes/components/comptes-page.tsx`.

**A11Y-09 — Le sommaire collant des pages légales recouvre le texte (≥ 1024 px).** `/conditions` et `/confidentialite` : en défilant, le sommaire (x 955–1265) passe sur le corps du texte et le lien « politique de confidentialité ». Capture : `defaut-conditions-sommaire-chevauche-1440.jpg`. Fichiers : `features/legal/components/*`. Correctif : colonne réservée (grid) et fond opaque.

**A11Y-10 — Inscription Keycloak : erreurs non reliées aux champs (3.3.1, 1.3.1).** Soumettre le formulaire vide. E-mail, prénom et nom reçoivent `aria-invalid="true"` sans `aria-describedby` : le lecteur d'écran n'annonce pas le message. Seuls les mots de passe sont câblés (`register.ftl:27,52`). L'e-mail est en `type="text"`. Le téléphone porte `aria-invalid=""`. Fichier : `JanguBi/infra/keycloak/themes/jangubi/login/`. Surcharger `user-profile-commons.ftl` (ou le gabarit de champ) pour ajouter `aria-describedby="input-error-${attribute.name}"`.

### MINEUR

- **A11Y-11** — Agenda « Affichage » (`agenda-screen.tsx:205`) : `role="radio"` mais 3 arrêts Tab et flèches sans effet. Appliquer le motif APG (tabindex itinérant et flèches), ou un groupe de boutons `aria-pressed`. Idem à vérifier dans `messagerie/components/availability-panel.tsx:189`.
- **A11Y-12** — Zones défilantes non focalisables : tableaux des tableaux de bord diocèse et plateforme à 375 (axe) ; grille Semaine à 375 (720 px dans 343, sans `tabindex`), dans `agenda-edition/components/week-grid.tsx:48` et `ui/table.tsx`. Ajouter `tabIndex={0}`, `role="region"` et `aria-label`.
- **A11Y-13** — Cibles sous l'exigence projet de 44 px : liens de la sidebar BO `h-10` (40 px), segments de l'agenda (40 px), flèches de mois (40×40). Cibles sous 24 px, dont certaines passent 2.5.8 grâce à l'espacement : références du bandeau (19 px), fil d'Ariane BO (17 px), « Affichage sombre » (17 px) collé à « Voir l'espace fidèle » (21 px) dans `backoffice-topbar.tsx`, liens du pied public (18 px), « Aide » et « Confidentialité » du pied Keycloak (26×15), « Filtrer sur l'acteur » (21 px), « Retour · … » (21 px), cases à cocher 20×20. Appliquer `.hit` ou `min-h-11`.
- **A11Y-14** — Tailles de police en px : le réglage « taille du texte » du navigateur est sans effet (171 textes sur 173 sur `/`). Le mélange d'unités fait déborder « Créer mon compte » à 375 (410 px). Passer les tailles en `rem` (`tailwind.config.cjs`, `styles/tokens.css`).
- **A11Y-15** — Petits débordements à 320 : `/bienvenue` (325), `/app/demandes/nouvelle` (327, bandeau mobile `span.truncate`), inscription Keycloak (335).
- **A11Y-16** — Panneau « Nommer une personne » (non modal) : Échap ne le ferme pas et le focus ne s'y déplace pas à l'ouverture.
- **A11Y-17** — Bible sur mobile : listes des livres et des chapitres dans des conteneurs `max-h-[60vh] overflow-y-auto`, soit un double défilement. Les chapitres 41 à 50 de la Genèse sont masqués tant qu'on ne défile pas dans la grille.
- **A11Y-18** — Troncatures : sélecteur de contexte (« Paroisse Saint-Dominique » à 1024–1920), nœuds de l'arbre (320–1024 ; le nom accessible reste complet), titres d'annonces dans la liste (768–1024), sans infobulle ni retour à la ligne.

### Constatés puis corrigés pendant la recette (hors décompte)

- **A11Y-00a** — Un rechargement à froid d'une page connectée lançait les requêtes avant la session : 401 sans nouvel essai, écran en erreur. Corrigé par `7af9b00`, revérifié : 0 échec sur 16 rechargements (fidèle, curé, plateforme).
- **A11Y-00b** — Un responsable sans OTP voyait « Aucun espace de responsable… pas encore de nomination » alors que l'API renvoyait `403 mfa_required`. Corrigé par `49c1857`, **non revérifié** : tous les comptes responsables ont désormais un OTP.

---

## 4. Non testé, et pourquoi

- **Conversation** `/app/pretres/conversations/[id]` et messagerie avec messages : aucune conversation en base, et en créer une passe par le client E2E (autre agent).
- **Écran d'enrôlement OTP** (thème `base`) : tous les responsables sont enrôlés. Y revenir exigerait de réinitialiser un OTP, ce que le brief interdit.
- **Lecteurs d'écran réels** (NVDA, VoiceOver, TalkBack), Safari/iOS, Android Go : pas disponibles ici. L'arbre d'accessibilité est vérifié seulement via axe et les rôles ARIA.
- **Palettes** `ciel`, `atlantique`, `cathedrale` : seule `lumiere` (défaut) a été testée, en clair et en sombre.
- Les captures sont en thème clair. Le sombre est couvert par axe uniquement.

## 5. Notes pour les autres agents

- Le flux `browser-mfa` n'impose l'OTP qu'aux comptes **déjà configurés**. Aucun enrôlement n'est forcé à la première connexion, contrairement au brief. J'ai enrôlé plateforme@ et chancelier@ depuis la console de compte (`…/account/account-security/signing-in`) ; les secrets sont dans `totp-secrets.json`.
- `e2e/stack/helpers/auth.ts` cherche `#totp` sur l'écran de vérification, mais le thème utilise `#otp`. L'enrôlement n'affiche le secret qu'après le lien « mode manuel ». Keycloak refuse aussi de réutiliser un code dans la même fenêtre de 30 s (`codeReusable=false`) : trois échecs verrouillent le compte 60 s. `e2e/audit/helpers/login.ts` gère ces trois cas.

---

## 6. Rapport final

**Synthèse.** 51 écrans et 5 états Keycloak ont été audités sur la pile réelle avec les vraies données, à 6 largeurs, en clair et en sombre, plus 6 parcours clavier, reduced-motion et texte 200 %. En **thème clair, axe ne relève aucune violation** sur l'ensemble. Focus visible partout, liens d'évitement présents, menu mobile, sélecteur de contexte, arbre et combobox conformes aux motifs APG, reduced-motion respecté. Les défauts se concentrent sur **le thème sombre** (contrastes), **le back-office en mobile ou tablette** (sidebar empilée, bandeau cassé, tableaux et filtres qui débordent) et quelques points de gestion du focus.

**Par gravité.**
- CRITIQUE (1) : A11Y-01, page Référentiels en erreur permanente.
- MAJEUR (9) : contrastes en sombre (A11Y-02, 03, 04, sur 38 écrans), focus non restitué après une modale (05), sidebar BO empilée en mobile (06), bandeau liturgique cassé sous 768 px (07), débordements Structure / Équipe / Annonces / Journal / Comptes (08), sommaire des pages légales qui recouvre le texte (09), erreurs d'inscription Keycloak non reliées (10).
- MINEUR (8) : A11Y-11 à 18 (radiogroup de l'agenda, zones défilantes, cibles < 44 px, tailles en px, petits débordements à 320, panneau de nomination, double défilement de la Bible, troncatures).
- 2 défauts constatés puis corrigés en cours de route (00a vérifié, 00b non revérifiable).

**Non testé.** Conversation (pas de données), écran d'enrôlement OTP (tous les comptes sont enrôlés), lecteurs d'écran réels, Safari/iOS, les 3 palettes secondaires.
