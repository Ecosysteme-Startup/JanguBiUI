'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { ApiError } from '@/lib/api-client';

import {
  type ActionCompte,
  COMPTES_PAR_PAGE,
  type Compte,
  LIBELLES_ACTION,
  LIBELLES_MFA,
  LIBELLES_ROLE,
  LIBELLES_STATUT_COMPTE,
  useActionCompte,
  useCompte,
  useComptes,
} from '../api/comptes-plateforme';

const dateHeure = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

function DetailCompte({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data: c } = useCompte(id);
  const action = useActionCompte();
  const actions: ActionCompte[] = c
    ? [
        c.status === 'verrouille' ? 'unlock' : 'lock',
        'logout-sessions',
        ...(c.mfa === 'facultative' ? (['require-mfa'] as const) : []),
      ]
    : [];
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{c?.full_name || c?.email || 'Compte'}</DialogTitle>
          <DialogDescription>{c?.email}</DialogDescription>
        </DialogHeader>
        {c && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd>{LIBELLES_ROLE[c.realm_role]}</dd>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>{LIBELLES_STATUT_COMPTE[c.status]}</dd>
              <dt className="text-muted-foreground">MFA</dt>
              <dd>{LIBELLES_MFA[c.mfa] ?? c.mfa}</dd>
              <dt className="text-muted-foreground">Dernière activité</dt>
              <dd>{dateHeure(c.last_login)}</dd>
            </dl>
            {c.offices.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Offices en cours</p>
                <ul className="space-y-1">
                  {c.offices.map((o, i) => (
                    <li key={i}>
                      {o.office_label} · {o.node_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted-foreground">
              {c.sessions.length} session(s) ouverte(s)
            </p>
            {action.error instanceof ApiError && (
              <p role="alert" className="text-destructive">
                {action.error.status === 503
                  ? 'Le service de connexion est injoignable : aucune action n’a été faite.'
                  : action.error.message}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={a === 'lock' ? 'destructive' : 'outline'}
                  isLoading={
                    action.isPending && action.variables?.action === a
                  }
                  onClick={() => action.mutate({ id: c.id, action: a })}
                >
                  {LIBELLES_ACTION[a]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Comptes de la plateforme (`/v1/platform/accounts/`). */
export function ComptesPlateforme() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [offset, setOffset] = useState(0);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useComptes({
    q,
    role,
    offset,
  });

  const colonnes: DataTableColumn<Compte>[] = [
    {
      header: 'Personne',
      cell: (c) => (
        <button
          type="button"
          onClick={() => setOuvert(c.id)}
          className="text-left"
        >
          <span className="block font-medium text-primary underline-offset-4 hover:underline">
            {c.full_name || c.email}
          </span>
          <span className="text-xs text-muted-foreground">{c.email}</span>
        </button>
      ),
    },
    { header: 'Rôle', cell: (c) => LIBELLES_ROLE[c.realm_role] },
    { header: 'Communauté', cell: (c) => c.node_label ?? '—', hideOnMobile: true },
    { header: 'MFA', cell: (c) => LIBELLES_MFA[c.mfa] ?? c.mfa },
    {
      header: 'Statut',
      cell: (c) => (
        <Badge variant={c.status === 'actif' ? 'success' : 'outline'}>
          {LIBELLES_STATUT_COMPTE[c.status]}
        </Badge>
      ),
    },
    { header: 'Dernière activité', cell: (c) => dateHeure(c.last_login) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Rechercher un compte"
            placeholder="E-mail, prénom ou nom"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
        <FilterPills
          options={[
            { value: '', label: 'Tous' },
            { value: 'fidele', label: 'Fidèles' },
            { value: 'staff', label: 'Responsables' },
            { value: 'platform_admin', label: 'Plateforme' },
          ]}
          value={role}
          onChange={(v) => {
            setRole(v);
            setOffset(0);
          }}
          ariaLabel="Filtrer par rôle"
        />
      </div>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results}
          columns={colonnes}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          caption="Comptes de la plateforme"
          pagination={
            data
              ? {
                  count: data.count,
                  limit: COMPTES_PAR_PAGE,
                  offset,
                  onOffsetChange: setOffset,
                }
              : undefined
          }
        />
      )}
      <DetailCompte id={ouvert} onClose={() => setOuvert(null)} />
    </div>
  );
}
