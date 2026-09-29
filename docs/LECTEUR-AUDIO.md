# Lecteur audio global (web)

Lot C5-lecteur (plan suite V2, §5.3 et §7). Maquettes : `WEB-FID-Lecteur-Barre`,
`WEB-FID-Lecteur`, planche `APP-H03-DS-Mouvement` (séquence web) ; spec
`ECRANS-V2-LECTEUR.md`. Contrat : `docs/API-AUDIO.md` (§3, §5, §6, §7, §8) et
`docs/TEMPS-REEL.md` du backend.

## Où c'est

| Fichier | Rôle |
|---|---|
| `src/lib/player/player-store.ts` | Store zustand : file, piste, position, vitesse, qualité, volume, minuterie, barre / déployé, offre de reprise |
| `src/lib/player/engine.ts` | Moteur : une seule balise `<audio>` ; `hls.js` chargé à la demande ; HLS natif sur Safari ; repli sur le MP3 de secours si le flux HLS tombe |
| `src/lib/player/api.ts` | `lecture/`, `lecture/etat/`, `evenements/`, `ensuite/`, `like/`, `signaler/` |
| `src/lib/player/state-sync.ts`, `use-player-sync.ts` | `PUT lecture/etat/` (15 s, pause, changement de piste, `pagehide`), `GET lecture/etat/` au démarrage, `playback.state` |
| `src/lib/player/listen-events.ts` | Événements d'écoute en lot (30 s, arrière-plan, `pagehide`, retour du réseau), gardés en stockage local |
| `src/lib/realtime/notifications-socket.ts` | Socket unique `ws/notifications/` (ticket, battement 25 s, reconnexion) à laquelle on s'abonne |
| `src/lib/player/use-player.ts` | **API publique** (ci-dessous) |
| `src/components/player/` | `PlayerRoot` (monté dans `AppShell`), barre, lecteur déployé, onde, file, « À propos », options, offre de reprise |
| `src/testing/mocks/handlers/audio-lecteur.ts` | Mocks MSW / mock-server (données de la maquette) |

`<PlayerRoot />` et `<PlayerSpacer />` sont montés une fois dans
`src/components/layouts/app-shell.tsx` : le son continue pendant la navigation
dans `/app/*`.

## API pour la sonothèque et les autres pages

```tsx
import { usePlayer, usePlayerTrackStatus } from '@/lib/player/use-player';

const player = usePlayer();

// Lancer un album à la 3e piste. `tracks` : objets `Track` du contrat.
player.playTracks(album.tracks, 2, {
  kindLabel: 'l’album',                 // « Lecture depuis l’album … »
  label: album.title,
  href: `/app/…/albums/${album.id}`,    // lien dans l’en-tête du lecteur
});

player.playTrack(track);                // une seule piste
player.playNext(track);                 // « À suivre · ajoutée par vous », en tête
player.addToQueue(track);               // idem, en fin
player.prefetch(track.id);              // au survol : précharge l'URL signée
player.toggle(); player.pause(); player.next(); player.previous();
player.seek(90); player.expand(); player.collapse();
player.toggleLike(track);

// Dans une liste : surligner la piste en cours et afficher l'égaliseur.
const { isCurrent, isPlaying } = usePlayerTrackStatus(track.id);
```

- `tracks` accepte le `Track` du contrat tel quel (`id`, `title`,
  `duration_seconds` suffisent). Champs facultatifs hors contrat que le lecteur
  sait afficher : `cover_url` (piste) ou `album.cover_url` (pochette),
  `album.recorded_on`, `reason` (« À écouter ensuite »), `readings` (lectures
  de la messe), `liked`.
- `playTracks` sur la piste déjà en cours ne la recharge pas : elle reprend.
- Le lecteur appelle lui-même `POST pistes/<id>/lecture/` (URL signée, reprise,
  200 pics) ; ne pas l'appeler avant.
- Pour l'égaliseur d'une ligne : `Equalizer` de `src/lib/motion/equalizer.tsx`
  avec `playing={isPlaying}`.
- Accès bas niveau (tests, cas particuliers) : `usePlayerStore` de
  `src/lib/player/player-store.ts`.

## Comportement

