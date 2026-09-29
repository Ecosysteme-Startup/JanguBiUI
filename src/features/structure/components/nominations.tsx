'use client';

import { UserPlus, Users } from 'lucide-react';
import { useId, useState } from 'react';

import {
  AucunNoeud,
  NoeudSelect,
  useNoeudActif,
} from '@/components/staff/noeud-actif';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { ApiError } from '@/lib/api-client';
import type { NoeudStaff } from '@/lib/staff/capacites';

import {
  LIBELLES_STATUT_NOMINATION,
  NOMINATIONS_PAR_PAGE,
  type Nomination,
  type Personne,
  useFinNomination,
  useNominations,
  useNommer,
  usePersonnes,
  useTypesOffice,
} from '../api/hierarchie';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

function Nommer({
  noeud,
  onClose,
}: {
  noeud: NoeudStaff;
  onClose: () => void;
}) {
  const id = useId();
  const [q, setQ] = useState('');
  const [personne, setPersonne] = useState<Personne | null>(null);
  const [office, setOffice] = useState('');
  const [qualite, setQualite] = useState('');
  const [decret, setDecret] = useState('');
  const { data: personnes = [] } = usePersonnes(q);
  const { data: offices = [] } = useTypesOffice();
  const possibles = offices.filter(
    (o) => o.node_types.includes(noeud.type) && !o.appointed_by_platform,
  );
  const choisi = possibles.find((o) => o.code === office) ?? possibles[0];
  const nommer = useNommer();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nommer à un office</DialogTitle>
          <DialogDescription>{noeud.name}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!personne || !choisi) return;
            nommer.mutate(
              {
                person_id: personne.id,
                office: choisi.code,
                node_id: noeud.id,
                decree_ref: decret,
                ...(qualite ? { quality: qualite } : {}),
              },
              { onSuccess: onClose },
            );
          }}
        >
          <div>
            <label htmlFor={`${id}-q`} className="text-sm font-medium">
              Personne
            </label>
            {personne ? (
              <p className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {personne.full_name}{' '}
                  <span className="text-muted-foreground">
                    ({personne.email_masked})
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPersonne(null)}
                >
                  Changer
                </Button>
              </p>
            ) : (
              <>
                <input
                  id={`${id}-q`}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nom, prénom ou e-mail"
                  className={champ}
                />
                {personnes.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border">
                    {personnes.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setPersonne(p)}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          {p.full_name}{' '}
                          <span className="text-muted-foreground">
                            {p.email_masked}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-o`} className="text-sm font-medium">
              Office
            </label>
            <select
              id={`${id}-o`}
              value={choisi?.code ?? ''}
              onChange={(e) => {
                setOffice(e.target.value);
                setQualite('');
              }}
              className={champ}
            >
              {possibles.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {choisi && choisi.qualities.length > 0 && (
            <div>
              <label htmlFor={`${id}-t`} className="text-sm font-medium">
                Titre
              </label>
              <select
                id={`${id}-t`}
                value={qualite}
                onChange={(e) => setQualite(e.target.value)}
                className={champ}
              >
                {choisi.qualities.map((qq) => (
                  <option key={qq.code} value={qq.code}>
                    {qq.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor={`${id}-d`} className="text-sm font-medium">
              Référence du décret (facultatif)
            </label>
            <input
              id={`${id}-d`}
              value={decret}
              onChange={(e) => setDecret(e.target.value)}
              className={champ}
            />
          </div>
          {nommer.error instanceof ApiError && (
            <p role="alert" className="text-sm text-destructive">
              {nommer.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={nommer.isPending}
              disabled={!personne || !choisi}
            >
              Nommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Équipe et offices d'une communauté (`/v1/hierarchy/assignments/`). */
export function Nominations() {
  const { noeud, noeuds, choisir, isLoading } = useNoeudActif('offices.nommer');
  const [statut, setStatut] = useState('active');
  const [offset, setOffset] = useState(0);
  const [nommer, setNommer] = useState(false);
  const [aTerminer, setATerminer] = useState<Nomination | null>(null);
  const fin = useFinNomination();
  const { data, isLoading: chargement } = useNominations(
    { node: noeud?.id, status: statut, offset },
    !!noeud,
  );

  if (isLoading) return null;
  if (!noeud) return <AucunNoeud quoi="les nominations" />;

  const colonnes: DataTableColumn<Nomination>[] = [
    {
      header: 'Personne',
      cell: (a) => <span className="font-medium">{a.person.full_name}</span>,
    },
    { header: 'Office', cell: (a) => a.office_label },
    { header: 'Communauté', cell: (a) => a.node.name, hideOnMobile: true },
    {
      header: 'Depuis',
      cell: (a) => new Date(a.start_date).toLocaleDateString('fr-FR'),
    },
    {
      header: 'Statut',
      cell: (a) => (
        <Badge variant={a.status === 'active' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_NOMINATION[a.status] ?? a.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (a) =>
        a.status === 'active' || a.status === 'proposee' ? (
          <Button size="sm" variant="ghost" onClick={() => setATerminer(a)}>
            Mettre fin
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoeudSelect
          noeuds={noeuds}
          valeur={noeud.id}
          onChange={(id) => {
            choisir(id);
            setOffset(0);
          }}
        />
        <Button
          size="sm"
          icon={<UserPlus className="size-4" />}
          onClick={() => setNommer(true)}
        >
          Nommer
        </Button>
      </div>
      <FilterPills
        options={[
          { value: 'active', label: 'En cours' },
          { value: 'proposee', label: 'Proposées' },
          { value: 'terminee', label: 'Terminées' },
          { value: '', label: 'Toutes' },
        ]}
        value={statut}
        onChange={(v) => {
          setStatut(v);
          setOffset(0);
        }}
        ariaLabel="Filtrer par statut"
      />
      <DataTable
        data={data?.results}
        columns={colonnes}
        rowKey={(a) => a.id}
        isLoading={chargement}
        caption={`Offices de ${noeud.name}`}
        emptyState={
          <EmptyState
            icon={<Users />}
            title="Aucune nomination"
            description="Aucune nomination ne correspond à ce filtre."
          />
        }
        pagination={
          data
            ? {
                count: data.count,
                limit: NOMINATIONS_PAR_PAGE,
                offset,
                onOffsetChange: setOffset,
              }
            : undefined
        }
      />
      {nommer && <Nommer noeud={noeud} onClose={() => setNommer(false)} />}
      <Dialog open={!!aTerminer} onOpenChange={(o) => !o && setATerminer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre fin à cette nomination ?</DialogTitle>
            <DialogDescription>
              {aTerminer?.person.full_name} · {aTerminer?.office_label}. Les
              droits liés à l’office cessent aujourd’hui.
            </DialogDescription>
          </DialogHeader>
          {fin.error instanceof ApiError && (
            <p role="alert" className="text-sm text-destructive">
              {fin.error.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setATerminer(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={fin.isPending}
              onClick={() =>
                aTerminer &&
                fin.mutate(
                  {
                    id: aTerminer.id,
                    action:
                      aTerminer.status === 'proposee' ? 'annuler' : 'terminer',
                  },
                  { onSuccess: () => setATerminer(null) },
                )
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
