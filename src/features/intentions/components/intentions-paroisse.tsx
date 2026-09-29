'use client';

import { Info, Inbox } from 'lucide-react';
import { useId, useState } from 'react';

import {
  AucunNoeud,
  NoeudSelect,
  useNoeudActif,
} from '@/components/staff/noeud-actif';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { type NoeudStaff } from '@/lib/staff/capacites';

import {
  LIBELLES_TYPE_INTENTION,
  type StaffMassIntention,
  useCelebrerIntention,
  useIntentionsParoisse,
  usePlanifierIntention,
  useRefuserIntention,
} from '../api/intentions';
import { aujourdhuiIso, jourCourt, jourLong } from '../utils/format';

import { IntentionStatusBadge } from './intention-status-badge';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const MOTIFS_TYPES = [
  'Messe demandée déjà complète',
  'Pas de messe à cette date',
  'Texte à reformuler',
];

const messageErreur = (e: unknown) =>
  e instanceof ApiError ? e.message : 'L’opération n’a pas abouti.';

const recue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

function PanneauDecision({
  intention,
  onFermer,
}: {
  intention: StaffMassIntention;
  onFermer: () => void;
}) {
  const id = useId();
  const [date, setDate] = useState(
    intention.scheduled_date ?? intention.requested_date ?? '',
  );
  const [messe, setMesse] = useState(
    intention.scheduled_mass || intention.requested_mass,
  );
  const [motif, setMotif] = useState(MOTIFS_TYPES[0]);
  const [message, setMessage] = useState('');
  const planifier = usePlanifierIntention();
  const refuser = useRefuserIntention();
  const celebrer = useCelebrerIntention();
  const erreur = planifier.error ?? refuser.error ?? celebrer.error;
  const passee =
    !!intention.scheduled_date && intention.scheduled_date <= aujourdhuiIso();

  return (
    <aside
      aria-label="Intention sélectionnée"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {intention.requester_name}
          {intention.is_anonymous && ' · anonyme à la messe'}
        </p>
        <p className="text-sm font-medium">{intention.intention}</p>
        <p className="text-xs text-muted-foreground">
          {LIBELLES_TYPE_INTENTION[intention.kind] ?? intention.kind} ·
          Souhaitée :{' '}
          {intention.requested_date
            ? `${jourLong(intention.requested_date)}${intention.requested_mass ? `, ${intention.requested_mass}` : ''}`
            : 'pas de date'}
        </p>
        <p className="text-xs text-muted-foreground">
          Annoncée à la messe : {intention.announced_as}
        </p>
      </div>

      {(intention.status === 'recue' || intention.status === 'planifiee') && (
        <form
          className="space-y-3"
          aria-label="Planifier"
          onSubmit={(e) => {
            e.preventDefault();
            planifier.mutate(
              {
                id: intention.id,
                scheduled_date: date,
                scheduled_mass: messe.trim(),
              },
              { onSuccess: onFermer },
            );
          }}
        >
          <h3 className="text-sm font-semibold">
            {intention.status === 'planifiee'
              ? 'Déplacer'
              : 'Planifier à la messe'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-date`} className="text-xs font-medium">
                Date
              </label>
              <input
                id={`${id}-date`}
                type="date"
                required
                min={aujourdhuiIso()}
                className={champ}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-messe`} className="text-xs font-medium">
                Messe
              </label>
              <input
                id={`${id}-messe`}
                maxLength={120}
                placeholder="11:30"
                className={champ}
                value={messe}
                onChange={(e) => setMesse(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            fullWidth
            isLoading={planifier.isPending}
          >
            {date
              ? `Planifier le ${jourCourt(date)}${messe.trim() ? `, ${messe.trim()}` : ''}`
              : 'Planifier'}
          </Button>
        </form>
      )}

      {intention.status === 'planifiee' && (
        <Button
          size="sm"
          variant="outline"
          fullWidth
          disabled={!passee}
          isLoading={celebrer.isPending}
          onClick={() =>
            celebrer.mutate({ id: intention.id }, { onSuccess: onFermer })
          }
        >
          {passee ? 'Marquer célébrée' : 'Célébrée après la messe'}
        </Button>
      )}

      {intention.status === 'recue' && (
        <form
          className="space-y-2 border-t border-border pt-3"
          aria-label="Refuser"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = [motif, message.trim()].filter(Boolean).join('. ');
            refuser.mutate(
              { id: intention.id, reason },
              { onSuccess: onFermer },
            );
          }}
        >
          <h3 className="text-sm font-semibold">Refuser avec un motif</h3>
          <label htmlFor={`${id}-motif`} className="sr-only">
            Motif
          </label>
          <select
            id={`${id}-motif`}
            className={champ}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          >
            {MOTIFS_TYPES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <label htmlFor={`${id}-message`} className="text-xs font-medium">
            Message au demandeur (facultatif)
          </label>
          <textarea
            id={`${id}-message`}
            rows={2}
            maxLength={200}
            className={champ}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Le motif est envoyé au demandeur, qui peut choisir une autre messe.
          </p>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            isLoading={refuser.isPending}
          >
            Refuser
          </Button>
        </form>
      )}

      {erreur && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(erreur)}
        </p>
      )}
      <Button size="sm" variant="ghost" onClick={onFermer}>
        Fermer
      </Button>
    </aside>
  );
}

