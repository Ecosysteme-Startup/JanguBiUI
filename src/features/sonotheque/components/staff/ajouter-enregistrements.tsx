'use client';

import { FolderPlus, UploadCloud } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Choice } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
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
  'h-10 w-full rounded-lg border border-line-field bg-paper px-3 text-14 text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary';

interface Props {
  /** Paroisse de l'espace (liens de retour). */
  nodeId: string;
  /** Injection pour les tests (sinon POST présigné XHR réel). */
  uploader?: StorageUploader;
  intervalleSuivi?: number;
}

export function AjouterEnregistrements({
  nodeId,
  uploader,
  intervalleSuivi,
}: Props) {
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
    <div>
      <nav aria-label="Fil d’Ariane" className="mb-4 text-14 text-ink-3">
        <NextLink
          href={paths.espace.sonotheque.root.getHref(nodeId)}
          className="hover:text-ink"
        >
          Sonothèque
        </NextLink>
      </nav>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-32 font-semibold text-ink">
            Ajouter des enregistrements
          </h1>
          <p className="mt-1 text-ink-3">
            {album ? (
              <>
                Album : <strong className="text-ink">{album.title}</strong>
              </>
            ) : (
              'Sans album'
            )}
            {f.length > 0 && ` · ${pluriel(f.length, 'fichier', 'fichiers')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <NextLink href={paths.espace.sonotheque.root.getHref(nodeId)}>
              Terminer plus tard
            </NextLink>
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
              'flex flex-col items-center rounded-16 border-2 border-dashed px-6 py-10 text-center transition-colors',
              survol ? 'border-primary bg-tint-50' : 'border-line bg-surface',
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-tint-50 text-primary">
              <UploadCloud className="size-7" aria-hidden />
            </span>
            <p className="mt-4 text-18 font-semibold">
              Glissez vos fichiers audio ici
            </p>
            <p className="mt-1 max-w-md text-14 text-ink-3">
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
                  <h2 id="titre-fichiers" className="text-20 font-semibold">
                    Fichiers
                  </h2>
                  <p className="text-14 text-ink-3">
                    {resume
                      .map(
                        ([n, un, plusieurs]) =>
                          `${n} ${n > 1 ? plusieurs : un}`,
                      )
                      .join(' · ')}
                  </p>
                </div>
                <ul className="divide-y divide-line overflow-hidden rounded-16 border border-line bg-surface">
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
                <p className="mt-3 text-13 text-ink-3">
                  Chaque fichier est analysé, ramené à un volume constant puis
                  encodé en trois qualités (32, 64 et 128 kb/s) pour s’adapter à
                  la connexion des fidèles. L’original est conservé.
                </p>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="space-y-6 rounded-16 border border-line bg-surface p-5">
          <h2 className="text-18 font-semibold">Informations de l’album</h2>

          <PochetteAlbum album={album} uploader={uploader} />

          <label className="block space-y-1.5 text-14 font-medium">
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
            <label className="block space-y-1.5 text-14 font-medium">
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
              className="inline-flex items-center gap-1.5 text-14 font-medium text-primary hover:underline"
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
            <label className="block space-y-1.5 text-14 font-medium">
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
            <label className="block space-y-1.5 text-14 font-medium">
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

          <div className="space-y-1.5 text-14 font-medium">
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
            <legend className="mb-2 text-14 font-medium">
              Qui peut écouter ?
            </legend>
            <div className="flex flex-col gap-2">
              {VISIBILITES.map(({ v, titre, aide }) => (
                <Choice
                  key={v}
                  type="radio"
                  variant="card"
                  name="visibilite"
                  value={v}
                  checked={visibilite === v}
                  onChange={() => setVisibilite(v)}
                  label={titre}
                  description={aide}
                />
              ))}
            </div>
          </fieldset>

          <div
            className={cn(
              'rounded-xl border p-3',
              erreurDroits ? 'border-err bg-err-bg' : 'border-line',
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={idDroits}
                label="Je confirme disposer des droits de diffusion de ces enregistrements"
                checked={droits}
                onChange={(e) => setDroits(e.target.checked)}
                aria-required="true"
                aria-invalid={erreurDroits || undefined}
                aria-describedby={`${idDroits}-aide`}
                className="mt-0.5"
              />
              <label htmlFor={idDroits} className="text-14">
                <span className="font-medium">
                  Je confirme disposer des droits de diffusion
                </span>{' '}
                de ces enregistrements : chants, textes et interprétation.{' '}
                <span className="text-13 font-semibold text-ink-3">
                  Obligatoire
                </span>
              </label>
            </div>
            <p
              id={`${idDroits}-aide`}
              className={cn(
                'mt-2 pl-7 text-13',
                erreurDroits ? 'font-medium text-err' : 'text-ink-3',
              )}
              role={erreurDroits ? 'alert' : undefined}
            >
              {erreurDroits ? 'Cochez cette case pour envoyer. ' : ''}
              Pour un chant protégé, vérifiez l’accord de l’auteur ou de son
              éditeur.
            </p>
          </div>

          <Button
            block
            disabled={enAttente === 0 || !sourceId}
            onClick={lancer}
          >
            <Icon name="envoyer" className="size-4" aria-hidden />
            {enAttente > 0
              ? `Envoyer ${pluriel(enAttente, 'fichier', 'fichiers')}`
              : 'Envoyer'}
          </Button>
        </aside>
      </div>
    </div>
  );
}
