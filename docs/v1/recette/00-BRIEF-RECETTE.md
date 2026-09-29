# Recette V1 sur la pile réelle — brief commun aux agents de test

## La pile (déjà démarrée, NE PAS la recréer, NE PAS vider les bases)
| Service | URL |
|---|---|
| Front Next.js (dev) | http://localhost:3000 |
| API Django | http://localhost:8001/api/v1 (OpenAPI : `JanguBi/schema.yml`) |
| Keycloak (realm `jangubi`, thème Jàngu Bi) | http://localhost:8180 — console admin `admin`/`admin` (master) |
| Mailpit (tous les e-mails Django ET Keycloak) | http://localhost:8025 — API `GET /api/v1/messages`, `GET /api/v1/message/{ID}` |
| MinIO (fichiers) | http://localhost:9002 |
Conteneurs : `cd /home/sosza/PycharmProjects/Numerisen/JanguBi && docker compose ps` (lecture, logs : `docker compose logs django --since 5m`).

## Comptes de démonstration (`*@demo.jangubi.sn`)
Mot de passe commun : variable `KC_DEMO_PASSWORD` du fichier `/home/sosza/PycharmProjects/Numerisen/JanguBi/.env` (lis-la, ne la recopie dans aucun rapport ni commit).
| Compte | Profil | Nœud |
|---|---|---|
| fidele@ / fidele2@ | fidèles majeurs, paroisse suivie Saint-Dominique | — |
| mineur@ | fidèle né en 2012 (messagerie refusée) | — |
| cure@ | curé (qualité « Curé ») | Paroisse Saint-Dominique (`DAK-SAINT-DOMINIQUE`) |
| admin_paroissial@ | curé, qualité « Administrateur paroissial » | Sainte-Thérèse de Grand-Dakar (`DEMO-STE-THERESE`) |
| vicaire@ | vicaire (joignable, créneaux de confession) | Saint-Dominique |
| secretaire@ | secrétaire paroissiale (actes, annonces, horaires, agenda) | Saint-Dominique |
| doyen@ | doyen | doyenné de Saint-Dominique |
| chancelier@ | chancelier (structure, nominations, clergé) | Archidiocèse de Dakar |
| plateforme@ | rôle de realm `platform_admin` | plateforme |
Pour de NOUVEAUX comptes (inscription), utilise `<agent>+<horodatage>@test.jangubi.sn` et récupère le lien de vérification dans Mailpit.

## MFA des responsables (TOTP obligatoire)
À la première connexion d'un responsable (tous sauf fidèles/mineur), Keycloak impose d'enrôler un TOTP.
Les secrets sont PARTAGÉS entre agents dans `/tmp/claude-1000/-home-sosza-PycharmProjects-Numerisen/15b0994d-7ed2-4a0a-9ec6-96e5f7bf90f7/scratchpad/totp-secrets.json` (`{ "cure@demo.jangubi.sn": "BASE32SECRET", … }`) :
- avant de te connecter, lis ce fichier : si le secret existe, calcule le code (RFC 6238, SHA1, 6 chiffres, 30 s) ;
- si tu enrôles un compte, lis le secret affiché par Keycloak (« Impossible de scanner ? ») et écris-le dans le fichier sous verrou : `flock <fichier>.lock …` ;
- ne réinitialise jamais l'OTP d'un compte.
Calcul du code : Python `python3 -c "import hmac,hashlib,struct,time,base64,sys; k=base64.b32decode(sys.argv[1].upper()+'='*(-len(sys.argv[1])%8)); c=struct.pack('>Q',int(time.time())//30); h=hmac.new(k,c,hashlib.sha1).digest(); o=h[-1]&15; print('%06d'%((struct.unpack('>I',h[o:o+4])[0]&0x7fffffff)%1000000))" SECRET`.

## Règles
- Tu testes comme un VRAI utilisateur (parcours de bout en bout) ET en profondeur (cas limites, erreurs, droits).
- Ne modifie PAS le code de l'application : tu écris des tests, des scripts et un rapport. Les défauts sont signalés, je les corrige ensuite.
- Données : crée ce dont tu as besoin via l'interface ou l'API (c'est une base de dev jetable), sans supprimer les données de démonstration.
- Pas de push, pas de merge, pas de `make act`, pas de `docker compose down`, pas de redémarrage de conteneur (d'autres agents testent en parallèle).
- Aucun e-mail réel : tout part dans Mailpit.

## Livrables
1. Un **plan de test** et ses **scénarios** (avant de tester) dans `docs/v1/recette/<ton-numéro>-<sujet>.md` : périmètre, personas, matrice des cas, critères d'acceptation.
2. L'exécution, avec pour chaque scénario : OK / KO / bloqué, preuve (étapes, requête/réponse, capture si utile).
3. Les **défauts** classés CRITIQUE / MAJEUR / MINEUR avec reproduction exacte (compte, URL, étapes, attendu, obtenu) et la piste de correction (fichier probable).
4. Rapport final (≤ 400 mots) : synthèse, défauts par gravité, ce qui n'a pas pu être testé et pourquoi.
