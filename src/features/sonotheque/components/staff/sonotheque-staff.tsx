'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Link } from '@/components/ui/link';
import { SkeletonList } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/paths';
import { Reveal } from '@/lib/motion/reveal';

import { getSourceQueryOptions } from '../../api/get-source';
import { useStaffSources } from '../../api/get-staff-sources';
import { useStaffTracksForSources } from '../../api/get-staff-tracks';
import { reencodeTrack } from '../../api/uploads';
import type { StaffTrack, Visibilite } from '../../types/schemas';
import {
  codeLangue,
  compareFr,
  formatDuree,
  formatMisAJour,
  LIBELLES_ALBUM,
  LIBELLES_SOURCE,
  LIBELLES_VISIBILITE,
  pluriel,
} from '../../utils/format';
import { VisibiliteBadge } from '../visibilite-badge';

import { EtatPiste } from './etat-piste';

const PAR_PAGE = 12;

const FILTRES_ETAT: { value: string; label: string; etats: string[] }[] = [
  { value: 'toutes', label: 'Toutes', etats: [] },
  { value: 'pretes', label: 'Prêtes', etats: ['pret'] },
  { value: 'en_cours', label: 'En cours', etats: ['en_file', 'encodage'] },
  { value: 'brouillons', label: 'Brouillons', etats: ['brouillon'] },
  { value: 'echec', label: 'Échec', etats: ['echec'] },
];

const selectCls =
  'h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const dateMaj = (t: StaffTrack) =>
  t.updated_at ?? t.encoded_at ?? t.created_at ?? t.published_at;

