'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { sonoKeys } from '../api/keys';
import {
  uploadToStorage,
  type StorageUploader,
} from '../api/upload-to-storage';
import {
  createUpload,
  finishUpload,
  getUpload,
  publishTrack,
  reencodeTrack,
  updateTrack,
  type UpdateTrackInput,
} from '../api/uploads';
import type { StaffTrack, UploadInit, Visibilite } from '../types/schemas';
import { messageErreur } from '../utils/erreurs';
import {
  titreDepuisNom,
  typeAudio,
  verifierFichier,
} from '../utils/fichiers-audio';

/**
 * File d'envoi de la sonothèque (maquette WEB-PAR-Audio-Upload).
 *
 * Pour chaque fichier :
 *   1. `POST audio/uploads/` → POST présigné ;
 *   2. POST direct vers le stockage (XHR, progression) ;
 *   3. `POST audio/uploads/<id>/terminer/` → piste « en file » ;
 *   4. suivi par `GET audio/uploads/<id>/` en polling doux (intervalle qui
 *      s'allonge : 2 s, 3 s, 4,5 s… jusqu'à 15 s), arrêté à « prêt » ou « échec ».
 *
 * Une erreur garde sa phase : « Réessayer » reprend là où l'envoi s'est
 * arrêté (sans recréer la piste si l'autorisation d'envoi est encore valable),
 * ou relance l'encodage (`reencoder/`) si c'est l'encodage qui a échoué.
 */

export type EtapeEnvoi =
  | 'attente'
  | 'invalide'
  | 'preparation'
  | 'envoi'
  | 'finalisation'
  | 'en_file'
  | 'encodage'
  | 'pret'
  | 'echec';

export type PhaseEchec = 'preparation' | 'envoi' | 'finalisation' | 'encodage';

export interface FichierEnvoi {
  cle: string;
  file: File;
  titre: string;
  etape: EtapeEnvoi;
  /** Part envoyée, entre 0 et 1. */
  progression: number;
  octetsEnvoyes: number;
  /** Débit moyen de l'envoi (octets/s). */
  debit: number | null;
  uploadId?: string;
  presign?: UploadInit;
  presignExpireA?: number;
  track?: StaffTrack;
  envoyeA?: number;
  erreur?: string;
  phaseEchec?: PhaseEchec;
  publie?: boolean;
}

export interface MetaEnvoi {
  sourceId: string;
  albumId?: string | null;
  visibility: Visibilite;
  rightsConfirmed: boolean;
  /** Métadonnées appliquées à chaque piste après l'envoi (PATCH). */
  language?: string;
  liturgicalSeason?: string;
  description?: string;
}

interface Options {
  uploader?: StorageUploader;
  /** Premier intervalle du suivi d'encodage (ms). */
  intervalleSuivi?: number;
  /** Envois simultanés. */
  concurrence?: number;
}

const SUIVI_MAX = 15_000;
const EN_SUIVI: EtapeEnvoi[] = ['en_file', 'encodage'];

let compteur = 0;
const nouvelleCle = () =>
  `f${Date.now().toString(36)}${(compteur++).toString(36)}`;

