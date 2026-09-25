# Direction de design — Jàngu Bi

> **À valider avant toute propagation.** Ce document dit ce que l'application
> doit être et pourquoi. Il est court exprès : tu dois pouvoir le lire en cinq
> minutes et répondre « oui, c'est ça » ou « non, pas ça ».
>
> Chaque règle est opposable : on doit pouvoir regarder un écran et dire s'il la
> respecte.

---

## 0. Pourquoi ce document existe

La première refonte a déçu. La cause n'était pas des écrans laids, c'était
l'**absence d'intention déclarée** : chaque écran a été traité localement, sans
système, donc sans ambition cumulée. On a produit de l'hygiène — états vides,
messages d'erreur, tableaux cohérents — et pris ça pour du design.

Deux facteurs aggravants, désormais corrigés :

- l'**accent or ne s'affichait nulle part** (token déclaré en camelCase, classe
  écrite en kebab-case, donc jamais générée) : la seule signature visuelle de la
  direction était invisible à 43 endroits ;
- le **système de tokens était riche mais inutilisé** : échelle typographique
  jusqu'à 3,5 rem, rythme d'espacement, mesure de lecture, texture, courbes
  d'animation — et des écrans entièrement en `text-sm`, même rayon, même ombre.

> **Version 2** — une première rédaction posait le missel comme référence et la
> lecture comme identité. C'était trop étroit et trop ancien : ça rendait
> invisible ce qui distingue réellement le produit, et ça entrait en tension
> avec le bleu, qui est l'identité voulue. Corrigé ci-dessous.

---

## 1. Le parti pris

**Jàngu Bi est le compagnon quotidien du catholique — tout au même endroit,
simplement.**

L'AELF fait très bien les lectures du jour. Sur ce terrain, on est au mieux à
égalité. Notre différence, ce sont les **modules** : demandes de documents
officiels, messagerie avec le clergé, notifications, chapelet, intentions de
messe, agenda, dons. Un fidèle n'a plus à jongler entre une app de lectures, le
secrétariat de sa paroisse et WhatsApp.

Conséquence directe sur le design : **si un écran ne raconte que la lecture,
notre avantage reste invisible.** La richesse doit se sentir — sans peser.

Le vrai problème à résoudre n'est donc pas « faire une belle page ». C'est :
**faire que neuf modules donnent la sensation d'un seul endroit calme.**

### Le registre

Contemporain et **bleu**. Le bleu Jàngu Bi (`#1A8FCC` clair / `#70CBFF` sombre)
est l'identité, décidée par le propriétaire : il domine. Espace généreux, formes
franches, mouvement qui guide.

Une âme spirituelle malgré tout — or, filets, sérif éditorial en accent — pour ne
pas ressembler à une app bancaire. Mais **en accent, jamais en registre
dominant**.

**Contre-exemples à bannir** : la grille de cartes uniformes où rien n'indique ce
qui compte ; l'austérité liturgique façon livre ancien ; le tableau de bord gris
d'outil interne.

---

## 2. Les six règles

### R1 — Le parcours prime sur l'écran

Ce qui rend une application « simple » n'est pas la beauté d'une page, c'est le
nombre d'étapes pour faire une demande de document, joindre son curé, confier une
intention. On juge le **trajet**, pas la capture.

> Test : compte les taps entre l'ouverture de l'app et l'action accomplie.
> Chaque tap doit se justifier.

### R2 — Le contraste d'échelle porte la hiérarchie

Un écran a **un** sujet, et il doit se voir sans lire. On utilise vraiment
l'échelle disponible (`--text-display`) pour ce qui compte, et le petit corps
pour l'appareil (surtitres, métadonnées, dates).

> Test : masque tout sauf les tailles de texte. Devine-t-on le sujet ?

### R3 — Moderne veut dire lisible, pas tendance

La cible est majoritairement sur téléphone, souvent modeste, parfois en plein
soleil, et une part des fidèles a plus de soixante ans. Donc : zoom **jamais
bloqué**, cibles tactiles ≥ 44 px, contrastes tenus, **pas de gris clair sur
blanc**, pas de typographie fine décorative, pas de survol comme seule
affordance.

C'est là que se joue la qualité réelle : être contemporain **et** lisible dehors.

