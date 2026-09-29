'use client';

import { Download, Search, UserPlus } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ErrorState } from '@/components/ui/error-state';
import { saveBlob } from '@/lib/api-client';

import {
  type Compte,
  COMPTES_PAR_PAGE,
  exporterComptes,
  type FiltresComptes,
  LIBELLES_ETAT_DE_VIE,
  LIBELLES_ROLE,
  LIBELLES_STATUT,
  LIBELLES_SYNC,
  ROLES,
  STATUTS,
  SYNCS,
  ETATS_DE_VIE,
  useComptes,
  usePerimetre,
} from '../api/admin-comptes';

import { useCheminsComptes } from './chemins';
import {
  Avatar,
  BadgeStatut,
  BadgeSync,
  champ,
  dateHeure,
  MessageErreur,
  nombre,
} from './commun';

const TRIS = [
  { v: '-created_at', l: 'Plus récents' },
  { v: 'last_name', l: 'Nom (A → Z)' },
  { v: '-last_login', l: 'Dernière connexion' },
];

/** Liste des comptes du périmètre, filtres du contrat, export CSV. */
export function ListeComptes() {
  const chemins = useCheminsComptes();
  const id = useId();
  const sp = useSearchParams();
  const init = (k: string) => sp?.get(k) ?? '';
  const [f, setF] = useState<FiltresComptes>({
    q: init('q'),
    status: init('status'),
    role: init('role'),
    sync: init('sync'),
    etat_de_vie: init('etat_de_vie'),
    node: init('node'),
    ordering: init('ordering') || '-created_at',
    offset: 0,
  });
  const [exportErreur, setExportErreur] = useState<unknown>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const { data: perimetre } = usePerimetre();
  const { data, isLoading, isError, refetch } = useComptes(f);
  const maj = (p: Partial<FiltresComptes>) =>
    setF((a) => ({ ...a, ...p, offset: 0 }));
  const c = chemins;

  const roles = ROLES.filter(
    (r) => r !== 'platform_admin' || perimetre?.is_platform_admin,
  );
  const actifs = (
    ['status', 'role', 'sync', 'etat_de_vie', 'node', 'q'] as const
  ).filter((k) => f[k]);

  const exporter = async () => {
    setExportErreur(null);
    setExportEnCours(true);
    try {
      saveBlob(await exporterComptes(f), 'comptes.csv');
    } catch (e) {
      setExportErreur(e);
    } finally {
      setExportEnCours(false);
    }
  };

  const columns: DataTableColumn<Compte>[] = [
    {
      header: 'Compte',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar nom={r.full_name || r.email} />
          <div className="min-w-0">
            <NextLink
              href={c.fiche.getHref(r.id)}
              className="block truncate font-medium hover:text-primary"
            >
              {r.full_name || r.email}
            </NextLink>
            <span className="block truncate text-13 text-ink-3">{r.email}</span>
          </div>
        </div>
      ),
    },
    { header: 'Rôle', cell: (r) => LIBELLES_ROLE[r.role] },
    { header: 'Rattachement', cell: (r) => r.admin_node?.name ?? '—' },
    { header: 'Statut', cell: (r) => <BadgeStatut status={r.status} /> },
    {
      header: 'E-mail vérifié',
      cell: (r) => (r.email_verified ? 'Oui' : 'Non'),
    },
    { header: 'Keycloak', cell: (r) => <BadgeSync sync={r.sync} /> },
    {
      header: 'Dernière connexion',
      cell: (r) => (r.last_login ? dateHeure(r.last_login) : 'Jamais'),
    },
  ];

  const select = (
    k: keyof FiltresComptes,
    label: string,
    options: readonly string[],
    libelles: Record<string, string>,
    tous: string,
  ) => (
    <div>
      <label htmlFor={`${id}-${k}`} className="text-13 font-medium">
        {label}
      </label>
      <select
        id={`${id}-${k}`}
        value={(f[k] as string) ?? ''}
        onChange={(e) => maj({ [k]: e.target.value })}
        className={champ}
      >
        <option value="">{tous}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {libelles[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-24 font-semibold">Comptes</h2>
          <p className="text-14 text-ink-3">
            {data
              ? `${nombre(data.count)} compte(s) dans votre portée.`
              : 'Chargement…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exporter} loading={exportEnCours}>
            <Download className="size-4" />
            Exporter en CSV
          </Button>
          <Button asChild>
            <NextLink href={c.nouveau.getHref()}>
              <UserPlus className="size-4" />
              Créer un compte
            </NextLink>
          </Button>
        </div>
      </div>
      <MessageErreur error={exportErreur} />

      <div className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-q`} className="text-13 font-medium">
            Rechercher
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 mt-0.5 size-4 -translate-y-1/2 text-ink-3"
            />
            <input
              id={`${id}-q`}
              type="search"
              placeholder="Nom, e-mail ou téléphone"
              value={f.q ?? ''}
              onChange={(e) => maj({ q: e.target.value })}
              className={`${champ} pl-9`}
            />
          </div>
        </div>
        {select('role', 'Rôle', roles, LIBELLES_ROLE, 'Tous les rôles')}
        {select('status', 'Statut', STATUTS, LIBELLES_STATUT, 'Tous')}
        {select('sync', 'Keycloak', SYNCS, LIBELLES_SYNC, 'Indifférent')}
        {perimetre && perimetre.nodes.length > 0 && (
          <div>
            <label htmlFor={`${id}-node`} className="text-13 font-medium">
              Diocèse / paroisse
            </label>
            <select
              id={`${id}-node`}
              value={f.node ?? ''}
              onChange={(e) => maj({ node: e.target.value })}
              className={champ}
            >
              <option value="">Tout mon périmètre</option>
              {perimetre.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {select(
          'etat_de_vie',
          'État de vie',
          ETATS_DE_VIE,
          LIBELLES_ETAT_DE_VIE,
          'Tous',
        )}
        <div>
          <label htmlFor={`${id}-o`} className="text-13 font-medium">
            Trier par
          </label>
          <select
            id={`${id}-o`}
            value={f.ordering}
            onChange={(e) => maj({ ordering: e.target.value })}
            className={champ}
          >
            {TRIS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        {actifs.length > 0 && (
          <div className="flex items-end sm:col-span-2 lg:col-span-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                maj({
                  q: '',
                  status: '',
                  role: '',
                  sync: '',
                  etat_de_vie: '',
                  node: '',
                })
              }
            >
              Effacer les filtres ({actifs.length})
            </Button>
          </div>
        )}
      </div>

      {isError ? (
        <ErrorState
          description="La liste des comptes n’a pas pu être chargée."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          caption="Comptes de votre périmètre"
          data={data?.results}
          columns={columns}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          pagination={
            data
              ? {
                  count: data.count,
                  limit: COMPTES_PAR_PAGE,
                  offset: f.offset ?? 0,
                  onOffsetChange: (offset) => setF((a) => ({ ...a, offset })),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
