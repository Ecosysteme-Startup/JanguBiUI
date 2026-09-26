# Écarts maquette ↔ produit — lot G (espace diocèse et plateforme)

Blocs de la maquette sans source de données réelle (non affichés, aucune donnée inventée) et fonctions existantes absentes de la maquette (conservées dans le style Ciel).

## DIO-Tableau-de-bord (`/espace/[nodeId]`, diocèse)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| Sélecteur de mois « Septembre 2026 » | Non affiché : le tableau de bord porte sur une période glissante de 30 jours (`period`) | Un paramètre `month=YYYY-MM` sur `GET /dashboards/nodes/{id}/` |
| « Exporter le rapport » | Non affiché | Un export (CSV/PDF d'agrégats) du tableau de bord |
| Statut « En préparation » et colonne « Prochaine étape » des paroisses (formation, convention, référent à nommer, date d'ouverture prévue) | Non affichés : seules les paroisses **ouvertes** (`is_active_on_platform`) sont listées, badge « Active » | Un suivi d'onboarding par paroisse (statut, prochaine étape, date prévue) |
| Tableau des demandes **par paroisse** (reçues, délai, retard, à retirer) | Remplacé par une ligne « Toutes les paroisses » (agrégat du nœud) | `actes` ventilés par paroisse dans l'API du tableau de bord |
| Histogramme « Demandes reçues par semaine » | Non affiché | Série hebdomadaire des demandes reçues |
| « Par type d'acte » | Remplacé par « Par statut » (donnée existante `actes.counts`) | Ventilation par type d'acte |
| « Réorientées vers une paroisse non ouverte » | Non affiché | Compteur de réorientations |
| « Prochaines nominations » avec noms, initiales et fonctions | **Règle métier** : au-dessus de la paroisse, agrégats uniquement → seul le nombre de nominations proposées est montré, avec « Tout voir » vers l'écran Nominations | — |
| Alerte « Mouvement annuel : 1 ligne sur 42 reste à corriger » | Non affichée : pas d'état d'import persistant | Un état de l'import en cours (lignes en erreur) |
| « À suivre » : convention à signer, référent à nommer | Non affichés (pas de donnée). « À suivre » reprend les signaux réels : actes en retard, conversations sans réponse à 48 h, nominations proposées, déclarations de clercs à vérifier | Tâches de déploiement par paroisse |
| « Fidèles sur Jàngu Bi — Saint-Dominique, cette semaine » | Agrégat de tout le sous-arbre sur 30 jours (fidèles rattachés, actifs, nouveaux, lectures d'annonces, conversations, 1re réponse médiane, confessions réservées / offertes) | — |

Fonctions existantes gardées hors maquette : bouton « Préparer un mouvement » (vers Nominations, si `offices.nommer`), horodatage « données au … », mention de période.
Tableau « Déploiement par doyenné » (ancien écran) : remplacé par la liste des paroisses ouvertes avec leur doyenné, comme la maquette.
