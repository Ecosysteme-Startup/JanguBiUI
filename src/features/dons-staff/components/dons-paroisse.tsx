'use client';

import { Download, HandCoins, Plus } from 'lucide-react';
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
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SkeletonList } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFcfa } from '@/features/dons-analyse/utils/format';
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { type NoeudStaff, aCapacite } from '@/lib/staff/capacites';

import {
  type Fonds,
  LIBELLES_MOYEN,
  LIBELLES_STATUT_DON,
  LIBELLES_STATUT_FONDS,
  LIBELLES_STATUT_QUETE,
  LIBELLES_TYPE_FONDS,
  type NouveauFonds,
  OPERATIONS_PAR_PAGE,
  type Operation,
  QUETES_PAR_PAGE,
  type Quete,
  exporterDons,
  useCreerFonds,
  useDecisionQuete,
  useEtapeFonds,
  useFonds,
  useFondsProposes,
  useOperations,
  useQuetes,
  useRembourser,
  useEquipeCompteurs,
  useSaisirQuete,
} from '../api/dons-staff';

import { EquipeCompteurs, nomsProposes } from './equipe-compteurs';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const TYPES_PAROISSE = ['paroisse', 'quasi_paroisse'];

const dateCourte = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const messageErreur = (e: unknown) =>
  e instanceof ApiError ? e.message : 'L’opération n’a pas abouti.';

// --- Confirmation avec motif (rejet d'une quête, remboursement) -----------------------

