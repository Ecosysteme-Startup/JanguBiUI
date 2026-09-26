# Écarts assumés — lot D (prêtres, messagerie, confession, profil)

## Blocs de maquette sans donnée réelle (non affichés)
| Écran | Bloc | Ce qu'il faudrait côté backend |
|---|---|---|
| FID-Pretres | « Peut vous accompagner pour » (étiquettes) et langues parlées | champs `accompagnements[]` et `langues[]` sur la disponibilité du prêtre (`/messaging/priests/`) |
| FID-Pretres | « Répond en général sous 24 h » | délai de réponse calculé ; on affiche à la place les plages de réponse réelles (« Répond mar. 15 h-18 h ») ou « Joignable » |
| FID-Pretres | Carte « Pour toute autre question · Secrétariat paroissial · téléphone » | contact du secrétariat de la paroisse suivie dans `/me/` ou `/paroisses/{id}/` |
| FID-Pretres | « Paroisse Saint-Dominique, Point E » (quartier) | quartier/ville dans `paroisse_suivie` de `/me/` |
| FID-Conversation / PAR-Messagerie | Sous-titre de ligne « Vicaire · Préparation au mariage », pastille « conversation ouverte sur la préparation au mariage » | sujet de la conversation et office de l'interlocuteur dans `ConversationOutputSerializer` |
| FID-Conversation / PAR-Messagerie | « Vérifier la sécurité », « Chiffré de bout en bout », joindre un fichier | chiffrement de bout en bout reporté (ADR-014) ; pièces jointes non prévues en V1 ; texte remplacé par « Messages chiffrés · aucun administrateur n'y a accès » |
| PAR-Messagerie | « fidèle de Saint-Dominique depuis 2025 », « Étapes du baptême d'un enfant » | ancienneté du fidèle ; bibliothèque de réponses types |
| FID-Confession-RDV | Créneaux « Complet » et « 5 libres sur 12 » | l'API `/confessions/slots/` ne renvoie que les créneaux libres : on n'affiche que ceux-là (« N libres ») |
| FID-Confession-RDV | Consigne du lieu (« Confessionnal côté sacristie… ») | champ `consigne` sur le lieu de culte ; on affiche l'adresse |
| FID-Profil | « Membre depuis le … », badge « Vérifiée » de l'e-mail, « Langue » | `date_joined`, `email_verified`, préférence de langue dans `/me/` |
| FID-Profil | Face ID, liste des appareils connectés, « Déconnecter partout », clé de récupération | appareils et sessions gérés par Keycloak (lien vers l'espace de connexion) ; clé de récupération liée au chiffrement de bout en bout (reporté) |
| FID-Profil | « Mot de passe modifié le … » | date de dernier changement (Keycloak) |

## Fonctions existantes absentes de la maquette (conservées, style Ciel)
- FID-Pretres : refus expliqué (mineur, date de naissance manquante) ; groupe « Rattaché · aumônerie » ; « Reprendre la conversation » quand un échange existe. La liste « Mes conversations » est passée dans l'onglet « Conversations » (`/app/pretres?vue=conversations`).
- FID-Conversation : accord CGU de messagerie, état « hors ligne / reconnexion », « écrit… », accusé de lecture.
- PAR-Messagerie : réglage de disponibilité (dans une fenêtre, depuis « Les fidèles voient : … · Modifier »), recherche par nom, archivage (bouton « Archiver » dans l'en-tête du fil, liste « Voir les archivées »). Réponse toute prête « Proposer un rendez-vous de confession » : insérée dans la saisie, jamais envoyée sans relecture.
- FID-Confession-RDV : « Mes rendez-vous à venir » avec annulation (carte sous le récapitulatif, ancre du lien « Mes rendez-vous » de la barre) ; prêtre absent grisé (« dès le … ») ; le calendrier s'ouvre sur le mois du premier créneau libre.
- FID-Profil : civilité (à la place de « Langue »), notifications, paroisse suivie, apparence (clair/sombre/appareil), consentement, export JSON, « Mon état de vie » (déclaration, complément), suppression avec confirmation forte.

## Textes corrigés
- Jamais « chiffrée de bout en bout » : « Messages chiffrés, aucun administrateur n'y a accès » (ADR-014).
- Suppression du compte : texte de la maquette (« sous 30 jours ») remplacé par ce que fait réellement le backend (conversations effacées, demandes anonymisées).
- Heure d'annulation : « Annulable jusqu'au <jour>, <heure − 1 h> » (règle actuelle du front), la maquette dit « jusqu'à samedi 12 h ».
