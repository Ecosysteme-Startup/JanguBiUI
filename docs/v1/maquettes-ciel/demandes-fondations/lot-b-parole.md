# Demandes aux fondations — lot B (Parole)

## 1. Jetons pour l'aplat bleu de l'accueil (FID-Accueil, « Parole du jour »)
Maquette (clair ET sombre) : texte secondaire #D9EBF7 sur #0A6BA3, pastille « Vert » texte #0E1A2B sur #FEFEFE.
Aucun jeton non « ancien » ne vaut ces valeurs dans les deux thèmes. Besoin : `on-primary-muted` (#D9EBF7 / #D9EBF7) et
un texte d'encre fixe sur blanc (`on-lit-white` #0E1A2B / #0E1A2B). En attendant : `text-on-night` et `text-night`
(valeurs proches, marquées « anciens écrans »).

## 2. `buttonVariants()` sur un lien : classes en conflit
`buttonVariants({ variant: 'outline' })` renvoie `border-transparent` ET `border-line` (cva ne fusionne pas) : sur un
`<NextLink>`, la bordure disparaît (« Demander un acte », « Luc 8 »). `Button` passe par `cn()`, pas `buttonVariants`.
Proposition : `buttonVariants` enveloppé dans `cn()` (ou retirer `border-transparent` de la base). En attendant :
`cn(buttonVariants(...))` dans le lot B.

## 3. Schéma partagé `src/hooks/use-liturgy-today.ts`
Garder `readings[].verses` (facultatif, défaut `[]`) et `audio_url` (nullable, facultatif) pour que l'accueil affiche
le verset en exergue et « Écouter » sans second appel à `/liturgy/today/` (test « une seule requête par ressource »).

## 4. `paths.app.chapelet.getHref(jour?)`
Le chapelet accepte `?jour=0…6` (mystères d'un autre jour). Contournement : `src/features/chapelet/utils/links.ts`.
