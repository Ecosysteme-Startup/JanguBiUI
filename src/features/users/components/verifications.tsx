'use client';

import { Paperclip, UserCheck } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import {
  type Decision,
  type Declaration,
  LIBELLES_ETAT,
  LIBELLES_ORDRE,
  useDecider,
  useDeclarations,
} from '../api/verifications';

function Carte({ d }: { d: Declaration }) {
  const id = useId();
  const [note, setNote] = useState('');
  const decider = useDecider();
  const envoyer = (decision: Decision) =>
    decider.mutate({ personId: d.id, decision, note });
  const statut = [LIBELLES_ETAT[d.etat_de_vie], LIBELLES_ORDRE[d.degre_ordre]]
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="font-medium">{d.full_name || d.email}</p>
        <p className="text-sm text-muted-foreground">
          Déclare : {statut}
          {d.incardination_node ? ` · ${d.incardination_node.name}` : ''}
          {d.institut_node ? ` · ${d.institut_node.name}` : ''}
        </p>
        {d.verification_note && (
          <p className="text-sm text-muted-foreground">
            Complément demandé : {d.verification_note}
          </p>
        )}
      </div>
      {d.attachments.length > 0 && (
        <ul className="space-y-1">
          {d.attachments.map((a) =>
            a.url ? (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <Paperclip className="size-4" aria-hidden="true" />
                  {a.file_name}
                </a>
              </li>
            ) : null,
          )}
        </ul>
      )}
      <div>
        <label htmlFor={id} className="text-sm">
          Note transmise à la personne (obligatoire pour un complément)
        </label>
        <input
          id={id}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
      </div>
      {decider.error instanceof ApiError && (
        <p role="alert" className="text-sm text-destructive">
          {decider.error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => envoyer('verifie')}
          disabled={decider.isPending}
        >
          Vérifier
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => envoyer('complement')}
          disabled={decider.isPending || !note.trim()}
        >
          Demander un complément
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => envoyer('rejete')}
          disabled={decider.isPending}
        >
          Refuser
        </Button>
      </div>
    </li>
  );
}

/** File des déclarations à vérifier (`/v1/hierarchy/verifications/`). */
export function Verifications() {
  const [statut, setStatut] = useState<'declare' | 'complement'>('declare');
  const { data, isLoading, isError, refetch } = useDeclarations(statut, 0);
  return (
    <div className="space-y-4">
      <FilterPills
        options={[
          { value: 'declare', label: 'À vérifier' },
          { value: 'complement', label: 'En attente de complément' },
        ]}
        value={statut}
        onChange={(v) => setStatut(v as 'declare' | 'complement')}
        ariaLabel="Filtrer les déclarations"
      />
      {isLoading ? (
        <SkeletonList />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data?.results.length ?? 0) === 0 ? (
        <EmptyState
          icon={<UserCheck />}
          title="Aucune déclaration"
          description="Aucune déclaration n’attend de décision dans votre périmètre."
        />
      ) : (
        <ul className="space-y-3">
          {data?.results.map((d) => <Carte key={d.id} d={d} />)}
        </ul>
      )}
    </div>
  );
}