function Liste({ noeud }: { noeud: NoeudStaff }) {
  const [statut, setStatut] = useState('recue');
  const [choisie, setChoisie] = useState<StaffMassIntention | null>(null);
  const { data, isLoading, isError, refetch } = useIntentionsParoisse({
    node: noeud.id,
    status: statut,
  });

  const colonnes: DataTableColumn<StaffMassIntention>[] = [
    {
      header: 'Demandeur',
      cell: (i) => (
        <div className="space-y-1">
          <span className="block font-medium">{i.requester_name}</span>
          {i.is_anonymous && (
            <Badge variant="outline">Anonyme à la messe</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Intention',
      cell: (i) => <span className="line-clamp-2">{i.intention}</span>,
    },
    {
      header: statut === 'recue' ? 'Souhaitée' : 'Messe',
      cell: (i) => {
        const d = statut === 'recue' ? i.requested_date : i.scheduled_date;
        const m = statut === 'recue' ? i.requested_mass : i.scheduled_mass;
        return `${jourCourt(d)}${m ? `, ${m}` : ''}`;
      },
    },
    { header: 'Reçue', cell: (i) => recue(i.created_at), hideOnMobile: true },
    {
      header: 'Statut',
      cell: (i) => <IntentionStatusBadge status={i.status} />,
      hideOnMobile: true,
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (i) =>
        i.status === 'recue' || i.status === 'planifiee' ? (
          <Button size="sm" variant="outline" onClick={() => setChoisie(i)}>
            {i.status === 'recue' ? 'Traiter' : 'Ouvrir'}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <FilterPills
        options={[
          { value: 'recue', label: 'À planifier' },
          { value: 'planifiee', label: 'Planifiées' },
          { value: 'refusee', label: 'Refusées' },
          { value: 'celebree', label: 'Célébrées' },
        ]}
        value={statut}
        onChange={(v) => {
          setStatut(v);
          setChoisie(null);
        }}
        ariaLabel="Filtrer par statut"
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {isLoading && <SkeletonList count={3} />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {data && (
            <DataTable
              data={data.results}
              columns={colonnes}
              rowKey={(i) => i.id}
              caption={`Intentions de messe de ${noeud.name}`}
              emptyState={
                <EmptyState
                  icon={<Inbox />}
                  title="Aucune intention"
                  description="Rien à afficher pour ce filtre."
                />
              }
            />
          )}
        </div>
        <div className="space-y-3">
          {choisie && (
            <PanneauDecision
              key={choisie.id}
              intention={choisie}
              onFermer={() => setChoisie(null)}
            />
          )}
          <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Aucun montant ni paiement n’est géré ici. L’offrande éventuelle se
            remet au secrétariat, comme d’habitude.
          </p>
        </div>
      </div>
    </div>
  );
}

/** File des intentions de la paroisse (WEB-PAR-Intentions), `intentions.gerer`. */
export function IntentionsParoisse() {
  const { noeud, noeuds, choisir, isLoading } =
    useNoeudActif('intentions.gerer');
  if (isLoading) return <SkeletonList count={3} />;
  if (!noeud) return <AucunNoeud quoi="les intentions de messe" />;
  return (
    <div className="space-y-4">
      <NoeudSelect noeuds={noeuds} valeur={noeud.id} onChange={choisir} />
      <Liste key={noeud.id} noeud={noeud} />
    </div>
  );
}
