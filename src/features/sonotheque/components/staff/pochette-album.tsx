'use client';

import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { Icon } from '@/components/ui/icon';

import {
  ACCEPT_POCHETTE,
  useEnvoyerPochette,
  verifierPochette,
} from '../../api/staff-albums';
import type { StorageUploader } from '../../api/upload-to-storage';
import type { AlbumKind, StaffAlbum } from '../../types/schemas';
import { messageErreur } from '../../utils/erreurs';
import { Pochette } from '../pochette';

/** Aperçu local d'un fichier image, libéré au démontage. */
export function useApercu(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

interface Props {
  /** Album existant : l'image part tout de suite (POST présigné + terminer). */
  album?: Pick<StaffAlbum, 'id' | 'title' | 'kind' | 'cover_url'> | null;
  /** Album à créer : l'image est gardée et envoyée après la création. */
  enAttente?: { titre: string; kind: AlbumKind };
  fichier?: File | null;
  onFichier?: (f: File | null) => void;
  uploader?: StorageUploader;
  onEnvoyee?: (a: StaffAlbum) => void;
}

/**
 * Pochette d'un album (maquette WEB-PAR-Audio-Upload) : JPG, PNG ou WebP,
 * 5 Mo au plus, envoyée au stockage par POST présigné puis vérifiée par
 * `pochette/terminer/`.
 */
export function PochetteAlbum({
  album,
  enAttente,
  fichier = null,
  onFichier,
  uploader,
  onEnvoyee,
}: Props) {
  const id = useId();
  const envoi = useEnvoyerPochette(uploader);
  const [local, setLocal] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const apercu = useApercu(album ? local : fichier);
  const imageUrl = apercu ?? album?.cover_url ?? null;
  const titre = album?.title ?? enAttente?.titre ?? 'Album';
  const genre = album?.kind ?? enAttente?.kind ?? 'album';
  const inactif = !album && !enAttente;

  const choisir = (f: File | undefined) => {
    if (!f) return;
    const invalide = verifierPochette(f);
    setErreur(invalide);
    if (invalide) return;
    if (!album) {
      onFichier?.(f);
      return;
    }
    setLocal(f);
    envoi.mutate(
      { albumId: album.id, file: f },
      {
        onSuccess: (a) => {
          setLocal(null);
          onEnvoyee?.(a);
        },
        onError: (err) => {
          setLocal(null);
          setErreur(messageErreur(err, 'La pochette n’a pas pu être envoyée.'));
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Pochette
          titre={titre}
          genre={genre}
          imageUrl={imageUrl}
          className="size-20 rounded-xl"
        />
        {envoi.isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-paper">
            <Icon
              name="chargement"
              size={20}
              className="animate-jb-spin text-ink-3"
              label="Envoi de la pochette"
            />
          </span>
        )}
      </div>
      <div className="min-w-0 text-14">
        <p className="font-medium">Pochette</p>
        <p className="text-ink-3">
          {inactif
            ? 'Choisissez ou créez un album pour lui donner une pochette.'
            : 'JPG, PNG ou WebP carré, 1 400 px conseillés, 5 Mo au plus'}
        </p>
        {!inactif && (
          <label
            htmlFor={id}
            className="mt-1 inline-flex cursor-pointer items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ImagePlus className="size-4" aria-hidden />
            {envoi.isPending
              ? 'Envoi de la pochette…'
              : imageUrl
                ? 'Remplacer l’image'
                : 'Choisir une image'}
          </label>
        )}
        <input
          id={id}
          type="file"
          accept={ACCEPT_POCHETTE}
          className="sr-only"
          disabled={inactif || envoi.isPending}
          aria-label="Choisir une pochette"
          onChange={(e) => {
            choisir(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {erreur && (
          <p role="alert" className="mt-1 text-err">
            {erreur}
          </p>
        )}
        {envoi.isSuccess && !erreur && (
          <p className="mt-1 text-ok" aria-live="polite">
            Pochette enregistrée.
          </p>
        )}
      </div>
    </div>
  );
}
