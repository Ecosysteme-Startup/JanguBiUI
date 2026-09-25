'use client';

import * as React from 'react';

import { CapabilityChips } from '@/components/signature/capability-chips';
import { StatusDot, type StatusTone } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { useDebounce } from '@/hooks/use-debounce';
import { dayjs } from '@/utils/dates';

import { type AccountAction, useAccountAction } from '../api/account-action';
import { type Account, type AccountDetail, MFA_LABEL, STATUS_LABEL } from '../api/account-schema';
import { useAccount } from '../api/get-account';
import { type AccountFilters, ACCOUNTS_PAGE, useAccounts } from '../api/get-accounts';

const STATUS_TONE: Record<Account['status'], StatusTone> = { actif: 'ok', verrouille: 'err', a_confirmer: 'warn' };
const when = (iso: string | null) => (iso ? dayjs(iso).format('DD.MM HH:mm') : 'Jamais');

const ACTIONS: Record<AccountAction, { title: string; confirm: string; body: string; done: string; danger?: boolean }> = {
  lock: {
    title: 'Verrouiller ce compte ?',
    confirm: 'Verrouiller le compte',
    body: 'La personne ne pourra plus se connecter et ses sessions ouvertes sont fermées. Ses nominations restent en place. L’opération est inscrite au journal d’audit.',
    done: 'Compte verrouillé.',
    danger: true,
  },
  unlock: {
    title: 'Déverrouiller ce compte ?',
    confirm: 'Déverrouiller',
    body: 'La personne pourra de nouveau se connecter. L’opération est inscrite au journal d’audit.',
    done: 'Compte déverrouillé.',
  },
  'logout-sessions': {
    title: 'Fermer toutes les sessions ?',
    confirm: 'Fermer les sessions',
    body: 'La personne devra se reconnecter sur chacun de ses appareils.',
    done: 'Sessions fermées.',
    danger: true,
  },
  'require-mfa': {
    title: 'Exiger la double authentification ?',
    confirm: 'Forcer la MFA',
    body: 'À sa prochaine connexion, la personne devra configurer une application TOTP ou une clé de sécurité.',
    done: 'MFA exigée à la prochaine connexion.',
  },
};

const Filters = ({ value, onChange }: { value: AccountFilters; onChange: (next: AccountFilters) => void }) => {
  const [q, setQ] = React.useState(value.q ?? '');
  const debounced = useDebounce(q, 300);
  React.useEffect(() => {
    if ((value.q ?? '') !== debounced) onChange({ ...value, q: debounced || undefined, offset: 0 });
  }, [debounced, value, onChange]);
  const set = (patch: Partial<AccountFilters>) => onChange({ ...value, ...patch, offset: 0 });
  const select = 'h-10 text-sm';
  return (
    <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_150px_130px_150px]">
      <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
        <label htmlFor="a-rech" className="tnum text-meta text-ink-3">
          Rechercher
        </label>
        <Input
          id="a-rech"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, e-mail"
          className="h-10 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="a-role" className="tnum text-meta text-ink-3">
          Rôle realm
        </label>
        <Select
          id="a-role"
          className={select}
          value={value.role ?? ''}
          onChange={(e) => set({ role: (e.target.value || undefined) as AccountFilters['role'] })}
        >
          <option value="">Tous</option>
          <option value="fidele">fidele</option>
          <option value="staff">staff</option>
          <option value="platform_admin">platform_admin</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="a-mfa" className="tnum text-meta text-ink-3">
          MFA
        </label>
        <Select
          id="a-mfa"
          className={select}
          value={value.mfa ?? ''}
          onChange={(e) => set({ mfa: (e.target.value || undefined) as AccountFilters['mfa'] })}
        >
          <option value="">Toutes</option>
          <option value="active">Active</option>
          <option value="facultative">Facultative</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="a-statut" className="tnum text-meta text-ink-3">
          Statut
        </label>
        <Select
          id="a-statut"
          className={select}
          value={value.status ?? ''}
          onChange={(e) => set({ status: (e.target.value || undefined) as AccountFilters['status'] })}
        >
          <option value="">Tous</option>
          <option value="actif">Actif</option>
          <option value="verrouille">Verrouillé</option>
          <option value="a_confirmer">E-mail à confirmer</option>
        </Select>
      </div>
    </div>
  );
};

