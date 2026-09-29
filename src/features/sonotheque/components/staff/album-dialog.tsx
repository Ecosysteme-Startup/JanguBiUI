'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  envoyerPochette,
  useCreateStaffAlbum,
  useUpdateStaffAlbum,
} from '../../api/staff-albums';
import type { StorageUploader } from '../../api/upload-to-storage';
import {
  ALBUM_KINDS,
  type AlbumKind,
  type Source,
  type StaffAlbum,
  type Visibilite,
} from '../../types/schemas';
import { messageErreur } from '../../utils/erreurs';
import { LIBELLES_SOURCE } from '../../utils/format';

import { PochetteAlbum } from './pochette-album';

/** Types d'album, dans les mots des fidèles. */
export const TYPES_ALBUM: Record<AlbumKind, string> = {
  messe: 'Messe',
  homelies: 'Homélies',
  album: 'Chants',
  retraite: 'Enseignements, retraite',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Album à modifier ; absent : création. */
  album?: StaffAlbum | null;
  /** Sources où l'on peut publier (création). */
  sources: Source[];
  sourceParDefaut?: string;
  uploader?: StorageUploader;
  onEnregistre?: (a: StaffAlbum) => void;
}

/**
 * Création ou modification d'un album (titre, type, visibilité, description,
 * pochette). Un album naît non publié ; la publication reste un geste à part.
 */
export function AlbumDialog({ open, onOpenChange, ...props }: Props) {
  const creation = !props.album;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="form"
      title={creation ? 'Nouvel album' : 'Modifier l’album'}
      description={
        creation
          ? 'L’album reste en brouillon jusqu’à sa publication.'
          : props.album?.published_at
            ? 'Changer la visibilité s’applique aussi à ses pistes.'
            : 'Brouillon : l’album n’est pas encore publié.'
      }
    >
      {/* Monté à chaque ouverture : le formulaire repart des valeurs de l'album. */}
      {open && <AlbumForm onOpenChange={onOpenChange} {...props} />}
    </Modal>
  );
}

function AlbumForm({
  onOpenChange,
  album,
  sources,
  sourceParDefaut,
  uploader,
  onEnregistre,
}: Omit<Props, 'open'>) {
  const creation = !album;
  const idForm = useId();
  const [sourceId, setSourceId] = useState(
    album?.source.id ?? sourceParDefaut ?? sources[0]?.id ?? '',
  );
  const [titre, setTitre] = useState(album?.title ?? '');
  const [kind, setKind] = useState<AlbumKind>(album?.kind ?? 'messe');
  const [visibilite, setVisibilite] = useState<Visibilite>(
    album?.visibility ?? 'paroisse',
  );
  const [description, setDescription] = useState(album?.description ?? '');
  const [pochette, setPochette] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiPochette, setEnvoiPochette] = useState(false);
  const creer = useCreateStaffAlbum();
  const modifier = useUpdateStaffAlbum();

  const source = sources.find((s) => s.id === sourceId);
  const paroisse = source?.node?.name ?? 'la paroisse';
  const enCours = creer.isPending || modifier.isPending || envoiPochette;

  const enregistrer = async () => {
    setErreur(null);
    const t = titre.trim();
    if (!t) {
      setErreur('Donnez un titre à l’album.');
      return;
    }
    const input = {
      title: t,
      kind,
      visibility: visibilite,
      description: description.trim(),
    };
    try {
      let a = album
        ? await modifier.mutateAsync({ id: album.id, input })
        : await creer.mutateAsync({ ...input, source_id: sourceId });
      if (pochette) {
        setEnvoiPochette(true);
        try {
          a = await envoyerPochette(a.id, pochette, { uploader });
        } catch (err) {
          // L'album existe : on le garde, la pochette pourra être renvoyée.
          onEnregistre?.(a);
          setErreur(
            `L’album est enregistré, mais la pochette n’a pas pu être envoyée : ${messageErreur(err, 'réessayez').replace(/\.$/, '').toLowerCase()}.`,
          );
          return;
        } finally {
          setEnvoiPochette(false);
        }
      }
      onEnregistre?.(a);
      onOpenChange(false);
    } catch (err) {
      setErreur(messageErreur(err, 'L’album n’a pas pu être enregistré.'));
    }
  };

  const VISIBILITES: { v: Visibilite; titre: string; aide: string }[] = [
    { v: 'public', titre: 'Public', aide: 'Tout le monde, même sans compte' },
    {
      v: 'paroisse',
      titre: `Paroissiens de ${paroisse}`,
      aide: 'Fidèles rattachés à la paroisse',
    },
    { v: 'prive', titre: 'Privé', aide: 'Brouillon visible par l’équipe' },
  ];

  return (
    <form
      id={idForm}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void enregistrer();
      }}
    >
      <PochetteAlbum
        album={album}
        enAttente={creation ? { titre: titre || 'Album', kind } : undefined}
        fichier={pochette}
        onFichier={setPochette}
        uploader={uploader}
        onEnvoyee={onEnregistre}
      />

      {creation && sources.length > 1 && (
        <Field id={`${idForm}-source`} label="Source">
          <Select
            controlSize="sm"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {LIBELLES_SOURCE[s.kind]} : {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field id={`${idForm}-titre`} label="Titre de l’album">
        <Input
          controlSize="sm"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Messe du 27 septembre 2026"
          maxLength={200}
        />
      </Field>

      <Field id={`${idForm}-type`} label="Type">
        <Select
          controlSize="sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as AlbumKind)}
        >
          {ALBUM_KINDS.map((k) => (
            <option key={k} value={k}>
              {TYPES_ALBUM[k]}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-14 font-medium text-ink">
          Qui peut écouter ?
        </legend>
        <div className="flex flex-col gap-2">
          {VISIBILITES.map(({ v, titre: t, aide }) => (
            <Choice
              key={v}
              type="radio"
              variant="card"
              name={`${idForm}-visibilite`}
              value={v}
              checked={visibilite === v}
              onChange={() => setVisibilite(v)}
              label={t}
              description={aide}
            />
          ))}
        </div>
      </fieldset>

      <Field id={`${idForm}-description`} label="Description" optional>
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Messe de 9 h 30, homélie du Père Emmanuel Tine."
        />
      </Field>

      {erreur && (
        <p role="alert" className="m-0 text-14 font-medium text-err">
          {erreur}
        </p>
      )}
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={enCours}
        >
          Annuler
        </Button>
        <Button type="submit" loading={enCours}>
          {creation ? 'Créer l’album' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </form>
  );
}
