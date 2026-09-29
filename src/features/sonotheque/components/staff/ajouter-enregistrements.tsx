'use client';

import {
  EyeOff,
  FolderPlus,
  Globe,
  Lock,
  Send,
  UploadCloud,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/components/ui/link';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';
import { cn } from '@/utils/cn';

import { useStaffSources } from '../../api/get-staff-sources';
import { useStaffAlbums } from '../../api/staff-albums';
import type { StorageUploader } from '../../api/upload-to-storage';
import { useFileEnvoi } from '../../hooks/use-file-envoi';
import type { Visibilite } from '../../types/schemas';
import { ACCEPT_AUDIO } from '../../utils/fichiers-audio';
import {
  LIBELLES_LANGUE,
  LIBELLES_SOURCE,
  LIBELLES_TEMPS,
  pluriel,
} from '../../utils/format';

import { AlbumDialog } from './album-dialog';
import { LigneFichier } from './ligne-fichier';
import { PochetteAlbum } from './pochette-album';

const champ =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface Props {
  /** Injection pour les tests (sinon POST présigné XHR réel). */
  uploader?: StorageUploader;
  intervalleSuivi?: number;
}

export function AjouterEnregistrements({ uploader, intervalleSuivi }: Props) {
  const params = useSearchParams();
  const sources = useStaffSources();
  const [sourceId, setSourceId] = useState('');
  const [albumId, setAlbumId] = useState(params?.get('album') ?? '');
  const [langue, setLangue] = useState('');
  const [temps, setTemps] = useState('');
  const [description, setDescription] = useState('');
  const [visibilite, setVisibilite] = useState<Visibilite>('paroisse');
  const [droits, setDroits] = useState(false);
  const [tentative, setTentative] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [nouvelAlbum, setNouvelAlbum] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idDroits = useId();

  const envoi = useFileEnvoi({ uploader, intervalleSuivi });
  // Albums de la source, brouillons compris (espace staff).
  const albums = useStaffAlbums(
    { source: sourceId || undefined },
    { enabled: !!sourceId },
  );

  useEffect(() => {
    if (!sourceId && sources.data?.length) setSourceId(sources.data[0].id);
  }, [sources.data, sourceId]);

  const source = sources.data?.find((s) => s.id === sourceId);
  const album = albums.data?.find((a) => a.id === albumId);
  const paroisse = source?.node?.name ?? 'la paroisse';
  const f = envoi.fichiers;
  const compte = (etapes: string[]) =>
    f.filter((x) => etapes.includes(x.etape)).length;
  const enAttente = compte(['attente']);
  const pretes = f.filter((x) => x.etape === 'pret' && !x.publie).length;
  const resume = [
    [compte(['pret']), 'prêt', 'prêts'],
    [compte(['encodage']), 'encodage', 'encodages'],
    [compte(['en_file']), 'en file', 'en file'],
    [compte(['preparation', 'envoi', 'finalisation']), 'envoi', 'envois'],
    [compte(['echec', 'invalide']), 'échec', 'échecs'],
    [enAttente, 'en attente', 'en attente'],
  ].filter(([n]) => (n as number) > 0) as [number, string, string][];

  const erreurDroits = tentative && !droits;
  const lancer = () => {
    setTentative(true);
    if (!droits || !sourceId || enAttente === 0) return;
    envoi.envoyer({
      sourceId,
      albumId: albumId || null,
      visibility: visibilite,
      rightsConfirmed: true,
      language: langue || undefined,
      liturgicalSeason: temps || undefined,
      description: description.trim() || undefined,
    });
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
    <div>
      <nav
        aria-label="Fil d’Ariane"
        className="mb-4 text-sm text-muted-foreground"
      >
        <Link
          href={paths.app.paroisse.sonotheque.getHref()}
          className="hover:text-foreground"
        >
          Sonothèque
        </Link>
      </nav>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Ajouter des enregistrements
          </h1>
          <p className="mt-1 text-muted-foreground">
            {album ? (
              <>
                Album :{' '}
                <strong className="text-foreground">{album.title}</strong>
              </>
            ) : (
              'Sans album'
            )}
            {f.length > 0 && ` · ${pluriel(f.length, 'fichier', 'fichiers')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={paths.app.paroisse.sonotheque.getHref()}>
              Terminer plus tard
            </Link>
          </Button>
          <Button
            disabled={pretes === 0}
            onClick={() => void envoi.publierPretes()}
          >
            {pretes > 0
              ? `Publier ${pluriel(pretes, 'piste prête', 'pistes prêtes')}`
              : 'Publier'}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div
            data-testid="zone-depot"
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              envoi.ajouter(Array.from(e.dataTransfer.files));
            }}
            className={cn(
              'flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              survol
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background-surface',
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-7" aria-hidden />
            </span>
            <p className="mt-4 font-serif text-lg font-semibold">
              Glissez vos fichiers audio ici
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Plusieurs fichiers à la fois · mp3, m4a, aac, wav, flac, ogg, opus
              · 500 Mo au plus par fichier
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Choisir des fichiers
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_AUDIO}
              className="sr-only"
              aria-label="Choisir des fichiers audio"
              onChange={(e) => {
                envoi.ajouter(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
          </div>

          {f.length > 0 && (
            <Reveal appear>
              <section aria-labelledby="titre-fichiers">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="titre-fichiers"
                    className="font-serif text-xl font-semibold"
                  >
                    Fichiers
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {resume
                      .map(
                        ([n, un, plusieurs]) =>
                          `${n} ${n > 1 ? plusieurs : un}`,
                      )
                      .join(' · ')}
                  </p>
                </div>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {f.map((x) => (
                    <LigneFichier
                      key={x.cle}
                      fichier={x}
                      onRetirer={() => envoi.retirer(x.cle)}
                      onReessayer={() => void envoi.reessayer(x.cle)}
                      onRenommer={(t) => envoi.renommer(x.cle, t)}
                    />
                  ))}
                </ul>
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Chaque fichier est analysé, ramené à un volume constant puis
                  encodé en trois qualités (32, 64 et 128 kb/s) pour s’adapter à
                  la connexion des fidèles. L’original est conservé.
                </p>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-lg font-semibold">
            Informations de l’album
          </h2>

          <PochetteAlbum album={album} uploader={uploader} />

          <label className="block space-y-1.5 text-sm font-medium">
            <span>Source</span>
            <select
              className={champ}
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                setAlbumId('');
              }}
            >
              {(sources.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {LIBELLES_SOURCE[s.kind]} : {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1.5">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Album</span>
              <select
                className={champ}
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
              >
                <option value="">Sans album</option>
                {(albums.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.published_at ? a.title : `${a.title} (brouillon)`}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setNouvelAlbum(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <FolderPlus className="size-4" aria-hidden />
              Nouvel album
            </button>
          </div>
          <AlbumDialog
            open={nouvelAlbum}
            onOpenChange={setNouvelAlbum}
            sources={sources.data ?? []}
            sourceParDefaut={sourceId}
            uploader={uploader}
            onEnregistre={(a) => {
              setSourceId(a.source.id);
              setAlbumId(a.id);
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Langue</span>
              <select
                className={champ}
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
              >
                <option value="">Non précisée</option>
                {Object.entries(LIBELLES_LANGUE).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Temps liturgique</span>
              <select
                className={champ}
                value={temps}
                onChange={(e) => setTemps(e.target.value)}
              >
                <option value="">Aucun</option>
                {Object.entries(LIBELLES_TEMPS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            <label htmlFor="envoi-description" className="block">
              Description
            </label>
            <Textarea
              id="envoi-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Messe de 9 h 30, homélie du Père Emmanuel Tine."
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Qui peut écouter ?
            </legend>
            <div className="space-y-2">
              {VISIBILITES.map(({ v, titre, aide, Icone }) => (
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
                    name="visibilite"
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
                    <span className="block font-medium">{titre}</span>
                    <span className="block text-muted-foreground">{aide}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div
            className={cn(
              'rounded-xl border p-3',
              erreurDroits
                ? 'border-destructive bg-destructive/5'
                : 'border-border',
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={idDroits}
                checked={droits}
                onCheckedChange={(c) => setDroits(c === true)}
                aria-required="true"
                aria-invalid={erreurDroits || undefined}
                aria-describedby={`${idDroits}-aide`}
                className="mt-0.5"
              />
              <label htmlFor={idDroits} className="text-sm">
                <span className="font-medium">
                  Je confirme disposer des droits de diffusion
                </span>{' '}
                de ces enregistrements : chants, textes et interprétation.{' '}
                <span className="text-xs font-semibold text-muted-foreground">
                  Obligatoire
                </span>
              </label>
            </div>
            <p
              id={`${idDroits}-aide`}
              className={cn(
                'mt-2 pl-7 text-[13px]',
                erreurDroits
                  ? 'font-medium text-destructive'
                  : 'text-muted-foreground',
              )}
              role={erreurDroits ? 'alert' : undefined}
            >
              {erreurDroits ? 'Cochez cette case pour envoyer. ' : ''}
              Pour un chant protégé, vérifiez l’accord de l’auteur ou de son
              éditeur.
            </p>
          </div>

          <Button
            fullWidth
            disabled={enAttente === 0 || !sourceId}
            onClick={lancer}
            icon={<Send className="size-4" aria-hidden />}
          >
            {enAttente > 0
              ? `Envoyer ${pluriel(enAttente, 'fichier', 'fichiers')}`
              : 'Envoyer'}
          </Button>
        </aside>
      </div>
    </div>
  );
}