const DetailPanel = ({ account }: { account: AccountDetail }) => {
  const action = useAccountAction();
  const [pending, setPending] = React.useState<AccountAction | null>(null);
  const run = () => {
    if (!pending) return;
    action.mutate(
      { id: account.id, action: pending },
      {
        onSuccess: () => {
          toast.ok(ACTIONS[pending].done);
          setPending(null);
        },
        onError: (error) => toast.err(error.message),
      },
    );
  };
  const locked = account.status === 'verrouille';

  return (
    <section aria-labelledby="a-det" className="border border-line bg-surface p-6">
      <div className="flex items-center gap-4">
        <Avatar name={account.full_name} size={48} />
        <div className="min-w-0">
          <h2 id="a-det" className="m-0 font-serif text-h3 font-normal text-ink">
            {account.full_name}
          </h2>
          <p className="tnum m-0 mt-1 break-all text-meta text-ink-2">
            {account.realm_role} · {account.email}
          </p>
        </div>
      </div>
      <dl className="m-0 mt-5">
        {[
          { label: 'Statut', value: <StatusDot tone={STATUS_TONE[account.status]} label={STATUS_LABEL[account.status]} /> },
          { label: 'Keycloak', value: <span className="tnum break-all text-meta">{account.keycloak_id ?? 'Non lié'}</span> },
          { label: 'E-mail', value: account.email_verified ? 'Vérifié' : 'À confirmer' },
          { label: 'MFA', value: MFA_LABEL[account.mfa] },
          { label: 'Connexion', value: when(account.last_login) },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 border-t border-line py-2.5">
            <dt className="tnum text-meta text-ink-3">{row.label}</dt>
            <dd className="m-0 text-sm text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="tnum m-0 mt-6 text-meta font-normal text-ink-2">Nominations · {account.offices.length}</h3>
      {account.offices.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-ink-3">Aucune nomination.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {account.offices.map((o) => (
            <li key={`${o.office_label}-${o.node_name}`} className="border-t border-line py-3">
              <p className="m-0 flex justify-between gap-3 text-sm font-medium text-ink">
                {o.office_label}
                <span className="tnum text-meta font-normal text-ink-3">{dayjs(o.start_date).format('DD.MM.YYYY')}</span>
              </p>
              <p className="m-0 mb-2 text-sm text-ink-2">{o.node_name}</p>
              <CapabilityChips capabilities={o.capabilities} />
            </li>
          ))}
        </ul>
      )}

      <h3 className="tnum m-0 mt-6 text-meta font-normal text-ink-2">Sessions actives · {account.sessions.length}</h3>
      {account.sessions.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-ink-3">Aucune session ouverte.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {account.sessions.map((s) => (
            <li key={s.id} className="border-t border-line py-2.5 text-sm">
              <span className="block text-ink">{s.client}</span>
              <span className="tnum block text-meta text-ink-3">
                {s.ip} · depuis {when(s.started_at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="m-0 mt-6 flex gap-2 text-sm text-ink-2">
        <Icon name="cadenas" size={16} className="mt-0.5 shrink-0 text-ink-3" />
        <span>Aucun accès aux messages depuis cet écran. Messages chiffrés · aucun administrateur n’y a accès.</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {account.mfa === 'facultative' && (
          <Button variant="secondary" size="sm" onClick={() => setPending('require-mfa')}>
            Forcer la MFA
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => setPending('logout-sessions')} disabled={account.sessions.length === 0}>
          Fermer les sessions
        </Button>
        {locked ? (
          <Button size="sm" className="col-span-2" onClick={() => setPending('unlock')}>
            Déverrouiller le compte
          </Button>
        ) : (
          <Button variant="danger" size="sm" className="col-span-2" onClick={() => setPending('lock')}>
            Verrouiller le compte
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? ACTIONS[pending].title : ''}
        description={`${account.full_name} · ${account.email}`}
        confirmLabel={pending ? ACTIONS[pending].confirm : ''}
        tone={pending && ACTIONS[pending].danger ? 'danger' : 'primary'}
        pending={action.isPending}
        onConfirm={run}
      >
        <p className="m-0 text-base text-ink-2">{pending && ACTIONS[pending].body}</p>
      </ConfirmDialog>
    </section>
  );
};

/** Comptes du realm Keycloak (PLA-Comptes). */
export const ComptesPage = () => {
  const [filters, setFilters] = React.useState<AccountFilters>({});
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const list = useAccounts(filters);
  const rows = list.data?.results ?? [];
  const currentId = selectedId ?? rows[0]?.id ?? null;
  const detail = useAccount(currentId);
  const onFilters = React.useCallback((next: AccountFilters) => setFilters(next), []);

  return (
    <div>
      <PageHeader
        number="03"
        eyebrow="Paramétrage · realm Keycloak « jangubi »"
        title="Comptes"
        actions={
          env.KEYCLOAK_CONSOLE_URL && (
            <Button asChild variant="secondary">
              <a href={env.KEYCLOAK_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
                Console Keycloak
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </Button>
          )
        }
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section aria-label="Liste des comptes" className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <Filters value={filters} onChange={onFilters} />
          {list.isPending ? (
            <LoadingBlock label="Chargement des comptes…" lines={6} />
          ) : list.isError ? (
            <EmptyState tone="err" icon="alerte" title="Les comptes n’ont pas pu être chargés">
              {list.error.message}
            </EmptyState>
          ) : rows.length === 0 ? (
            <EmptyState icon="utilisateurs" title="Aucun compte">
              Aucun compte ne correspond à ces filtres.
            </EmptyState>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Compte</Th>
                    <Th>Rôle realm</Th>
                    <Th>MFA</Th>
                    <Th>Connexion</Th>
                    <Th>Statut</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <Tr key={a.id} selected={a.id === currentId}>
                      <Td>
                        <span className="flex items-center gap-3 py-2">
                          <Avatar name={a.full_name} size={32} />
                          <span className="min-w-0">
                            <button
                              type="button"
                              aria-pressed={a.id === currentId}
                              onClick={() => setSelectedId(a.id)}
                              className="block text-left font-medium text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                            >
                              {a.full_name}
                            </button>
                            <span className="block break-all text-meta text-ink-3">
                              {a.email}
                              {a.node_label && ` · ${a.node_label}`}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td className="tnum text-meta">{a.realm_role}</Td>
                      <Td>{MFA_LABEL[a.mfa]}</Td>
                      <Td className="tnum">{when(a.last_login)}</Td>
                      <Td>
                        <StatusDot tone={STATUS_TONE[a.status]} label={STATUS_LABEL[a.status]} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination
                offset={filters.offset ?? 0}
                limit={ACCOUNTS_PAGE}
                total={list.data.count}
                onChange={(offset) => setFilters((f) => ({ ...f, offset }))}
              />
            </>
          )}
        </section>
        <div className="min-w-0 lg:col-span-4">
          {detail.isPending && currentId ? (
            <LoadingBlock label="Chargement du compte…" lines={6} />
          ) : detail.isError ? (
            <EmptyState tone="err" icon="alerte" title="Ce compte n’a pas pu être chargé">
              {detail.error.message}
            </EmptyState>
          ) : detail.data ? (
            <DetailPanel key={detail.data.id} account={detail.data} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