export function useFileEnvoi({
  uploader = uploadToStorage,
  intervalleSuivi = 2_000,
  concurrence = 2,
}: Options = {}) {
  const qc = useQueryClient();
  const store = useRef(new Map<string, FichierEnvoi>());
  const meta = useRef<MetaEnvoi | null>(null);
  const actifs = useRef(0);
  const [, setVersion] = useState(0);
  const rendre = useCallback(() => setVersion((v) => v + 1), []);

  const maj = useCallback(
    (cle: string, patch: Partial<FichierEnvoi>) => {
      const f = store.current.get(cle);
      if (!f) return;
      store.current.set(cle, { ...f, ...patch });
      rendre();
    },
    [rendre],
  );

  const echec = useCallback(
    (cle: string, phase: PhaseEchec, err: unknown, repli: string) =>
      maj(cle, {
        etape: 'echec',
        phaseEchec: phase,
        erreur: messageErreur(err, repli),
      }),
    [maj],
  );

  // ------------------------------------------------------------ pipeline
  const executer = useCallback(
    async (cle: string, depuis: PhaseEchec = 'preparation') => {
      const m = meta.current;
      let f = store.current.get(cle);
      if (!m || !f) return;

      // 1. Autorisation d'envoi (réutilisée si encore valable).
      const presignValable =
        f.presign &&
        f.uploadId &&
        (f.presignExpireA ?? 0) > Date.now() + 30_000;
      if (depuis === 'preparation' || (depuis === 'envoi' && !presignValable)) {
        maj(cle, {
          etape: 'preparation',
          erreur: undefined,
          phaseEchec: undefined,
        });
        try {
          const init = await createUpload({
            source_id: m.sourceId,
            album_id: m.albumId,
            title: f.titre,
            visibility: m.visibility,
            file_name: f.file.name,
            file_type: typeAudio(f.file),
            file_size: f.file.size,
            rights_confirmed: m.rightsConfirmed,
          });
          maj(cle, {
            uploadId: init.upload_id,
            presign: init,
            presignExpireA: Date.now() + init.expires_in * 1000,
            track: init.track,
          });
        } catch (err) {
          echec(cle, 'preparation', err, 'L’envoi n’a pas pu être préparé.');
          return;
        }
      }

      // 2. Téléversement direct vers le stockage.
      f = store.current.get(cle)!;
      if (depuis !== 'finalisation') {
        const debut = Date.now();
        maj(cle, {
          etape: 'envoi',
          progression: 0,
          octetsEnvoyes: 0,
          debit: null,
          erreur: undefined,
          phaseEchec: undefined,
        });
        try {
          await uploader(f.presign!, f.file, ({ loaded, total }) => {
            const s = (Date.now() - debut) / 1000;
            maj(cle, {
              progression: total > 0 ? loaded / total : 0,
              octetsEnvoyes: loaded,
              debit: s > 0.2 ? loaded / s : null,
            });
          });
        } catch (err) {
          echec(
            cle,
            'envoi',
            err,
            'La connexion a été interrompue pendant l’envoi.',
          );
          return;
        }
      }

      // 3. Fin de l'envoi : la piste passe « en file ».
      f = store.current.get(cle)!;
      maj(cle, {
        etape: 'finalisation',
        progression: 1,
        envoyeA: Date.now(),
        erreur: undefined,
        phaseEchec: undefined,
      });
      try {
        const track = await finishUpload(f.uploadId!);
        maj(cle, {
          etape: track.status === 'encodage' ? 'encodage' : 'en_file',
          track,
        });
      } catch (err) {
        echec(
          cle,
          'finalisation',
          err,
          'Le fichier n’est pas arrivé en entier sur le serveur.',
        );
        return;
      }

      // Métadonnées communes (langue, temps, description), sans bloquer.
      const patch: UpdateTrackInput = {};
      if (m.language) patch.language = m.language;
      if (m.liturgicalSeason) patch.liturgical_season = m.liturgicalSeason;
      if (m.description) patch.description = m.description;
      if (Object.keys(patch).length && f.track) {
        void updateTrack(f.track.id, patch).catch(() => undefined);
      }
    },
    [echec, maj, uploader],
  );

  const pomper = useCallback(() => {
    const suivants = [...store.current.values()].filter(
      (f) => f.etape === 'attente',
    );
    while (actifs.current < concurrence && suivants.length) {
      const f = suivants.shift()!;
      actifs.current += 1;
      maj(f.cle, { etape: 'preparation' });
      void executer(f.cle).finally(() => {
        actifs.current -= 1;
        pomper();
      });
    }
  }, [concurrence, executer, maj]);

  // ------------------------------------------------------------ actions
  const ajouter = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const invalide = verifierFichier(file);
        const cle = nouvelleCle();
        store.current.set(cle, {
          cle,
          file,
          titre: titreDepuisNom(file.name),
          etape: invalide ? 'invalide' : 'attente',
          erreur: invalide ?? undefined,
          progression: 0,
          octetsEnvoyes: 0,
          debit: null,
        });
      });
      rendre();
      if (meta.current) pomper();
    },
    [pomper, rendre],
  );

  const retirer = useCallback(
    (cle: string) => {
      store.current.delete(cle);
      rendre();
    },
    [rendre],
  );

  const renommer = useCallback(
    (cle: string, titre: string) => maj(cle, { titre }),
    [maj],
  );

  /** Lance l'envoi de tous les fichiers en attente avec ces métadonnées. */
  const envoyer = useCallback(
    (m: MetaEnvoi) => {
      meta.current = m;
      pomper();
    },
    [pomper],
  );

  const reessayer = useCallback(
    async (cle: string) => {
      const f = store.current.get(cle);
      if (!f || f.etape !== 'echec' || !f.phaseEchec) return;
      if (f.phaseEchec === 'encodage') {
        if (!f.track) return;
        try {
          const track = await reencodeTrack(f.track.id);
          // Oublie l'ancien suivi (resté sur « échec ») avant de reprendre.
          qc.removeQueries({
            queryKey: sonoKeys.upload(f.uploadId ?? f.track.id),
          });
          maj(cle, {
            track,
            etape: track.status === 'encodage' ? 'encodage' : 'en_file',
            erreur: undefined,
            phaseEchec: undefined,
          });
        } catch (err) {
          echec(cle, 'encodage', err, 'L’encodage n’a pas pu être relancé.');
        }
        return;
      }
      actifs.current += 1;
      await executer(cle, f.phaseEchec).finally(() => {
        actifs.current -= 1;
      });
    },
    [echec, executer, maj, qc],
  );

  /** Publie toutes les pistes prêtes (chacune par `pistes/<id>/publier/`). */
  const publierPretes = useCallback(async () => {
    const pretes = [...store.current.values()].filter(
      (f) => f.etape === 'pret' && !f.publie && f.track,
    );
    for (const f of pretes) {
      try {
        await publishTrack(f.track!.id);
        maj(f.cle, { publie: true });
      } catch {
        // l'erreur est déjà notifiée par le client d'API ; la piste reste prête
      }
    }
    void qc.invalidateQueries({ queryKey: ['sonotheque', 'staff'] });
  }, [maj, qc]);

  // ------------------------------------------------------------ suivi
  const fichiers = [...store.current.values()];
  const aSuivre = fichiers.filter(
    (f) => EN_SUIVI.includes(f.etape) && f.uploadId,
  );

  const suivis = useQueries({
    queries: aSuivre.map((f) => ({
      queryKey: sonoKeys.upload(f.uploadId!),
      queryFn: () => getUpload(f.uploadId!),
      // Polling doux : l'intervalle s'allonge à chaque réponse (× 1,5), borné.
      refetchInterval: (q: {
        state: { data?: StaffTrack; dataUpdateCount: number };
      }) => {
        const s = q.state.data?.status;
        if (s === 'pret' || s === 'echec') return false;
        return Math.min(
          intervalleSuivi * 1.5 ** q.state.dataUpdateCount,
          SUIVI_MAX,
        );
      },
      refetchIntervalInBackground: false,
      staleTime: 0,
    })),
  });

  const suiviData = suivis.map((q) => q.data);
  const signatureSuivi = suiviData
    .map(
      (d) => `${d?.id}:${d?.status}:${d?.encoding_percent}:${d?.encoding_step}`,
    )
    .join('|');
  useEffect(() => {
    aSuivre.forEach((f, i) => {
      const t = suiviData[i];
      if (!t) return;
      const courant = store.current.get(f.cle);
      if (!courant || !EN_SUIVI.includes(courant.etape)) return;
      if (t.status === 'pret') {
        maj(f.cle, { etape: 'pret', track: t });
      } else if (t.status === 'echec') {
        maj(f.cle, {
          etape: 'echec',
          phaseEchec: 'encodage',
          track: t,
          erreur: t.failure_reason || 'L’encodage a échoué.',
        });
      } else if (
        t.status !== courant.track?.status ||
        t.encoding_percent !== courant.track?.encoding_percent ||
        t.encoding_step !== courant.track?.encoding_step
      ) {
        maj(f.cle, {
          etape: t.status === 'encodage' ? 'encodage' : 'en_file',
          track: t,
        });
      }
    });
    // suiviData change à chaque réponse ; aSuivre en découle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureSuivi]);

  return {
    fichiers,
    ajouter,
    retirer,
    renommer,
    envoyer,
    reessayer,
    publierPretes,
    envoiLance: meta.current !== null,
  };
}
