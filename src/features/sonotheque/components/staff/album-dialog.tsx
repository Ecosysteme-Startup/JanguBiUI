'use client';

import { EyeOff, Globe, Lock } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';

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

const champ =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Monté à chaque ouverture : le formulaire repart des valeurs de l'album. */}
        {open && <AlbumForm onOpenChange={onOpenChange} {...props} />}
      </DialogContent>
    </Dialog>
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

  const VISIBILITES: {
    v: Visibilite;
    titre: string;
    aide: string;
    Icone: typeof Globe;
  }[] = [
    {
      v: 'public',
      titre: 'Public',
      aide: 'Tout le monde, même sans compte',
      Icone: Globe,
    },
    {
      v: 'paroisse',
      titre: `Paroissiens de ${paroisse}`,
      aide: 'Fidèles rattachés à la paroisse',
      Icone: Lock,
    },
    {
      v: 'prive',
      titre: 'Privé',
      aide: 'Brouillon visible par l’équipe',
      Icone: EyeOff,
    },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {creation ? 'Nouvel album' : 'Modifier l’album'}
        </DialogTitle>
        <DialogDescription>
          {creation
            ? 'L’album reste en brouillon jusqu’à sa publication.'
            : album?.published_at
              ? 'Changer la visibilité s’applique aussi à ses pistes.'
              : 'Brouillon : l’album n’est pas encore publié.'}
        </DialogDescription>
      </DialogHeader>
      <form
        id={idForm}
        className="space-y-4"
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
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Source</span>
            <select
              className={champ}
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {LIBELLES_SOURCE[s.kind]} : {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1.5 text-sm font-medium">
          <span>Titre de l’album</span>
          <input
            className={champ}
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Messe du 27 septembre 2026"
            maxLength={200}
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium">
          <span>Type</span>
          <select
            className={champ}
            value={kind}
            onChange={(e) => setKind(e.target.value as AlbumKind)}
          >
            {ALBUM_KINDS.map((k) => (
              <option key={k} value={k}>
                {TYPES_ALBUM[k]}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Qui peut écouter ?
          </legend>
          <div className="space-y-2">
            {VISIBILITES.map(({ v, titre: t, aide, Icone }) => (
              <label
                key={v}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm',
                  visibilite === v
                    ? 'border-primary bg-primary/5'
                    : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name={`${idForm}-visibilite`}
                  value={v}
                  checked={visibilite === v}
                  onChange={() => setVisibilite(v)}
                  className="mt-1 accent-[hsl(var(--primary))]"
                />
                <Icone
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span>
                  <span className="block font-medium">{t}</span>
                  <span className="block text-muted-foreground">{aide}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5 text-sm font-medium">
          <label htmlFor={`${idForm}-description`} className="block">
            Description
          </label>
          <Textarea
            id={`${idForm}-description`}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Messe de 9 h 30, homélie du Père Emmanuel Tine."
          />
        </div>

        {erreur && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erreur}
          </p>
        )}
      </form>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={enCours}
        >
          Annuler
        </Button>
        <Button type="submit" form={idForm} isLoading={enCours}>
          {creation ? 'Créer l’album' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </>
  );
}
