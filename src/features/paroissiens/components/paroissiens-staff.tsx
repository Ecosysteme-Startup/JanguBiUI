'use client';

import { RotateCcw, Search, UserMinus, Users } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { ApiError } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { parishionerNodes } from '@/lib/authorization';
import { formatDateAdhesion } from '@/lib/paroisses/api';
import { cn } from '@/lib/utils';

import {
  type Membre,
  MEMBRES_PAR_PAGE,
  useMembres,
  useRetablirMembre,
  useRetirerMembre,
} from '../api/membres';

const nom = (m: Membre) =>
  [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Paroissien';

function RetirerDialog({
  membre,
  paroisse,
  onOpenChange,
  onConfirm,
  pending,
}: {
  membre: Membre | null;
  paroisse: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={!!membre} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Retirer {membre ? nom(membre) : ''} des paroissiens ?
          </DialogTitle>
          <DialogDescription>
            {membre ? nom(membre) : 'Cette personne'} ne pourra plus écouter les
            enregistrements réservés de {paroisse}, ni s’y réinscrire seule. Ses
            téléchargements de ces enregistrements seront retirés de ses
            appareils. Elle en est prévenue. Vous pourrez la rétablir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={pending}
          >
            Retirer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Paroissiens d'une paroisse (capacité `paroissiens.gerer`, décisions 6-8) :
 * liste alphabétique des membres (paroisse principale ou secondaire),
 * recherche, retrait avec confirmation et rétablissement. Aucun classement.
 */
export function ParoissiensStaff() {
  const { data: user } = useUser();
  const noeuds = parishionerNodes(user);
  const [choix, setChoix] = useState<string | null>(null);
  const paroisse = noeuds.find((n) => n.id === choix) ?? noeuds[0] ?? null;
  const [retires, setRetires] = useState(false);
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [aRetirer, setARetirer] = useState<Membre | null>(null);
  const idSelect = useId();

  const membres = useMembres({
    paroisseId: paroisse?.id ?? '',
    q,
    retires,
    offset,
  });
  const retirer = useRetirerMembre(paroisse?.id ?? '');
  const retablir = useRetablirMembre(paroisse?.id ?? '');

  if (!paroisse) {
    return (
      <EmptyState
        icon={<Users />}
        title="Aucune paroisse à gérer"
        description="La liste des paroissiens est réservée au curé et au secrétariat paroissial."
      />
    );
  }

  const data = membres.data;
  const mfa =
    membres.error instanceof ApiError &&
    (membres.error.code === 'mfa_required' || membres.error.status === 403);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Paroissiens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les fidèles membres de {paroisse.name}, en paroisse principale ou
            secondaire. L’adhésion est libre ; vous pouvez retirer un membre et
            le rétablir.
          </p>
        </div>
        {noeuds.length > 1 && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={idSelect}
              className="text-xs font-medium text-muted-foreground"
            >
              Paroisse
            </label>
            <select
              id={idSelect}
              value={paroisse.id}
              onChange={(e) => {
                setChoix(e.target.value);
                setOffset(0);
              }}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {noeuds.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Liste"
          className="inline-flex gap-0.5 self-start rounded-xl bg-muted p-1"
        >
          {[
            { v: false, label: 'Membres' },
            { v: true, label: 'Retirés' },
          ].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={retires === v}
              onClick={() => {
                setRetires(v);
                setOffset(0);
              }}
              className={cn(
                'h-9 rounded-lg px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                retires === v
                  ? 'bg-card font-semibold text-foreground shadow-soft-sm'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary sm:max-w-sm">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Nom ou prénom"
            aria-label="Rechercher un paroissien"
            className="h-full min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
        {data && (
          <p className="text-sm text-muted-foreground sm:ml-auto">
            {data.count} {retires ? 'retiré' : 'membre'}
            {data.count > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {membres.isLoading ? (
        <SkeletonList count={6} />
      ) : membres.isError ? (
        mfa ? (
          <EmptyState
            icon={<Users />}
            title="Accès protégé"
            description="Cette liste nominative demande une connexion avec double authentification. Reconnectez-vous pour y accéder."
          />
        ) : (
          <ErrorState
            description="La liste des paroissiens n’a pas pu être chargée."
            onRetry={() => void membres.refetch()}
          />
        )
      ) : !data?.results.length ? (
        <EmptyState
          icon={<Users />}
          title={
            q.trim()
              ? 'Aucun paroissien trouvé'
              : retires
                ? 'Aucun membre retiré'
                : 'Aucun paroissien pour l’instant'
          }
          description={
            q.trim()
              ? `Aucun nom ne correspond à « ${q.trim()} ».`
              : retires
                ? 'Les membres retirés par la paroisse apparaîtront ici.'
                : 'Les fidèles qui ajoutent votre paroisse apparaîtront ici.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm">
          <table
            className="w-full table-fixed text-sm"
            aria-label={
              retires
                ? `Membres retirés de ${paroisse.name}`
                : `Paroissiens de ${paroisse.name}`
            }
          >
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-3 pl-4 pr-3 font-semibold">
                  Nom
                </th>
                <th
                  scope="col"
                  className="hidden w-40 py-3 pr-3 font-semibold sm:table-cell"
                >
                  Paroisse
                </th>
                <th
                  scope="col"
                  className="hidden w-48 py-3 pr-3 font-semibold md:table-cell"
                >
                  {retires ? 'Retiré le' : 'Membre depuis'}
                </th>
                <th scope="col" className="w-36 py-3 pr-4 text-right">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((m) => (
                <tr
                  key={m.user_id}
                  className="border-b border-border last:border-0"
                >
                  <td className="truncate py-3 pl-4 pr-3 font-medium text-foreground">
                    {nom(m)}
                  </td>
                  <td className="hidden py-3 pr-3 text-muted-foreground sm:table-cell">
                    {m.principale ? 'Principale' : 'Secondaire'}
                  </td>
                  <td className="hidden py-3 pr-3 text-muted-foreground md:table-cell">
                    {formatDateAdhesion(
                      retires ? m.retire_le : m.membre_depuis,
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {retires ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        icon={<RotateCcw className="size-3.5" aria-hidden />}
                        aria-label={`Rétablir ${nom(m)}`}
                        isLoading={
                          retablir.isPending && retablir.variables === m.user_id
                        }
                        onClick={() => retablir.mutate(m.user_id)}
                      >
                        Rétablir
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        icon={<UserMinus className="size-3.5" aria-hidden />}
                        aria-label={`Retirer ${nom(m)}`}
                        onClick={() => setARetirer(m)}
                      >
                        Retirer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.previous || data.next) && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!data.previous}
                onClick={() =>
                  setOffset((o) => Math.max(0, o - MEMBRES_PAR_PAGE))
                }
              >
                Précédents
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!data.next}
                onClick={() => setOffset((o) => o + MEMBRES_PAR_PAGE)}
              >
                Suivants
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-[13px] leading-[18px] text-muted-foreground">
        Les demandes d’actes ne dépendent pas de cette liste : elles restent à
        la paroisse du sacrement.
      </p>

      <RetirerDialog
        membre={aRetirer}
        paroisse={paroisse.name}
        pending={retirer.isPending}
        onOpenChange={(open) => {
          if (!open) setARetirer(null);
        }}
        onConfirm={() => {
          if (!aRetirer) return;
          retirer.mutate(aRetirer.user_id, {
            onSettled: () => setARetirer(null),
          });
        }}
      />
    </div>
  );
}
