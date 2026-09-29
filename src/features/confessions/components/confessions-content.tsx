'use client';

import { CalendarClock, MapPin, UserRound } from 'lucide-react';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useMesParoisses } from '@/lib/paroisses/api';

import {
  BOOKING_STATUS_LABELS,
  type ConfessionBooking,
  type ConfessionSlot,
  messageConfession,
  useBookSlot,
  useCancelBooking,
  useInfiniteSlots,
  useMyBookings,
} from '../api/confessions';

const TZ = 'Africa/Dakar';

const jour = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  });

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });

const codeOf = (err: unknown) => (err instanceof ApiError ? err.code : null);

function MesRendezVous() {
  const { addNotification } = useNotifications();
  const { data, isLoading } = useMyBookings();
  const annuler = useCancelBooking();
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  const actifs = (data?.results ?? []).filter((b) => b.status === 'reservee');
  const passes = (data?.results ?? []).filter((b) => b.status !== 'reservee');
  if (actifs.length === 0 && passes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous n’avez pas de rendez-vous.
      </p>
    );
  }

  const onAnnuler = (b: ConfessionBooking) =>
    annuler.mutate(b.id, {
      onSuccess: () => {
        setAConfirmer(null);
        addNotification({
          type: 'success',
          title: 'Rendez-vous annulé',
          message: 'Le créneau est de nouveau disponible.',
        });
      },
      onError: (err) =>
        addNotification({
          type: 'error',
          title: 'Annulation',
          message: messageConfession(codeOf(err)),
        }),
    });

  return (
    <ul className="space-y-2">
      {[...actifs, ...passes].map((b) => (
        <li key={b.id}>
          <Card variant="elevated" className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium capitalize text-foreground">
                  {jour(b.slot.starts_at)} · {heure(b.slot.starts_at)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {b.slot.priest_name} · {b.slot.place.name}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {BOOKING_STATUS_LABELS[b.status]}
              </span>
            </div>
            {b.cancel_message && (
              <p className="text-sm text-muted-foreground">
                {b.cancel_message}
              </p>
            )}
            {b.status === 'reservee' && b.can_cancel && (
              <div className="flex gap-2">
                {aConfirmer === b.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      isLoading={annuler.isPending}
                      onClick={() => onAnnuler(b)}
                    >
                      Confirmer l’annulation
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAConfirmer(null)}
                    >
                      Garder
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAConfirmer(b.id)}
                  >
                    Annuler le rendez-vous
                  </Button>
                )}
              </div>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function CreneauxDisponibles() {
  const { addNotification } = useNotifications();
  const { data: mes } = useMesParoisses();
  const [node, setNode] = useState<string>('');
  const nodeEffectif =
    node || mes?.find((p) => p.principale)?.paroisse.id || '';
  const slots = useInfiniteSlots(nodeEffectif ? { node: nodeEffectif } : {});
  const reserver = useBookSlot();
  const [choisi, setChoisi] = useState<ConfessionSlot | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const tous = slots.data?.pages.flatMap((p) => p.results) ?? [];
  const parJour = new Map<string, ConfessionSlot[]>();
  for (const s of tous) {
    const k = jour(s.starts_at);
    parJour.set(k, [...(parJour.get(k) ?? []), s]);
  }

  const confirmer = () => {
    if (!choisi) return;
    setErreur(null);
    reserver.mutate(choisi.id, {
      onSuccess: () => {
        setChoisi(null);
        addNotification({
          type: 'success',
          title: 'Rendez-vous pris',
          message: 'Votre rendez-vous est enregistré.',
        });
      },
      onError: (err) => setErreur(messageConfession(codeOf(err))),
    });
  };

  return (
    <div className="space-y-4">
      {mes && mes.length > 1 && (
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Paroisse
          <select
            aria-label="Paroisse"
            value={nodeEffectif}
            onChange={(e) => setNode(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {mes.map((p) => (
              <option key={p.paroisse.id} value={p.paroisse.id}>
                {p.paroisse.name}
                {p.principale ? ' (principale)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {slots.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
      {slots.isError && (
        <p role="alert" className="text-sm text-muted-foreground">
          Les créneaux n’ont pas pu être chargés.
        </p>
      )}
      {!slots.isLoading && !slots.isError && tous.length === 0 && (
        <EmptyState
          icon={<CalendarClock />}
          title="Aucun créneau libre"
          description="Aucun créneau n’est ouvert pour le moment dans cette paroisse."
        />
      )}

      {Array.from(parJour.entries()).map(([j, liste]) => (
        <section key={j} className="space-y-2">
          <h3 className="text-sm font-semibold capitalize text-foreground">
            {j}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {liste.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setErreur(null);
                  setChoisi(s);
                }}
                className={
                  'rounded-xl border px-3 py-2 text-left text-sm transition-colors ' +
                  (choisi?.id === s.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40')
                }
                aria-pressed={choisi?.id === s.id}
              >
                <span className="block font-medium text-foreground">
                  {heure(s.starts_at)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.priest_name}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {slots.hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          isLoading={slots.isFetchingNextPage}
          onClick={() => void slots.fetchNextPage()}
        >
          Voir plus de créneaux
        </Button>
      )}

      {choisi && (
        <Card variant="elevated" className="sticky bottom-4 space-y-3 p-4">
          <p className="font-medium capitalize text-foreground">
            {jour(choisi.starts_at)} · {heure(choisi.starts_at)} –{' '}
            {heure(choisi.ends_at)}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserRound className="size-4" /> {choisi.priest_name}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {choisi.place.name}
            {choisi.place.address ? `, ${choisi.place.address}` : ''}
          </p>
          {erreur && (
            <p role="alert" className="text-sm text-destructive">
              {erreur}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={confirmer} isLoading={reserver.isPending}>
              Réserver ce créneau
            </Button>
            <Button variant="ghost" onClick={() => setChoisi(null)}>
              Fermer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ConfessionsContent() {
  useRegisterPageMeta({
    title: 'Confession',
    subtitle: 'Prendre rendez-vous avec un prêtre',
  });
  return (
    <ContentContainer>
      <div className="flex flex-col gap-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Mes rendez-vous
          </h2>
          <MesRendezVous />
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Prendre rendez-vous
          </h2>
          <p className="text-sm text-muted-foreground">
            Le contenu de la confession n’est jamais demandé ni enregistré :
            seul le créneau est réservé.
          </p>
          <CreneauxDisponibles />
        </section>
      </div>
    </ContentContainer>
  );
}
