'use client';

import { CalendarPlus, Download, Users } from 'lucide-react';
import { useState } from 'react';

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
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-client';
import { telechargerFichier } from '@/lib/staff/telecharger';

import {
  EVENEMENTS_PAR_PAGE,
  type EvenementStaff,
  TYPES_EVENEMENT,
  useAnnulerEvenement,
  useEvenementsStaff,
  useInscriptions,
} from '../api/staff-events';

import { EventForm } from './event-form';

const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const libelleType = (t: string) =>
  TYPES_EVENEMENT.find((x) => x.value === t)?.label ?? t;

function Inscrits({
  evenement,
  onClose,
}: {
  evenement: EvenementStaff | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useInscriptions(evenement?.id ?? null);
  const { addNotification } = useNotifications();
  return (
    <Dialog open={!!evenement} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Inscrits</DialogTitle>
          <DialogDescription>{evenement?.title}</DialogDescription>
        </DialogHeader>
        {isLoading ? null : (data?.results.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune inscription.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {data?.results.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.full_name || i.email}</span>
                <span className="text-muted-foreground">
                  {i.seats} pers.
                </span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            icon={<Download className="size-4" />}
            onClick={() =>
              evenement &&
              telechargerFichier(
                `/v1/staff/agenda/${evenement.id}/registrations.csv`,
                {},
                `inscrits-evenement-${evenement.id}.csv`,
              ).catch((e: unknown) =>
                addNotification({
                  type: 'error',
                  title: 'Export impossible',
                  message: e instanceof ApiError ? e.message : undefined,
                }),
              )
            }
          >
            Exporter en CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Agenda de la communauté côté staff (`/v1/staff/agenda/`). */
export function StaffAgenda() {
  const { noeud, noeuds, choisir, isLoading } =
    useNoeudActif('evenements.gerer');
  const [passes, setPasses] = useState(false);
  const [offset, setOffset] = useState(0);
  const [formulaire, setFormulaire] = useState(false);
  const [aAnnuler, setAAnnuler] = useState<EvenementStaff | null>(null);
  const [inscrits, setInscrits] = useState<EvenementStaff | null>(null);
  const annuler = useAnnulerEvenement();
  const { data, isLoading: chargement } = useEvenementsStaff(
    { node: noeud?.id, include_past: passes, offset },
    !!noeud,
  );

  if (isLoading) return null;
  if (!noeud) return <AucunNoeud quoi="la gestion des événements" />;

  const colonnes: DataTableColumn<EvenementStaff>[] = [
    {
      header: 'Événement',
      cell: (e) => (
        <div>
          <span className="font-medium">{e.title}</span>
          <span className="block text-xs text-muted-foreground">
            {libelleType(e.event_type)}
            {e.location ? ` · ${e.location}` : ''}
          </span>
        </div>
      ),
    },
    { header: 'Début', cell: (e) => dateHeure(e.start_at) },
    {
      header: 'Inscriptions',
      cell: (e) =>
        e.max_participants
          ? `${e.seats_taken} / ${e.max_participants}`
          : String(e.seats_taken),
    },
    {
      header: 'État',
      cell: (e) =>
        e.is_cancelled ? (
          <Badge variant="destructive">Annulé</Badge>
        ) : e.registrations_open ? (
          <Badge variant="success">Inscriptions ouvertes</Badge>
        ) : (
          <Badge variant="outline">Inscriptions closes</Badge>
        ),
    },
    {
      header: 'Actions',
      isAction: true,
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<Users className="size-4" />}
            onClick={() => setInscrits(e)}
          >
            Inscrits
          </Button>
          {!e.is_cancelled && (
            <Button size="sm" variant="ghost" onClick={() => setAAnnuler(e)}>
              Annuler
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoeudSelect
          noeuds={noeuds}
          valeur={noeud.id}
          onChange={(id) => {
            choisir(id);
            setOffset(0);
          }}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={passes}
              onChange={(e) => {
                setPasses(e.target.checked);
                setOffset(0);
              }}
            />
            Inclure les événements passés
          </label>
          <Button
            size="sm"
            icon={<CalendarPlus className="size-4" />}
            onClick={() => setFormulaire((v) => !v)}
          >
            {formulaire ? 'Fermer' : 'Nouvel événement'}
          </Button>
        </div>
      </div>

      {formulaire && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">
            Nouvel événement · {noeud.name}
          </h2>
          <EventForm nodeId={noeud.id} onSuccess={() => setFormulaire(false)} />
        </section>
      )}

      <DataTable
        data={data?.results}
        columns={colonnes}
        rowKey={(e) => e.id}
        isLoading={chargement}
        caption={`Événements de ${noeud.name}`}
        emptyState={
          <EmptyState
            icon={<CalendarPlus />}
            title="Aucun événement à venir"
            description="Créez un événement : il paraîtra dans l’agenda des fidèles."
          />
        }
        pagination={
          data
            ? {
                count: data.count,
                limit: EVENEMENTS_PAR_PAGE,
                offset,
                onOffsetChange: setOffset,
              }
            : undefined
        }
      />

      <Dialog open={!!aAnnuler} onOpenChange={(o) => !o && setAAnnuler(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler cet événement ?</DialogTitle>
            <DialogDescription>
              « {aAnnuler?.title} » sera annulé ; les inscrits en seront
              prévenus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAAnnuler(null)}>
              Garder
            </Button>
            <Button
              variant="destructive"
              isLoading={annuler.isPending}
              onClick={() =>
                aAnnuler &&
                annuler.mutate(aAnnuler.id, {
                  onSuccess: () => setAAnnuler(null),
                })
              }
            >
              Annuler l’événement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Inscrits evenement={inscrits} onClose={() => setInscrits(null)} />
    </div>
  );
}
