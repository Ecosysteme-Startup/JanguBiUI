# Recette manuelle dans Chrome (Claude in Chrome) — journal

Pile réelle : front http://localhost:3000 (dev), API :8001, Keycloak :8180, Mailpit :8025. Comptes `*@demo.jangubi.sn`.

## Constats
| # | Gravité | Écran / largeur | Constat | Piste |
|---|---|---|---|---|
| C1 | MINEUR | Accueil public, ~1170 px | Bandeau liturgique tassé : la date passe sur deux lignes et les références bibliques sur deux lignes. | `liturgical-banner.tsx` : `whitespace-nowrap` + troncature des références sous `xl`. |
| C2 | CRITIQUE (corrigé `7af9b00`) | Tout espace connecté, premier chargement | Les premières requêtes partaient sans jeton (session encore en chargement) : 401, prénom absent, « Vos demandes n'ont pas pu être chargées ». | `lib/auth-bridge.tsx` : attente de la session initiale + `useLayoutEffect`. |
| C3 | CRITIQUE (corrigé, backend `fdad6d2`) | Première connexion d'un responsable | 403 `mfa_required` annulait le rattachement du compte (ATOMIC_REQUESTS) : rôle staff jamais accordé, compte bloqué. Découvert par l'agent 01. | `apps/authentication/middleware.py` (rattachement hors transaction) ; front : invitation à se reconnecter avec la double authentification (`49c1857`). |
| C4 | MAJEUR | Connexion restée ouverte > 15 min | Le retour de Keycloak échoue (`InvalidCheck: state`), l'utilisateur voit une page anglaise « Server error » (500) sans issue. | Page d'erreur Auth.js à la charte (`pages.error`) qui relance la connexion. |
| C5 | INFO | Parcours fidèle | Dépôt d'une demande d'acte de bout en bout : validation (focus sur l'erreur), paroisse du sacrement, récapitulatif, suivi (réf., date estimée, timeline), e-mail d'accusé dans Mailpit. OK. | — |
| C6 | MINEUR | File des demandes | « 1 demandes dans la file » (accord). | utilitaire `plural()` (agent fix-ux). |
| C7 | MAJEUR | E-mails des demandes d'actes | La partie texte de l'e-mail contient le HTML brut (`<p>…`) : `apps/documents/services.py:181` recopie `html` dans `plain_text`. | `strip_tags` + retours à la ligne. |
| C8 | MINEUR | Écran de traitement | Numérotation des sections : 01, 02, (Assignation), 04, 05. | agent fix-ux. |
| C9 | MINEUR | Parler à un prêtre, confession, accueil | « les prêtres de Paroisse Saint-Dominique », « à Paroisse Saint-Dominique », « Paroisse Paroisse Saint-Dominique » : le nom du nœud contient déjà « Paroisse ». | Ne pas préfixer « Paroisse » ; tournures neutres (« de la paroisse X » → « de X »). |
| C10 | MINEUR | Confession, créneau sélectionné (clair) | Le nom du prêtre sur le créneau sélectionné est presque illisible ; la rangée des 7 jours affiche une barre de défilement alors qu'ils tiennent. | `slot-picker`/`confession-booking` (agent fix-a11y, A11Y-04). |
| C11 | INFO | Parcours validés | Traitement complet d'une demande par l'administrateur paroissial (assignation, vérification, note interne, complément) ; e-mails au fidèle sans note interne ; réponse du fidèle au complément → retour en vérification ; messagerie (CGU, envoi, bandeaux confession et confidentialité honnêtes) ; réservation de confession sans aucun champ de contenu ; déconnexion globale ; retour à la page demandée après connexion. | — |