- **Reprise** : `resume.position_seconds` du contrat ; piste finie → début.
- **File** : « À suivre · ajoutée par vous » passe avant la suite du contexte ;
  aléatoire garde la piste en cours en tête ; répéter : non → toute la file →
  cette piste ; en fin de file, lecture en continu sur « À écouter ensuite »
  (`GET pistes/<id>/ensuite/`, 3 premières).
- **Précédent** : au-delà de 3 s, revient au début de la piste.
- **Vitesse** : 0,75×, 1×, 1,25×, 1,5×, mémorisée **par type de contenu**
  (homélies et retraites d'un côté, le reste de l'autre).
- **Minuterie** : 15, 30, 45 min ou fin de la piste ; fondu du son sur 10 s.
- **Qualité** : Auto (ABR), Économie (32 kb/s), Haute (128 kb/s) avec hls.js ;
  en HLS natif (Safari) le navigateur choisit seul, l'option est grisée.
- **Événements** : `start` au premier son, `skip` si l'on passe avant 30 s,
  `progress` si l'on quitte après, `complete` à la fin, `like`.
- **Multi-appareils** : au démarrage, `GET lecture/etat/` (état de moins de
  48 h) ; en cours de session, `playback.state` d'un autre `device_id` quand on
  n'écoute rien ici. Carte « Reprendre sur cet appareil ? » au-dessus de la
  barre ; la reprise ici ne met pas l'autre appareil en pause.
- **`pagehide`** : `fetch(…, {keepalive: true})` plutôt que `sendBeacon`, qui ne
  sait faire que des POST sans en-tête `Authorization`.
- **Media Session** : touches multimédia et écran verrouillé.

## Clavier et accessibilité

- Espace : lecture / pause ; ← / → : −15 s / +15 s ; Échap : réduire. Inactifs
  dans un champ, un curseur, un menu (Espace reste aux boutons et liens).
- La forme d'onde est un `role="slider"` : `aria-valuetext` « 1 minute
  52 secondes sur 4 minutes 12 », flèches ±15 s, Page ±60 s, Début / Fin.
- Lecteur déployé : `role="dialog"`, `aria-modal`, focus piégé, rendu au
  bouton d'origine à la fermeture ; vitesse en `radiogroup` ; volume en
  curseur natif.

## Mouvement

Jetons `playerMotion` de `src/lib/motion/tokens.ts` (planche APP-H03, §01).
Pochette partagée barre → panneau par `layoutId` avec `springs.indicator`
(18 / 0,7 / 190) ; fond (pochette floutée, voile papier 88 %, Ken Burns)
en 240 ms ; titre, onde, commandes, options, file, « À propos » décalés de
40 ms à partir de 200 ms ; pochette 0,94 en pause ; lecture ⇄ pause en 160 ms
(fondu + échelle, transform et opacité seulement) ; changement de piste en
fondu de 280 ms ; curseur de l'onde qui glisse linéairement sur 1 s entre deux
relevés. Mouvement réduit : un seul fondu de 120 ms, fond fixe, égaliseur figé.

## Décisions « à valider » de la spec (option retenue)

1. Voile du fond : 88 % (`bg-background/[0.88]`).
2. Onde : barres restantes grises (`muted-foreground` à 60 %), pas b200.
3. Vitesse mémorisée par type de contenu (homélies à part).
4. Minuterie : 15, 30, 45 min ou fin de piste ; fondu de 10 s.
5. Reprise : carte au démarrage et sur `playback.state` ; ne met pas l'autre
   appareil en pause.
6. Web : le lecteur déployé couvre tout l'écran, barre latérale comprise.
7. Crédit photo : pas sur l'écran principal.

## Écarts connus

- « À écouter ensuite » : le contrat `ensuite/` renvoie des `Track` sans
  raison ; le lecteur affiche `reason` si la piste en porte une (mocks).
- « À propos » : lieu d'enregistrement, rôles des interprètes et lectures liées
  ne sont pas dans le contrat. Rôles lus sous la forme « Rôle : Nom » dans
  `performers` ; lectures via `readings` si fourni.
- Partager, « Ajouter à une playlist » et le choix de la sortie audio ne sont
  pas branchés (la sortie affiche « Cet ordinateur »).
- Pas de glisser vers le bas pour fermer (geste tactile mobile) : sur le web,
  « Réduire », la croix et Échap.
