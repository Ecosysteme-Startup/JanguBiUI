'use client';

import { Building2 } from 'lucide-react';
import { useId, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { useUser } from '@/lib/auth';
import {
  type Capacite,
  type NoeudStaff,
  libelleTypeNoeud,
  noeudsPour,
} from '@/lib/staff/capacites';

/**
 * Nœud de travail d'un écran staff : le premier nœud où s'exerce la capacité,
 * ou celui choisi dans le sélecteur quand la personne en a plusieurs.
 */
export function useNoeudActif(...capacites: Capacite[]) {
  const { data: user, isLoading } = useUser();
  const noeuds = noeudsPour(user, ...capacites);
  const [choix, setChoix] = useState<string | null>(null);
  const noeud: NoeudStaff | null =
    noeuds.find((n) => n.id === choix) ?? noeuds[0] ?? null;
  return { noeud, noeuds, choisir: setChoix, isLoading };
}

/** Sélecteur du nœud (masqué quand il n'y en a qu'un). */
export function NoeudSelect({
  noeuds,
  valeur,
  onChange,
  label = 'Communauté',
}: {
  noeuds: NoeudStaff[];
  valeur: string | null | undefined;
  onChange: (id: string) => void;
  label?: string;
}) {
  const id = useId();
  if (noeuds.length < 2) return null;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        {noeuds.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name} ({libelleTypeNoeud(n.type)})
          </option>
        ))}
      </select>
    </div>
  );
}

/** État « aucun nœud » : la personne n'a pas (ou plus) de nomination utile. */
export function AucunNoeud({ quoi }: { quoi: string }) {
  return (
    <EmptyState
      icon={<Building2 />}
      title="Vue non ouverte"
      description={`Aucune nomination en cours ne vous ouvre ${quoi}.`}
    />
  );
}
