'use client';

import { CalendarClock } from 'lucide-react';
import { useId, useState } from 'react';

import {
  AucunNoeud,
  NoeudSelect,
  useNoeudActif,
} from '@/components/staff/noeud-actif';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { aCapacite } from '@/lib/staff/capacites';

import {
  type Creneau,
  useAnnulerCreneau,
  useCreerRegle,
  usePlanning,
  usePresence,
  useRegles,
  useSupprimerRegle,
} from '../api/confessions';
import { JOURS, useLieux } from '../api/lieux';

const petit = 'rounded-md border border-input bg-background px-2 py-1 text-sm';

const LIBELLES_RESA: Record<string, string> = {
  reservee: 'Réservée',
  annulee_fidele: 'Annulée par le fidèle',
  annulee_pretre: 'Annulée',
  honoree: 'Honorée',
  absent: 'Absent',
};

function MesRegles({ nodeId }: { nodeId: string }) {
  const id = useId();
  const { data: regles = [] } = useRegles(true);
  const { data: lieux = [] } = useLieux(nodeId);
  const creer = useCreerRegle();
  const supprimer = useSupprimerRegle();
  const [lieu, setLieu] = useState<number | null>(null);
  const [jour, setJour] = useState(5);
  const [debut, setDebut] = useState('17:00');
  const [fin, setFin] = useState('18:30');
  const [duree, setDuree] = useState(10);
  const lieuId = lieu ?? lieux[0]?.id ?? null;

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-lg font-semibold">Mes créneaux récurrents</h2>
      <ul className="space-y-1 text-sm">
        {regles.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2">
            <span>
              {JOURS[r.weekday]} · {r.start_time.slice(0, 5)}–
              {r.end_time.slice(0, 5)} · {r.place.name} ({r.slot_minutes} min)
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => supprimer.mutate(r.id)}
            >
              Retirer
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (lieuId === null) return;
          creer.mutate({
            place_id: lieuId,
            weekday: jour,
            start_time: debut,
            end_time: fin,
            slot_minutes: duree,
          });
        }}
      >
        <select
          aria-label="Lieu"
          value={lieuId ?? ''}
          onChange={(e) => setLieu(Number(e.target.value))}
          className={petit}
        >
          {lieux.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Jour"
          value={jour}
          onChange={(e) => setJour(Number(e.target.value))}
          className={petit}
        >
          {JOURS.map((j, n) => (
            <option key={j} value={n}>
              {j}
            </option>
          ))}
        </select>
        <input
          aria-label="Début"
          type="time"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className={petit}
        />
        <input
          aria-label="Fin"
          type="time"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className={petit}
        />
        <label htmlFor={`${id}-m`} className="text-sm">
          <span className="sr-only">Durée d’un créneau (minutes)</span>
          <input
            id={`${id}-m`}
            type="number"
            min={5}
            max={60}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            className={`${petit} w-20`}
          />
        </label>
        <Button type="submit" size="sm" isLoading={creer.isPending}>
          Ajouter
        </Button>
        {creer.error instanceof ApiError && (
          <p role="alert" className="w-full text-sm text-destructive">
            {creer.error.message}
          </p>
        )}
      </form>
    </section>
  );
}

function LigneCreneau({ c, gere }: { c: Creneau; gere: boolean }) {
  const annuler = useAnnulerCreneau();
  const presence = usePresence();
  const debut = new Date(c.starts_at);
  const passe = debut.getTime() < Date.now();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <span>
        {debut.toLocaleString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}{' '}
        · {c.place.name}
        {c.priest_name ? ` · ${c.priest_name}` : ''}
      </span>
      <span className="flex items-center gap-2">
        {c.booking ? (
          <Badge variant="outline">
            {c.booking.person} · {LIBELLES_RESA[c.booking.status] ?? c.booking.status}
          </Badge>
        ) : (
          <Badge variant="outline">
            {c.status === 'bloque' ? 'Bloqué' : 'Libre'}
          </Badge>
        )}
        {gere && c.is_mine && c.booking?.status === 'reservee' && passe && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                presence.mutate({ id: c.booking!.id, attended: true })
              }
            >
              Venu
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                presence.mutate({ id: c.booking!.id, attended: false })
              }
            >
              Absent
            </Button>
          </>
        )}
        {gere && c.is_mine && !passe && c.status !== 'bloque' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => annuler.mutate({ id: c.id })}
          >
            Annuler
          </Button>
        )}
      </span>
    </li>
  );
}

/** Confessions : mes règles (prêtre) et planning des 4 semaines. */
export function ConfessionsStaff() {
  const { data: user } = useUser();
  const { noeud, noeuds, choisir, isLoading } = useNoeudActif(
    'confessions.gerer',
    'confessions.voir_planning',
  );
  const planning = usePlanning(noeud?.id);
  const gere = aCapacite(user, 'confessions.gerer');

  if (isLoading) return null;
  if (!noeud) return <AucunNoeud quoi="les confessions" />;

  return (
    <div className="space-y-8">
      <NoeudSelect noeuds={noeuds} valeur={noeud.id} onChange={choisir} />
      {gere && <MesRegles nodeId={noeud.id} />}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">
          Planning des quatre semaines
        </h2>
        {planning.isLoading ? (
          <SkeletonList />
        ) : (planning.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<CalendarClock />}
            title="Aucun créneau"
            description="Aucun créneau de confession n’est ouvert sur la période."
          />
        ) : (
          <ul className="space-y-2">
            {planning.data?.map((c) => (
              <LigneCreneau key={c.id} c={c} gere={gere} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