export function SonothequeStaff() {
  const qc = useQueryClient();
  const sources = useStaffSources();
  const ids = useMemo(
    () => (sources.data ?? []).map((s) => s.id),
    [sources.data],
  );
  const pistes = useStaffTracksForSources(ids);
  const details = useQueries({
    queries: ids.map((id) => getSourceQueryOptions(id)),
  });

  const [etat, setEtat] = useState('toutes');
  const [visibilite, setVisibilite] = useState<'' | Visibilite>('');
  const [texte, setTexte] = useState('');
  const [page, setPage] = useState(0);

  const relancer = useMutation({
    mutationFn: reencodeTrack,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['sonotheque', 'staff', 'pistes'] }),
  });

  const toutes = useMemo(
    () =>
      [...pistes.data].sort((a, b) =>
        (dateMaj(b) ?? '').localeCompare(dateMaj(a) ?? ''),
      ),
    [pistes.data],
  );
  const filtreEtat = FILTRES_ETAT.find((f) => f.value === etat)!;
  const q = texte.trim().toLowerCase();
  const filtrees = toutes.filter(
    (t) =>
      (!filtreEtat.etats.length || filtreEtat.etats.includes(t.status)) &&
      (!visibilite || t.visibility === visibilite) &&
      (!q ||
        [t.title, t.album?.title ?? '', t.source.name].some((s) =>
          s.toLowerCase().includes(q),
        )),
  );
  const pages = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const pageCourante = Math.min(page, pages - 1);
  const visibles = filtrees.slice(
    pageCourante * PAR_PAGE,
    (pageCourante + 1) * PAR_PAGE,
  );
  const echecs = toutes.filter((t) => t.status === 'echec');
  const albums = details.flatMap((d) => d.data?.albums ?? []);
  const playlists = details.flatMap((d) => d.data?.playlists ?? []);
  const paroisse =
    sources.data?.find((s) => s.node)?.node?.name ?? 'la paroisse';

  // Écoutes internes à la paroisse (30 jours), jamais comparées à d'autres
  // paroisses. Le contrat B3 n'expose pas encore ce compteur (`plays_30d`
  // facultatif) : sans lui, on n'affiche pas de classement.
  const avecEcoutes = toutes.filter((t) => (t.plays_30d ?? 0) > 0);
  const plusEcoutes = [...avecEcoutes]
    .sort((a, b) => (b.plays_30d ?? 0) - (a.plays_30d ?? 0))
    .slice(0, 5);

  if (sources.isLoading) return <SkeletonList count={8} />;
  if (sources.isError)
    return (
      <ErrorState
        description="La sonothèque n’a pas pu être chargée."
        onRetry={() => void sources.refetch()}
      />
    );
  if (!sources.data?.length) {
    return (
      <EmptyState
        title="Aucune source où publier"
        description="Votre compte n’a pas encore de source (paroisse, chorale ou mouvement) sur laquelle publier. Le curé ou le secrétariat peut vous l’ouvrir."
      />
    );
  }

  const compteEtat = (f: (typeof FILTRES_ETAT)[number]) =>
    f.etats.length
      ? toutes.filter((t) => f.etats.includes(t.status)).length
      : toutes.length;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{paroisse}</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Sonothèque
          </h1>
          <p className="mt-1 text-muted-foreground">
            {sources.data.map((s) => s.name).join(', ')}.
          </p>
        </div>
        <Button asChild>
          <Link href={paths.app.paroisse.sonothequeAjouter.getHref()}>
            <Plus className="size-4" aria-hidden />
            Ajouter des enregistrements
          </Link>
        </Button>
      </div>

      {echecs.length > 0 && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center"
        >
          <AlertTriangle
            className="size-5 shrink-0 text-destructive"
            aria-hidden
          />
          <p className="flex-1 text-sm">
            <strong>{echecs[0].title}</strong>
            {echecs[0].album ? ` (${echecs[0].album.title})` : ''} n’a pas pu
            être encodé
            {echecs[0].failure_reason
              ? ` : ${echecs[0].failure_reason.replace(/\.$/, '').toLowerCase()}`
              : ''}
            .
            {echecs.length > 1 &&
              ` ${pluriel(echecs.length - 1, 'autre piste est', 'autres pistes sont')} aussi en échec.`}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEtat('echec');
                setPage(0);
              }}
            >
              Voir le détail
            </Button>
            <Button
              size="sm"
              isLoading={relancer.isPending}
              onClick={() => relancer.mutate(echecs[0].id)}
              icon={<RotateCcw className="size-3.5" aria-hidden />}
            >
              Réessayer
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <Tabs defaultValue="pistes" className="min-w-0">
          <TabsList>
            <TabsTrigger value="pistes">Pistes {toutes.length}</TabsTrigger>
            <TabsTrigger value="albums">Albums {albums.length}</TabsTrigger>
            <TabsTrigger value="playlists">
              Playlists {playlists.length}
            </TabsTrigger>
            <TabsTrigger value="sources">
              Sources {sources.data.length}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pistes" className="mt-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <FilterPills
                ariaLabel="État des pistes"
                options={FILTRES_ETAT.map((f) => ({
                  value: f.value,
                  label: f.label,
                  count: compteEtat(f),
                }))}
                value={etat}
                onChange={(v) => {
                  setEtat(v);
                  setPage(0);
                }}
              />
              <div className="flex gap-2">
                <select
                  aria-label="Visibilité"
                  className={selectCls}
                  value={visibilite}
                  onChange={(e) => {
                    setVisibilite(e.target.value as '' | Visibilite);
                    setPage(0);
                  }}
                >
                  <option value="">Toutes visibilités</option>
                  {(['public', 'paroisse', 'prive'] as const).map((v) => (
                    <option key={v} value={v}>
                      {LIBELLES_VISIBILITE[v]}
                    </option>
                  ))}
                </select>
                <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-2.5 text-muted-foreground">
                  <Search className="size-4" aria-hidden />
                  <input
                    type="search"
                    value={texte}
                    onChange={(e) => {
                      setTexte(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Titre, album et source"
                    aria-label="Filtrer par titre, album et source"
                    className="w-40 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>
              </div>
            </div>

            {pistes.isLoading ? (
              <SkeletonList count={6} className="mt-4" />
            ) : filtrees.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Aucune piste ne correspond à ces filtres.
              </p>
            ) : (
              <Reveal appear className="mt-4">
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table
                    className="w-full min-w-[760px] text-sm"
                    aria-label="Pistes de la sonothèque"
                  >
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="px-4 py-3">
                          Titre, album et source
                        </th>
                        <th scope="col" className="py-3 pr-3">
                          Langue
                        </th>
                        <th scope="col" className="py-3 pr-3 text-right">
                          Durée
                        </th>
                        <th scope="col" className="py-3 pr-3">
                          Visibilité
                        </th>
                        <th scope="col" className="py-3 pr-3">
                          État
                        </th>
                        <th
                          scope="col"
                          className="py-3 pr-3 text-right"
                          title="Écoutes des 30 derniers jours, internes à la paroisse"
                        >
                          Écoutes 30 j
                        </th>
                        <th scope="col" className="py-3 pr-4">
                          Mis à jour
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((t) => (
                        <tr
                          key={t.id}
                          data-statut={t.status}
                          className="border-b border-border last:border-0 hover:bg-background-surface"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {t.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.album ? `${t.album.title} · ` : ''}
                              {t.source.name}
                            </p>
                            {t.status === 'echec' && t.failure_reason && (
                              <p className="mt-0.5 text-xs text-destructive">
                                {t.failure_reason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-xs font-semibold text-muted-foreground">
                            {codeLangue(t.language)}
                          </td>
                          <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                            {t.status === 'pret'
                              ? formatDuree(t.duration_seconds)
                              : '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <VisibiliteBadge visibilite={t.visibility} />
                          </td>
                          <td className="py-3 pr-3">
                            <EtatPiste
                              etat={t.status}
                              pourcent={
                                t.status === 'encodage'
                                  ? t.encoding_percent
                                  : null
                              }
                            />
                          </td>
                          <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                            {t.plays_30d != null && t.status === 'pret'
                              ? t.plays_30d
                              : '—'}
                          </td>
                          <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                            {formatMisAJour(dateMaj(t))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {visibles.length} piste{visibles.length > 1 ? 's' : ''} sur{' '}
                    {filtrees.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pageCourante === 0}
                      onClick={() => setPage(pageCourante - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pageCourante >= pages - 1}
                      onClick={() => setPage(pageCourante + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </Reveal>
            )}
          </TabsContent>

          <TabsContent value="albums" className="mt-5">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {[...albums]
                .sort((a, b) => compareFr(a.title, b.title))
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {LIBELLES_ALBUM[a.kind]} · {a.source.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <VisibiliteBadge visibilite={a.visibility} />
                      <Link
                        href={paths.app.paroisse.sonothequeAjouter.getHref(
                          a.id,
                        )}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ajouter des pistes
                      </Link>
                    </div>
                  </li>
                ))}
              {!albums.length && (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  Aucun album publié.
                </li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="playlists" className="mt-5">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {playlists.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {pluriel(p.track_count, 'titre', 'titres')}
                      {p.source ? ` · ${p.source.name}` : ''}
                    </p>
                  </div>
                  <VisibiliteBadge visibilite={p.visibility} />
                </li>
              ))}
              {!playlists.length && (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  Aucune playlist publiée.
                </li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="sources" className="mt-5">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {sources.data.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {LIBELLES_SOURCE[s.kind]}
                    {s.description ? ` · ${s.description}` : ''}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Sources présentées par ordre alphabétique.
            </p>
          </TabsContent>
        </Tabs>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-serif text-lg font-semibold">
              Les plus écoutés à {paroisse}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              30 derniers jours · enregistrements de la paroisse et de ses
              groupes uniquement
            </p>
            {plusEcoutes.length ? (
              <ol className="mt-3 space-y-2">
                {plusEcoutes.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {t.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.source.name}
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {t.plays_30d}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Les écoutes apparaîtront ici au fil des semaines.
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 text-sm">
            <h2 className="font-serif text-lg font-semibold">
              Règles de publication
            </h2>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Public</strong> : tout le
                monde, même sans compte.
              </li>
              <li>
                <strong className="text-foreground">Paroissiens</strong> :
                fidèles rattachés à {paroisse}.
              </li>
              <li>
                <strong className="text-foreground">Privé</strong> : brouillon
                visible par l’équipe seulement.
              </li>
              <li>
                Chaque envoi demande de confirmer les droits de diffusion.
              </li>
              <li>
                Les écoutes ne sont jamais comparées à celles d’autres
                paroisses.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
