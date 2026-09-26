# Demandes aux fondations — lot A (site public et inscription)

## 1. `PublicShell` : `<main>` pleine largeur, sans padding
Écrans : WEB-Accueil, WEB-Pour-les-paroisses (bandes pleine largeur sur fond `surface` avec filets haut/bas :
« La Parole du jour », « Ce que votre paroisse y gagne », « Demander une présentation »), et toutes les pages publiques
(conteneur 1200 px centré, marges verticales propres à chaque écran : 72/48/40/32 px en haut selon la maquette).
Besoin : `<main id="contenu" className="flex-1">` sans `max-w`, sans `px-*`, sans `pt-*`/`pb-*`. Chaque page du lot A pose
son propre conteneur `mx-auto max-w-public px-4 md:px-6` (ou équivalent documenté dans FONDATIONS.md).
Le bandeau liturgique n'apparaît pas dans les maquettes publiques (en-tête 72 px directement en haut).
En attendant : mes pages utilisent leur conteneur local ; tant que le shell garde son padding, les bandes pleine largeur
restent dans la colonne (rendu dégradé mais propre).
Traité : 0f93800 — `<main id="contenu" className="flex-1">` sans padding ni largeur max ; conteneur `jb-container` (1200 + gouttière 16) posé par la page ; plus de bandeau liturgique.

## 2. Coquille « parcours d'inscription » pour `/bienvenue`
Écrans : WEB-Inscription-Paroisse, WEB-Inscription-Consentement.
- En-tête 72 px, bordure basse `line` : logotype (pastille 32 px rayon 9 + « Jàngu Bi » Source Serif 22/600) à gauche ;
  à droite un emplacement fourni par la page (sur /bienvenue l'utilisateur est connecté : bouton contour 40 px « Se déconnecter »
  à la place de « Déjà un compte ? Se connecter »).
- `<main>` conteneur 1200 px, `padding: 32px 0 48px`.
- Pied de page 64 px, fond `surface`, filet haut `line` : « © 2026 Numerisen, Dakar · Protection des données personnelles : loi n° 2008-12 »
  (13/18 ink-3) à gauche ; liens Confidentialité, Conditions d'utilisation, Aide (13/18 ink-2, gap 24) à droite.
Besoin : remplacer le panneau « nuit » de `AuthShell` par cette coquille (ou une nouvelle `SignupShell`), sans prop `aside`.
En attendant, `/bienvenue` garde `AuthShell`.
Traité : 0f93800 — `AuthShell` = en-tête 72 px + `jb-container pt-8 pb-12` + pied 64 px ; `headerAction={<Button asChild variant="outline"><…>Se déconnecter</…></Button>}` ; `aside` désormais facultatif (panneau surface 624 px) : ne pas le passer pour composer sa propre grille.

## 3. Tailles de texte manquantes à l'échelle
- `text-30` (30/42, Source Serif) : citation de l'Évangile dans la bande « La Parole du jour » (WEB-Accueil).
  En attendant : `text-28 leading-[42px]`.
- `text-19` (19/30, Source Serif) : versets de l'aperçu du psaume (WEB-Accueil). En attendant : `text-20 leading-[30px]`.
Traité : ba23ef0 — `text-30` (30/42) et `text-19` (19/30), à combiner avec `font-serif`.

