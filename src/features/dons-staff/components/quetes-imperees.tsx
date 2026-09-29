'use client';

import { HandCoins, Plus } from 'lucide-react';
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
import { SkeletonList } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFcfa } from '@/features/dons-analyse/utils/format';
import { ApiError } from '@/lib/api-client';
import type { NoeudStaff } from '@/lib/staff/capacites';

import {
  LIBELLES_STATUT_FONDS,
  LIBELLES_STATUT_REVERSEMENT,
  type QueteImperee,
  REVERSEMENTS_PAR_PAGE,
  type Reversement,
  type SuiviParoisse,
  useDefinirQueteImperee,
  useQuetesImperees,
  useReversements,
  useSuiviImperee,
} from '../api/dons-staff';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const dateCourte = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

function Definir({
  noeud,
  onClose,
}: {
  noeud: NoeudStaff;
  onClose: () => void;
}) {
  const id = useId();
  const definir = useDefinirQueteImperee();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [remise, setRemise] = useState('');
  const [reference, setReference] = useState('');
  const [anticipee, setAnticipee] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Définir une quête impérée</DialogTitle>
          <DialogDescription>
            Déclinée dans chaque paroisse où la collecte est active, reversée à
            la curie.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            definir.mutate(
              {
                node: noeud.id,
                title: title.trim(),
                starts_on: date,
                remit_by: remise || null,
                authorization_ref: reference.trim(),
                messe_anticipee_incluse: anticipee,
              },
              { onSuccess: onClose },
            );
          }}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-t`} className="text-sm font-medium">
              Intitulé
            </label>
            <input
              id={`${id}-t`}
              required
              maxLength={160}
              className={champ}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${id}-d`} className="text-sm font-medium">
                Date de la quête
              </label>
              <input
                id={`${id}-d`}
                type="date"
                required
                className={champ}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-r`} className="text-sm font-medium">
                Remise à la curie avant le
              </label>
              <input
                id={`${id}-r`}
                type="date"
                className={champ}
                value={remise}
                onChange={(e) => setRemise(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-ref`} className="text-sm font-medium">
              Référence de l’ordonnance (facultatif)
            </label>
            <input
              id={`${id}-ref`}
              maxLength={120}
              className={champ}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={anticipee}
              onChange={(e) => setAnticipee(e.target.checked)}
            />
            Inclure la messe anticipée de la veille au soir
          </label>
          {definir.isError && (
            <p role="alert" className="text-sm text-destructive">
              {definir.error instanceof ApiError
                ? definir.error.message
                : 'L’opération n’a pas abouti.'}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={definir.isPending}>
              Définir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Suivi({
  quete,
  onClose,
}: {
  quete: QueteImperee | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useSuiviImperee(quete?.id ?? null);
  const colonnes: DataTableColumn<SuiviParoisse>[] = [
    { header: 'Paroisse', cell: (r) => r.parish },
    { header: 'Collecté', cell: (r) => formatFcfa(r.total) },
    {
      header: 'Remis (confirmé)',
      cell: (r) => formatFcfa(r.remitted_confirmed),
    },
    { header: 'Reste à remettre', cell: (r) => formatFcfa(r.to_remit) },
  ];
  return (
    <Dialog open={!!quete} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{quete?.title}</DialogTitle>
          <DialogDescription>
            Suivi par paroisse : sommes seulement, aucun nom.
          </DialogDescription>
        </DialogHeader>
        <DataTable
          data={data}
          columns={colonnes}
          rowKey={(r) => r.parish_id}
          isLoading={isLoading}
          caption="Suivi par paroisse"
        />
      </DialogContent>
    </Dialog>
  );
}

function OngletImperees({ noeud }: { noeud: NoeudStaff }) {
  const [definir, setDefinir] = useState(false);
  const [suivi, setSuivi] = useState<QueteImperee | null>(null);
  const { data, isLoading, isError, refetch } = useQuetesImperees(noeud.id);

  const colonnes: DataTableColumn<QueteImperee>[] = [
    {
      header: 'Quête',
      cell: (q) => (
        <button
          type="button"
          className="text-left font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setSuivi(q)}
        >
          {q.title}
        </button>
      ),
    },
    { header: 'Date', cell: (q) => dateCourte(q.starts_on) },
    { header: 'Paroisses', cell: (q) => q.parishes_count, hideOnMobile: true },
    { header: 'Collecté', cell: (q) => formatFcfa(q.raised) },
    {
      header: 'Statut',
      cell: (q) => (
        <Badge variant={q.status === 'ouvert' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_FONDS[q.status as 'ouvert'] ?? q.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDefinir(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Définir une quête impérée
        </Button>
      </div>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data}
          columns={colonnes}
          rowKey={(q) => q.id}
          isLoading={isLoading}
          caption={`Quêtes impérées de ${noeud.name}`}
          emptyState={
            <EmptyState
              icon={<HandCoins />}
              title="Aucune quête impérée"
              description="Les quêtes définies pour le diocèse apparaîtront ici."
            />
          }
        />
      )}
      {definir && <Definir noeud={noeud} onClose={() => setDefinir(false)} />}
      <Suivi quete={suivi} onClose={() => setSuivi(null)} />
    </div>
  );
}

function OngletReversements({ noeud }: { noeud: NoeudStaff }) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useReversements(
    noeud.id,
    offset,
  );
  const colonnes: DataTableColumn<Reversement>[] = [
    {
      header: 'Reversement',
      cell: (r) => (
        <span>
          <span className="block font-medium">{r.external_ref}</span>
          <span className="text-xs text-muted-foreground">
            {r.provider} · {dateCourte(r.paid_at)}
          </span>
        </span>
      ),
    },
    {
      header: 'Brut',
      cell: (r) => formatFcfa(r.gross_amount),
      hideOnMobile: true,
    },
    {
      header: 'Frais',
      cell: (r) => formatFcfa(r.fee_amount),
      hideOnMobile: true,
    },
    { header: 'Net', cell: (r) => formatFcfa(r.net_amount) },
    {
      header: 'Statut',
      cell: (r) => (
        <Badge variant={r.status === 'rapproche' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_REVERSEMENT[r.status]}
          {r.status === 'ecart' ? ` (${formatFcfa(r.discrepancy_amount)})` : ''}
        </Badge>
      ),
    },
  ];
  return isError ? (
    <ErrorState onRetry={() => refetch()} />
  ) : (
    <DataTable
      data={data?.results}
      columns={colonnes}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      caption={`Reversements reçus par ${noeud.name}`}
      emptyState={
        <EmptyState
          icon={<HandCoins />}
          title="Aucun reversement"
          description="Les reversements de l’agrégateur apparaîtront ici."
        />
      }
      pagination={
        data
          ? {
              count: data.count,
              limit: REVERSEMENTS_PAR_PAGE,
              offset,
              onOffsetChange: setOffset,
            }
          : undefined
      }
    />
  );
}

/** Quêtes impérées et reversements du diocèse (`dons.definir_quete_imperee`). */
export function QuetesImperees() {
  const { noeuds, noeud, choisir, isLoading } = useNoeudActif(
    'dons.definir_quete_imperee',
  );
  const dioceses = noeuds.filter((n) => n.type === 'diocese');
  const actif = dioceses.find((n) => n.id === noeud?.id) ?? dioceses[0] ?? null;

  if (isLoading) return <SkeletonList />;
  if (!actif) return <AucunNoeud quoi="les quêtes impérées d’un diocèse" />;

  return (
    <div className="space-y-4">
      <NoeudSelect
        noeuds={dioceses}
        valeur={actif.id}
        onChange={choisir}
        label="Diocèse"
      />
      <Tabs defaultValue="imperees">
        <TabsList>
          <TabsTrigger value="imperees">Quêtes impérées</TabsTrigger>
          <TabsTrigger value="reversements">Reversements</TabsTrigger>
        </TabsList>
        <TabsContent value="imperees" className="pt-4">
          <OngletImperees noeud={actif} />
        </TabsContent>
        <TabsContent value="reversements" className="pt-4">
          <OngletReversements noeud={actif} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
