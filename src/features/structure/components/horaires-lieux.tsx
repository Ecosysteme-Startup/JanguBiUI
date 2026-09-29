'use client';

import { Church, Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

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
  type Horaire,
  JOURS,
  LIBELLES_HORAIRE,
  LIBELLES_LIEU,
  type Lieu,
  useAjouterException,
  useCreerLieu,
  useEnregistrerHoraires,
  useExceptions,
  useHoraires,
  useLieux,
  useSupprimerException,
} from '../api/lieux';

const petit =
  'rounded-md border border-input bg-background px-2 py-1 text-sm';

const heure = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

function SemaineType({ lieu }: { lieu: Lieu }) {
  const { data, isLoading } = useHoraires(lieu.id);
  const enregistrer = useEnregistrerHoraires(lieu.id);
  const [lignes, setLignes] = useState<Horaire[]>([]);
  const [modifie, setModifie] = useState(false);

  useEffect(() => {
    if (data) {
      setLignes(data);
      setModifie(false);
    }
  }, [data]);

  const maj = (i: number, champ: Partial<Horaire>) => {
    setLignes((l) => l.map((h, j) => (j === i ? { ...h, ...champ } : h)));
    setModifie(true);
  };

  if (isLoading) return <SkeletonList />;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Semaine type</h3>
      {lignes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun horaire enregistré pour ce lieu.
        </p>
      )}
      <ul className="space-y-2">
        {lignes.map((h, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Jour"
              value={h.weekday}
              onChange={(e) => maj(i, { weekday: Number(e.target.value) })}
              className={petit}
            >
              {JOURS.map((j, n) => (
                <option key={j} value={n}>
                  {j}
                </option>
              ))}
            </select>
            <select
              aria-label="Célébration"
              value={h.kind}
              onChange={(e) => maj(i, { kind: e.target.value })}
              className={petit}
            >
              {Object.entries(LIBELLES_HORAIRE).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              aria-label="Heure"
              type="time"
              value={heure(h.start_time)}
              onChange={(e) => maj(i, { start_time: e.target.value })}
              className={petit}
            />
            <input
              aria-label="Langue"
              placeholder="Langue"
              value={h.language}
              onChange={(e) => maj(i, { language: e.target.value })}
              className={`${petit} w-28`}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Retirer cet horaire"
              onClick={() => {
                setLignes((l) => l.filter((_, j) => j !== i));
                setModifie(true);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {enregistrer.error instanceof ApiError && (
        <p role="alert" className="text-sm text-destructive">
          {enregistrer.error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Plus className="size-4" />}
          onClick={() => {
            setLignes((l) => [
              ...l,
              {
                kind: 'messe',
                weekday: 6,
                start_time: '09:00',
                language: '',
                note: '',
              },
            ]);
            setModifie(true);
          }}
        >
          Ajouter un horaire
        </Button>
        <Button
          size="sm"
          disabled={!modifie}
          isLoading={enregistrer.isPending}
          onClick={() => enregistrer.mutate(lignes)}
        >
          Enregistrer la semaine
        </Button>
      </div>
    </section>
  );
}

function Exceptions({ lieu }: { lieu: Lieu }) {
  const id = useId();
  const { data = [] } = useExceptions(lieu.id);
  const ajouter = useAjouterException(lieu.id);
  const supprimer = useSupprimerException(lieu.id);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Exceptions (annulations)</h3>
      <ul className="space-y-1 text-sm">
        {data.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2">
            <span>
              {new Date(e.date).toLocaleDateString('fr-FR')} ·{' '}
              {LIBELLES_HORAIRE[e.kind] ?? e.kind}
              {e.cancelled ? ' annulée' : ` à ${heure(e.start_time)}`}
              {e.note ? ` · ${e.note}` : ''}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => supprimer.mutate(e.id)}
            >
              Retirer
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!date) return;
          ajouter.mutate(
            { date, kind: 'messe', cancelled: true, note },
            {
              onSuccess: () => {
                setDate('');
                setNote('');
              },
            },
          );
        }}
      >
        <label htmlFor={`${id}-d`} className="text-sm">
          <span className="block text-muted-foreground">Date annulée</span>
          <input
            id={`${id}-d`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={petit}
          />
        </label>
        <label htmlFor={`${id}-n`} className="text-sm">
          <span className="block text-muted-foreground">Motif</span>
          <input
            id={`${id}-n`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={petit}
          />
        </label>
        <Button type="submit" size="sm" isLoading={ajouter.isPending}>
          Ajouter
        </Button>
      </form>
    </section>
  );
}

function NouveauLieu({ nodeId }: { nodeId: string }) {
  const id = useId();
  const creer = useCreerLieu(nodeId);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('chapelle');
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nom.trim()) return;
        creer.mutate(
          { name: nom.trim(), kind: type },
          { onSuccess: () => setNom('') },
        );
      }}
    >
      <label htmlFor={`${id}-n`} className="text-sm">
        <span className="block text-muted-foreground">Nouveau lieu</span>
        <input
          id={`${id}-n`}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className={petit}
        />
      </label>
      <select
        aria-label="Type de lieu"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={petit}
      >
        {Object.entries(LIBELLES_LIEU).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" isLoading={creer.isPending}>
        Ajouter
      </Button>
      {creer.error instanceof ApiError && (
        <p role="alert" className="w-full text-sm text-destructive">
          {creer.error.message}
        </p>
      )}
    </form>
  );
}

/** Lieux de culte et horaires d'une communauté (horaires.gerer). */
export function HorairesLieux() {
  const { data: user } = useUser();
  const { noeud, noeuds, choisir, isLoading } = useNoeudActif(
    'horaires.gerer',
    'structure.gerer',
  );
  const { data: lieux, isLoading: chargement } = useLieux(noeud?.id);
  const [lieuId, setLieuId] = useState<number | null>(null);

  if (isLoading) return null;
  if (!noeud) return <AucunNoeud quoi="la gestion des horaires" />;
  const lieu = lieux?.find((l) => l.id === lieuId) ?? lieux?.[0] ?? null;

  return (
    <div className="space-y-5">
      <NoeudSelect
        noeuds={noeuds}
        valeur={noeud.id}
        onChange={(id) => {
          choisir(id);
          setLieuId(null);
        }}
      />
      {chargement ? (
        <SkeletonList />
      ) : !lieux || lieux.length === 0 ? (
        <EmptyState
          icon={<Church />}
          title="Aucun lieu de culte"
          description="Aucun lieu de culte n’est encore enregistré pour cette communauté."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <ul className="space-y-1" aria-label="Lieux de culte">
            {lieux.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  aria-current={l.id === lieu?.id ? 'true' : undefined}
                  onClick={() => setLieuId(l.id)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm aria-[current=true]:border-primary aria-[current=true]:bg-primary/5"
                >
                  <span className="block font-medium">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {LIBELLES_LIEU[l.kind] ?? l.kind}
                  </span>{' '}
                  {!l.is_active && <Badge variant="outline">Fermé</Badge>}
                </button>
              </li>
            ))}
          </ul>
          {lieu && (
            <div className="space-y-6 rounded-xl border border-border bg-card p-4 md:col-span-2">
              {aCapacite(user, 'horaires.gerer') ? (
                <>
                  <SemaineType key={lieu.id} lieu={lieu} />
                  <Exceptions lieu={lieu} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Les horaires relèvent de la capacité « horaires ».
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {aCapacite(user, 'structure.gerer') && <NouveauLieu nodeId={noeud.id} />}
    </div>
  );
}