function MotifDialog({
  titre,
  description,
  libelle,
  obligatoire,
  enCours,
  erreur,
  onConfirm,
  onClose,
}: {
  titre: string;
  description: string;
  libelle: string;
  obligatoire: boolean;
  enCours: boolean;
  erreur: unknown;
  onConfirm: (texte: string) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [texte, setTexte] = useState('');
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <label htmlFor={id} className="text-sm font-medium">
            {libelle}
          </label>
          <textarea
            id={id}
            rows={3}
            maxLength={300}
            className={champ}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
        </div>
        {!!erreur && (
          <p role="alert" className="text-sm text-destructive">
            {messageErreur(erreur)}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            isLoading={enCours}
            disabled={obligatoire && !texte.trim()}
            onClick={() => onConfirm(texte.trim())}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Fonds ----------------------------------------------------------------------

function NouveauFondsDialog({
  noeud,
  onClose,
}: {
  noeud: NoeudStaff;
  onClose: () => void;
}) {
  const id = useId();
  const creer = useCreerFonds();
  const [kind, setKind] = useState<NouveauFonds['kind']>('campagne');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectif, setObjectif] = useState('');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouveau fonds</DialogTitle>
          <DialogDescription>
            {noeud.name} · enregistré en brouillon, à publier ensuite.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            creer.mutate(
              {
                node: noeud.id,
                kind,
                title: title.trim(),
                description: description.trim(),
                goal_amount: objectif ? Number(objectif) : null,
              },
              { onSuccess: onClose },
            );
          }}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-kind`} className="text-sm font-medium">
              Type
            </label>
            <select
              id={`${id}-kind`}
              className={champ}
              value={kind}
              onChange={(e) => setKind(e.target.value as NouveauFonds['kind'])}
            >
              <option value="campagne">Campagne pour un projet</option>
              <option value="quete_dominicale">Quête dominicale</option>
              <option value="contribution_annuelle">
                Contribution annuelle
              </option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-titre`} className="text-sm font-medium">
              Intitulé
            </label>
            <input
              id={`${id}-titre`}
              className={champ}
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-desc`} className="text-sm font-medium">
              Description
            </label>
            <textarea
              id={`${id}-desc`}
              className={champ}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-obj`} className="text-sm font-medium">
              Objectif (FCFA, facultatif)
            </label>
            <input
              id={`${id}-obj`}
              className={champ}
              type="number"
              min={1}
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
            />
          </div>
          {creer.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageErreur(creer.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={creer.isPending}>
              Créer le brouillon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OngletFonds({ noeud, gerer }: { noeud: NoeudStaff; gerer: boolean }) {
  const [statut, setStatut] = useState('');
  const [creation, setCreation] = useState(false);
  const { data, isLoading, isError, refetch } = useFonds(noeud.id, statut);
  const etape = useEtapeFonds();

  const colonnes: DataTableColumn<Fonds>[] = [
    {
      header: 'Fonds',
      cell: (f) => (
        <span>
          <span className="block font-medium">{f.title}</span>
          <span className="text-xs text-muted-foreground">
            {LIBELLES_TYPE_FONDS[f.kind] ?? f.kind}
            {f.parent_id ? ' · défini par le diocèse' : ''}
          </span>
        </span>
      ),
    },
    {
      header: 'Collecté',
      cell: (f) =>
        f.goal_amount
          ? `${formatFcfa(f.raised)} sur ${formatFcfa(f.goal_amount)}`
          : formatFcfa(f.raised),
    },
    { header: 'Dons', cell: (f) => f.donations_count, hideOnMobile: true },
    {
      header: 'Statut',
      cell: (f) => (
        <Badge variant={f.status === 'ouvert' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_FONDS[f.status]}
        </Badge>
      ),
    },
    ...(gerer
      ? [
          {
            header: 'Actions',
            isAction: true,
            cell: (f: Fonds) =>
              f.parent_id || f.status === 'clos' ? null : (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={etape.isPending && etape.variables?.id === f.id}
                  onClick={() =>
                    etape.mutate({
                      id: f.id,
                      etape: f.status === 'brouillon' ? 'publier' : 'clore',
                    })
                  }
                >
                  {f.status === 'brouillon' ? 'Publier' : 'Clore'}
                </Button>
              ),
          } satisfies DataTableColumn<Fonds>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          options={[
            { value: '', label: 'Tous' },
            { value: 'brouillon', label: 'Brouillons' },
            { value: 'ouvert', label: 'Ouverts' },
            { value: 'clos', label: 'Clos' },
          ]}
          value={statut}
          onChange={setStatut}
          ariaLabel="Filtrer par statut"
        />
        {gerer && (
          <Button size="sm" onClick={() => setCreation(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nouveau fonds
          </Button>
        )}
      </div>
      {etape.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(etape.error)}
        </p>
      )}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          columns={colonnes}
          rowKey={(f) => f.id}
          isLoading={isLoading}
          caption={`Fonds de ${noeud.name}`}
          emptyState={
            <EmptyState
              icon={<HandCoins />}
              title="Aucun fonds"
              description="Les fonds de la paroisse apparaîtront ici."
            />
          }
        />
      )}
      {creation && (
        <NouveauFondsDialog noeud={noeud} onClose={() => setCreation(false)} />
      )}
    </div>
  );
}

// --- Quêtes en espèces --------------------------------------------------------------

function SaisieQuete({
  noeud,
  onClose,
}: {
  noeud: NoeudStaff;
  onClose: () => void;
}) {
  const id = useId();
  const [date, setDate] = useState('');
  const [fonds, setFonds] = useState('');
  const [messe, setMesse] = useState('');
  const [montant, setMontant] = useState('');
  const [compteur1, setCompteur1] = useState('');
  const [compteur2, setCompteur2] = useState('');
  const { data: proposes = [] } = useFondsProposes(noeud.id, date);
  const { data: equipe } = useEquipeCompteurs(noeud.id);
  const noms = nomsProposes(equipe);
  const saisir = useSaisirQuete();
  const fondsId = fonds || proposes[0]?.id || '';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Saisir une quête</DialogTitle>
          <DialogDescription>
            Comptée par deux personnes, validée ensuite par une troisième.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!fondsId) return;
            saisir.mutate(
              {
                node: noeud.id,
                fund_id: fondsId,
                mass_date: date,
                mass_label: messe.trim(),
                amount: Number(montant),
                counter_one: compteur1.trim(),
                counter_two: compteur2.trim(),
              },
              { onSuccess: onClose },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-date`} className="text-sm font-medium">
                Date de la messe
              </label>
              <input
                id={`${id}-date`}
                type="date"
                required
                className={champ}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-messe`} className="text-sm font-medium">
                Messe
              </label>
              <input
                id={`${id}-messe`}
                required
                placeholder="Messe de 10 h"
                className={champ}
                value={messe}
                onChange={(e) => setMesse(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-fonds`} className="text-sm font-medium">
              Fonds
            </label>
            <select
              id={`${id}-fonds`}
              className={champ}
              value={fondsId}
              disabled={proposes.length === 0}
              onChange={(e) => setFonds(e.target.value)}
            >
              {proposes.length === 0 && (
                <option value="">Choisissez d’abord la date</option>
              )}
              {proposes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-montant`} className="text-sm font-medium">
              Montant (FCFA)
            </label>
            <input
              id={`${id}-montant`}
              type="number"
              min={1}
              required
              className={champ}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-c1`} className="text-sm font-medium">
                Premier compteur
              </label>
              <input
                id={`${id}-c1`}
                list={`${id}-equipe`}
                required
                className={champ}
                value={compteur1}
                onChange={(e) => setCompteur1(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-c2`} className="text-sm font-medium">
                Second compteur
              </label>
              <input
                id={`${id}-c2`}
                list={`${id}-equipe`}
                required
                className={champ}
                value={compteur2}
                onChange={(e) => setCompteur2(e.target.value)}
              />
            </div>
          </div>
          <datalist id={`${id}-equipe`}>
            {noms.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {saisir.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageErreur(saisir.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={saisir.isPending}
              disabled={!fondsId}
            >
              Enregistrer la saisie
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OngletQuetes({ noeud }: { noeud: NoeudStaff }) {
  const [statut, setStatut] = useState('saisie');
  const [offset, setOffset] = useState(0);
  const [saisie, setSaisie] = useState(false);
  const [equipe, setEquipe] = useState(false);
  const [aRejeter, setARejeter] = useState<Quete | null>(null);
  const { data, isLoading, isError, refetch } = useQuetes(
    noeud.id,
    statut,
    offset,
  );
  const decision = useDecisionQuete();

  const colonnes: DataTableColumn<Quete>[] = [
    {
      header: 'Messe',
      cell: (q) => (
        <span>
          <span className="block font-medium">
            {dateCourte(q.mass_date)} · {q.mass_label}
          </span>
          <span className="text-xs text-muted-foreground">{q.fund.title}</span>
        </span>
      ),
    },
    { header: 'Montant', cell: (q) => formatFcfa(q.amount) },
    {
      header: 'Comptée par',
      cell: (q) => `${q.counter_one}, ${q.counter_two}`,
      hideOnMobile: true,
    },
    { header: 'Saisie par', cell: (q) => q.entered_by, hideOnMobile: true },
    {
      header: 'Statut',
      cell: (q) => (
        <Badge variant={q.status === 'validee' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_QUETE[q.status]}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (q) =>
        q.status === 'saisie' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              isLoading={
                decision.isPending &&
                decision.variables?.id === q.id &&
                decision.variables.reason === undefined
              }
              onClick={() => decision.mutate({ id: q.id })}
            >
              Valider
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                decision.reset();
                setARejeter(q);
              }}
            >
              Rejeter
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          options={[
            { value: 'saisie', label: 'À valider' },
            { value: 'validee', label: 'Validées' },
            { value: 'rejetee', label: 'Rejetées' },
            { value: '', label: 'Toutes' },
          ]}
          value={statut}
          onChange={(v) => {
            setStatut(v);
            setOffset(0);
          }}
          ariaLabel="Filtrer par statut"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEquipe(true)}>
            Équipe des compteurs
          </Button>
          <Button size="sm" onClick={() => setSaisie(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Saisir une quête
          </Button>
        </div>
      </div>
      {decision.isError && !aRejeter && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(decision.error)}
        </p>
      )}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results}
          columns={colonnes}
          rowKey={(q) => q.id}
          isLoading={isLoading}
          caption={`Quêtes en espèces de ${noeud.name}`}
          emptyState={
            <EmptyState
              icon={<HandCoins />}
              title="Aucune quête"
              description="Rien à afficher pour ce filtre."
            />
          }
          pagination={
            data
              ? {
                  count: data.count,
                  limit: QUETES_PAR_PAGE,
                  offset,
                  onOffsetChange: setOffset,
                }
              : undefined
          }
        />
      )}
      {saisie && <SaisieQuete noeud={noeud} onClose={() => setSaisie(false)} />}
      {equipe && (
        <EquipeCompteurs noeud={noeud} onClose={() => setEquipe(false)} />
      )}
      {aRejeter && (
        <MotifDialog
          titre="Rejeter la saisie"
          description={`${aRejeter.mass_label}, ${dateCourte(aRejeter.mass_date)} · ${formatFcfa(aRejeter.amount)}`}
          libelle="Motif du rejet"
          obligatoire
          enCours={decision.isPending}
          erreur={decision.error}
          onConfirm={(reason) =>
            decision.mutate(
              { id: aRejeter.id, reason },
              { onSuccess: () => setARejeter(null) },
            )
          }
          onClose={() => setARejeter(null)}
        />
      )}
    </div>
  );
}

// --- Opérations ---------------------------------------------------------------------

function OngletOperations({
  noeud,
  rembourser: peutRembourser,
}: {
  noeud: NoeudStaff;
  rembourser: boolean;
}) {
  const [channel, setChannel] = useState('');
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useOperations(
    noeud.id,
    { channel },
    offset,
  );
  const rembourser = useRembourser();
  const [aRembourser, setARembourser] = useState<Operation | null>(null);

  const colonnes: DataTableColumn<Operation>[] = [
    {
      header: 'Opération',
      cell: (o) => (
        <span>
          <span className="block font-medium">{o.reference}</span>
          <span className="text-xs text-muted-foreground">
            {dateCourte(o.value_date ?? o.created_at)} · {o.fund.title}
          </span>
        </span>
      ),
    },
    { header: 'Montant', cell: (o) => formatFcfa(o.amount) },
    {
      header: 'Moyen',
      cell: (o) => LIBELLES_MOYEN[o.payment_method] ?? o.payment_method,
      hideOnMobile: true,
    },
    { header: 'Donateur', cell: (o) => o.donor, hideOnMobile: true },
    {
      header: 'Statut',
      cell: (o) => (
        <Badge variant={o.status === 'confirme' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_DON[o.status] ?? o.status}
        </Badge>
      ),
    },
    ...(peutRembourser
      ? [
          {
            header: 'Actions',
            isAction: true,
            cell: (o: Operation) =>
              o.status === 'confirme' && o.channel === 'en_ligne' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    rembourser.reset();
                    setARembourser(o);
                  }}
                >
                  Rembourser
                </Button>
              ) : null,
          } satisfies DataTableColumn<Operation>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <FilterPills
        options={[
          { value: '', label: 'Tout' },
          { value: 'en_ligne', label: 'En ligne' },
          { value: 'especes', label: 'Espèces' },
        ]}
        value={channel}
        onChange={(v) => {
          setChannel(v);
          setOffset(0);
        }}
        ariaLabel="Filtrer par canal"
      />
      {aRembourser && (
        <MotifDialog
          titre="Marquer comme remboursé"
          description={`${aRembourser.reference} · ${formatFcfa(aRembourser.amount)}`}
          libelle="Note (facultative)"
          obligatoire={false}
          enCours={rembourser.isPending}
          erreur={rembourser.error}
          onConfirm={(note) =>
            rembourser.mutate(
              { id: aRembourser.id, note },
              { onSuccess: () => setARembourser(null) },
            )
          }
          onClose={() => setARembourser(null)}
        />
      )}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results}
          columns={colonnes}
          rowKey={(o) => o.id}
          isLoading={isLoading}
          caption={`Opérations de ${noeud.name}`}
          emptyState={
            <EmptyState
              icon={<HandCoins />}
              title="Aucune opération"
              description="Les dons et quêtes validées apparaîtront ici."
            />
          }
          pagination={
            data
              ? {
                  count: data.count,
                  limit: OPERATIONS_PAR_PAGE,
                  offset,
                  onOffsetChange: setOffset,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

// --- Export ---------------------------------------------------------------------

function OngletExport({ noeud }: { noeud: NoeudStaff }) {
  const id = useId();
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [fichier, setFichier] = useState<'csv' | 'xlsx'>('csv');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <form
      className="max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErreur(null);
        setEnCours(true);
        try {
          await exporterDons({
            node: noeud.id,
            date_from: debut,
            date_to: fin,
            fichier,
          });
        } catch (err) {
          setErreur(messageErreur(err));
        } finally {
          setEnCours(false);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        Export comptable de la période : dons en ligne, quêtes validées,
        remboursements. Sans nom de donateur.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-du`} className="text-sm font-medium">
            Du
          </label>
          <input
            id={`${id}-du`}
            type="date"
            required
            className={champ}
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-au`} className="text-sm font-medium">
            Au
          </label>
          <input
            id={`${id}-au`}
            type="date"
            required
            min={debut || undefined}
            className={champ}
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </div>
      </div>
      <FilterPills
        options={[
          { value: 'csv', label: 'CSV' },
          { value: 'xlsx', label: 'Excel' },
        ]}
        value={fichier}
        onChange={(v) => setFichier(v as 'csv' | 'xlsx')}
        ariaLabel="Format du fichier"
      />
      {erreur && (
        <p role="alert" className="text-sm text-destructive">
          {erreur}
        </p>
      )}
      <Button type="submit" isLoading={enCours}>
        <Download className="size-4" aria-hidden="true" />
        Télécharger
      </Button>
    </form>
  );
}

// --- Page -----------------------------------------------------------------------

export type VueDons = 'fonds' | 'quetes' | 'operations' | 'export';

/** Dons et quêtes de la paroisse (`/v1/staff/dons/`), onglets par capacité. */
export function DonsParoisse({ vue }: { vue?: string }) {
  const { data: user } = useUser();
  const { noeuds, noeud, choisir, isLoading } = useNoeudActif(
    'dons.voir_fonds',
    'dons.gerer_fonds',
    'dons.saisir_quete',
    'dons.exporter',
  );
  const paroisses = noeuds.filter((n) => TYPES_PAROISSE.includes(n.type));
  const actif =
    paroisses.find((n) => n.id === noeud?.id) ?? paroisses[0] ?? null;

  if (isLoading) return <SkeletonList />;
  if (!actif) return <AucunNoeud quoi="les dons d’une paroisse" />;

  const onglets: { cle: VueDons; libelle: string }[] = [
    ...(aCapacite(user, 'dons.voir_fonds')
      ? [
          { cle: 'fonds' as const, libelle: 'Fonds' },
          { cle: 'operations' as const, libelle: 'Opérations' },
        ]
      : []),
    ...(aCapacite(user, 'dons.saisir_quete')
      ? [{ cle: 'quetes' as const, libelle: 'Quêtes' }]
      : []),
    ...(aCapacite(user, 'dons.exporter')
      ? [{ cle: 'export' as const, libelle: 'Export' }]
      : []),
  ];
  if (onglets.length === 0)
    return <AucunNoeud quoi="les dons d’une paroisse" />;
  const initial = onglets.find((o) => o.cle === vue)?.cle ?? onglets[0].cle;
  const gerer = aCapacite(user, 'dons.gerer_fonds');

  return (
    <div className="space-y-4">
      <NoeudSelect noeuds={paroisses} valeur={actif.id} onChange={choisir} />
      <Tabs defaultValue={initial}>
        <TabsList>
          {onglets.map((o) => (
            <TabsTrigger key={o.cle} value={o.cle}>
              {o.libelle}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="fonds" className="pt-4">
          <OngletFonds noeud={actif} gerer={gerer} />
        </TabsContent>
        <TabsContent value="operations" className="pt-4">
          <OngletOperations noeud={actif} rembourser={gerer} />
        </TabsContent>
        <TabsContent value="quetes" className="pt-4">
          <OngletQuetes noeud={actif} />
        </TabsContent>
        <TabsContent value="export" className="pt-4">
          <OngletExport noeud={actif} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
