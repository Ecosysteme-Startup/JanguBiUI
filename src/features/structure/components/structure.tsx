'use client';

import { ChevronRight, ListTree, Plus } from 'lucide-react';
import { useId, useState } from 'react';

import { AucunNoeud, useNoeudActif } from '@/components/staff/noeud-actif';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ApiError } from '@/lib/api-client';

import {
  LIBELLES_STATUT_NOEUD,
  type Noeud,
  useAncetres,
  useCreerNoeud,
  useEnfants,
  useModifierNoeud,
  useNoeud,
  useTypesNoeud,
} from '../api/hierarchie';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

function FormulaireNoeud({
  titre,
  parent,
  noeud,
  onClose,
}: {
  titre: string;
  parent?: Noeud;
  noeud?: Noeud;
  onClose: () => void;
}) {
  const id = useId();
  const { data: types = [] } = useTypesNoeud();
  const possibles = parent
    ? types.filter((t) => t.allowed_parent_types.includes(parent.type.code))
    : [];
  const [type, setType] = useState('');
  const [nom, setNom] = useState(noeud?.name ?? '');
  const [ville, setVille] = useState(noeud?.city ?? '');
  const [statut, setStatut] = useState(noeud?.status ?? 'erige');
  const [actif, setActif] = useState(noeud?.is_active_on_platform ?? false);
  const creer = useCreerNoeud();
  const modifier = useModifierNoeud();
  const erreur = (creer.error ?? modifier.error) as unknown;
  const typeChoisi = type || possibles[0]?.code || '';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fini = { onSuccess: onClose };
            if (noeud)
              modifier.mutate(
                {
                  id: noeud.id,
                  name: nom,
                  city: ville,
                  status: statut,
                  is_active_on_platform: actif,
                },
                fini,
              );
            else if (parent)
              creer.mutate(
                { type: typeChoisi, name: nom, city: ville, parent_id: parent.id },
                fini,
              );
          }}
        >
          {!noeud && (
            <div>
              <label htmlFor={`${id}-t`} className="text-sm font-medium">
                Type
              </label>
              <select
                id={`${id}-t`}
                value={typeChoisi}
                onChange={(e) => setType(e.target.value)}
                className={champ}
              >
                {possibles.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor={`${id}-n`} className="text-sm font-medium">
              Nom
            </label>
            <input
              id={`${id}-n`}
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className={champ}
            />
          </div>
          <div>
            <label htmlFor={`${id}-v`} className="text-sm font-medium">
              Ville
            </label>
            <input
              id={`${id}-v`}
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className={champ}
            />
          </div>
          {noeud && (
            <>
              <div>
                <label htmlFor={`${id}-s`} className="text-sm font-medium">
                  Statut
                </label>
                <select
                  id={`${id}-s`}
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className={champ}
                >
                  {Object.entries(LIBELLES_STATUT_NOEUD).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                />
                Ouvert sur Jàngu Bi
              </label>
            </>
          )}
          {erreur instanceof ApiError && (
            <p role="alert" className="text-sm text-destructive">
              {erreur.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={creer.isPending || modifier.isPending}
              disabled={!noeud && !typeChoisi}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Arborescence du diocèse (`/v1/hierarchy/nodes/…`), capacité structure.gerer. */
export function Structure() {
  const { noeud: racine, isLoading } = useNoeudActif('structure.gerer');
  const [courantId, setCourantId] = useState<string | null>(null);
  const id = courantId ?? racine?.id ?? null;
  const { data: courant } = useNoeud(id);
  const { data: ancetres = [] } = useAncetres(id);
  const { data: enfants, isLoading: chargement } = useEnfants(id);
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState<Noeud | null>(null);

  if (isLoading) return null;
  if (!racine) return <AucunNoeud quoi="la gestion de la structure" />;

  // Le fil d'Ariane ne remonte pas au-dessus du nœud de la nomination.
  const debut = ancetres.findIndex((a) => a.id === racine.id);
  const fil = debut >= 0 ? ancetres.slice(debut) : [];

  const colonnes: DataTableColumn<Noeud>[] = [
    {
      header: 'Nom',
      cell: (n) =>
        n.has_children ? (
          <button
            type="button"
            onClick={() => setCourantId(n.id)}
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            {n.name}
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="font-medium">{n.name}</span>
        ),
    },
    { header: 'Type', cell: (n) => n.type.label },
    { header: 'Ville', cell: (n) => n.city || '—', hideOnMobile: true },
    {
      header: 'Statut',
      cell: (n) => (
        <span className="inline-flex flex-wrap gap-1">
          <Badge variant="outline">
            {LIBELLES_STATUT_NOEUD[n.status] ?? n.status}
          </Badge>
          {n.is_active_on_platform && (
            <Badge variant="success">Sur Jàngu Bi</Badge>
          )}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (n) => (
        <Button size="sm" variant="ghost" onClick={() => setEdition(n)}>
          Modifier
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="Fil de la structure">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {[...fil, ...(courant && !fil.some((a) => a.id === courant.id) ? [courant] : [])].map(
            (a, i, liste) => (
              <li key={a.id} className="inline-flex items-center gap-1">
                {i < liste.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCourantId(a.id)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {a.name}
                  </button>
                ) : (
                  <span aria-current="page" className="font-semibold">
                    {a.name}
                  </span>
                )}
                {i < liste.length - 1 && (
                  <ChevronRight
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </li>
            ),
          )}
        </ol>
      </nav>
      <div className="flex justify-end">
        <Button
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={() => setAjout(true)}
          disabled={!courant}
        >
          Ajouter
        </Button>
      </div>
      <DataTable
        data={enfants}
        columns={colonnes}
        rowKey={(n) => n.id}
        isLoading={chargement}
        caption={`Rattachés à ${courant?.name ?? racine.name}`}
        emptyState={
          <EmptyState
            icon={<ListTree />}
            title="Aucun rattachement"
            description="Aucune communauté n’est rattachée ici pour le moment."
          />
        }
      />
      {ajout && courant && (
        <FormulaireNoeud
          titre={`Ajouter sous ${courant.name}`}
          parent={courant}
          onClose={() => setAjout(false)}
        />
      )}
      {edition && (
        <FormulaireNoeud
          titre={`Modifier ${edition.name}`}
          noeud={edition}
          onClose={() => setEdition(null)}
        />
      )}
    </div>
  );
}