### R4 — La couleur dit quelque chose

Le bleu porte l'identité et l'action. Les couleurs sémantiques portent l'état
(succès, alerte, retard). La **couleur liturgique** — violet pour l'Avent et le
Carême, blanc et or pour Noël et Pâques, rouge pour la Pentecôte et les martyrs,
vert pour le temps ordinaire — marque le temps de l'Église sur les écrans
spirituels.

Elle reste **discrète** : un liseré, une pastille, un surtitre. Elle ne lave pas
la page, sinon elle mange le bleu qui est notre identité.
Implémentation : `src/features/home/utils/liturgical-color.ts`.

La couleur seule ne porte jamais une information critique (WCAG 1.4.1).

### R5 — La profondeur vient de la surface

Superpositions, changements de surface, filets, un grain discret. Pas
d'empilement d'ombres portées pour simuler du relief.

### R6 — Trois archétypes, trois traitements

Toute l'application se ramène à trois familles. C'est ce qui permet de propager
sans re-décider à chaque écran.

| Archétype | Écrans | Traitement |
| --- | --- | --- |
| **Lecture** | liturgie du jour, Heures, Bible, chapelet, article, réflexion | Immersif. Mesure de lecture (~68ch), grande échelle, ornement minimal, marqueur liturgique en ouverture. |
| **Flux** | actualités, agenda, TV, coffre-fort | Éditorial. Hiérarchie une/secondaires, image porteuse, rythme irrégulier assumé — surtout pas une grille uniforme. |
| **Travail** | file paroissiale, admin, tableaux de bord, demandes | Dense et efficace. Zéro ornement, action principale visible, jamais de décor qui ralentit. |

> Un écran qui ne sait pas à quelle famille il appartient est un écran mal conçu.

---

## 3. Comment on propage

**Par composants partagés, pas écran par écran.** La propagation consiste à
assembler des blocs construits une fois. Re-styler chaque page à la main est
précisément ce qui a produit l'incohérence.

Conséquence pratique : on utilise les primitives **shadcn** existantes plutôt que
d'en réécrire des versions dégradées — notamment sa `sidebar` (rail, repli en
icônes avec info-bulles, tiroir mobile, raccourci clavier), aujourd'hui
réimplémentée à la main, et ses blocs de graphiques pour les tableaux de bord.

---

## 4. Les écrans de référence

À valider avant toute propagation. Un par archétype, plus un parcours complet —
parce que R1 dit que le trajet prime sur l'écran.

| Archétype | Écran / parcours de référence | État |
| --- | --- | --- |
| Lecture | Accueil du fidèle (`/app`) | ✅ livré — à re-régler : le bleu doit dominer, le marqueur liturgique s'effacer |
| Lecture | Liturgie du jour (`/app/spirituel/liturgie`) | à faire — c'est la page vers laquelle l'accueil envoie |
| Flux | Actualités (`/app/actus`) | partiel — lecture d'article traitée, le fil reste à finir |
| Travail | File paroissiale (`/app/admin/documents`) | à faire |
| **Parcours** | Demander un document, de l'accueil au suivi | à faire — mesure le nombre de taps, pas l'esthétique |

**Si ces références sont validées, le reste est de l'application mécanique.**
Sinon, on n'aura perdu que quelques écrans.

---

## 5. Ce qu'on ne fait pas

- Pas de refonte des 40 écrans avant validation des références.
- Pas de changement des tokens de couleur : le bleu est un choix du
  propriétaire, il est acquis et il domine.
- Pas de mode sombre par défaut : le clair d'abord, le sombre reste soigné.
- Pas d'ornement qui ralentit un écran de travail.
- Pas d'effet « moderne » au prix de la lisibilité (cf. R3).

---

## 6. Comment on juge

Sur le **staging**, pas sur une description. Quatre questions :

1. Est-ce que je vois le sujet sans lire ?
2. Est-ce que ça ressemble à *ce* produit, ou à n'importe quelle app ?
3. Est-ce que je m'en servirais sur mon téléphone, dehors, à 60 ans ?
4. Est-ce qu'on sent qu'il y a **tout** ici — sans que ça pèse ?

Et le juge final reste l'utilisateur : ces quatre questions servent à décider
quoi lui montrer, pas à décider à sa place.
