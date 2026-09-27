'use client';

import * as React from 'react';

import { CapabilityChips } from '@/components/signature/capability-chips';
import { StatusDot, type StatusTone } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';
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

const ROLE_LABEL: Record<Account['realm_role'], string> = { fidele: 'Fidèle', staff: 'Staff', platform_admin: 'Admin plateforme' };

const ROLE_TABS: { value: string; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'staff', label: 'Staff' },
  { value: 'fidele', label: 'Fidèles' },
  { value: 'platform_admin', label: 'Admin plateforme' },
];

const pill = (set: boolean) =>
  cn(
    'h-9 w-auto rounded-full pl-3.5 text-14 font-medium',
    set ? 'border-line-active bg-tint-50 text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field',
  );

const Filters = ({ value, onChange }: { value: AccountFilters; onChange: (next: AccountFilters) => void }) => {
  const [q, setQ] = React.useState(value.q ?? '');
  const debounced = useDebounce(q, 300);
  React.useEffect(() => {
    if ((value.q ?? '') !== debounced) onChange({ ...value, q: debounced || undefined, offset: 0 });
  }, [debounced, value, onChange]);
  const set = (patch: Partial<AccountFilters>) => onChange({ ...value, ...patch, offset: 0 });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="a-rech" className="sr-only">
        Rechercher
      </label>
      <div className="w-full sm:w-72">
        <Input
          id="a-rech"
          type="search"
          icon="recherche"
          controlSize="sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom ou e-mail"
          className="h-9 rounded-10 text-14"
        />
      </div>
      <div>
        <label htmlFor="a-mfa" className="sr-only">
          MFA
        </label>
        <Select
          id="a-mfa"
          controlSize="sm"
          className={pill(Boolean(value.mfa))}
          value={value.mfa ?? ''}
          onChange={(e) => set({ mfa: (e.target.value || undefined) as AccountFilters['mfa'] })}
        >
          <option value="">Double authentification</option>
          <option value="active">MFA active</option>
          <option value="facultative">MFA facultative</option>
        </Select>
      </div>
      <div>
        <label htmlFor="a-statut" className="sr-only">
          Statut
        </label>
        <Select
          id="a-statut"
          controlSize="sm"
          className={pill(Boolean(value.status))}
          value={value.status ?? ''}
          onChange={(e) => set({ status: (e.target.value || undefined) as AccountFilters['status'] })}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="verrouille">Verrouillé</option>
          <option value="a_confirmer">E-mail à confirmer</option>
        </Select>
      </div>
    </div>
  );
};

const PanelSection = ({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) => (
  <div className="border-t border-line px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <h3 className="m-0 text-15 font-semibold text-ink">{title}</h3>
      {aside}
    </div>
    <div className="mt-2">{children}</div>
  </div>
);

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
  const mfaOn = account.mfa !== 'facultative';

  return (
    <section aria-labelledby="a-det" className="overflow-hidden rounded-16 border border-line bg-paper shadow-menu">
      <div className="flex items-start gap-3.5 px-5 pb-4 pt-5">
        <Avatar name={account.full_name} size={48} />
        <div className="min-w-0 flex-1">
          <h2 id="a-det" className="m-0 break-words text-20 font-semibold text-ink">
            {account.full_name}
          </h2>
          <p className="m-0 break-all text-14 text-ink-2">{account.email}</p>
        </div>
        <StatusDot tone={STATUS_TONE[account.status]} label={STATUS_LABEL[account.status]} />
      </div>
      <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-2 px-5 pb-4 text-14">
        {[
          { label: 'Rôle realm', value: ROLE_LABEL[account.realm_role] },
          { label: 'Rattachement', value: account.node_label ?? '—' },
          { label: 'E-mail', value: account.email_verified ? 'Vérifié' : 'À confirmer' },
          { label: 'Connexion', value: <span className="tnum">{when(account.last_login)}</span> },
          { label: 'Identifiant', value: <span className="tnum break-all text-13">{account.keycloak_id ?? 'Non lié'}</span> },
        ].map((row) => (
          <React.Fragment key={row.label}>
            <dt className="text-ink-3">{row.label}</dt>
            <dd className="m-0 break-words text-ink">{row.value}</dd>
          </React.Fragment>
        ))}
      </dl>

      <PanelSection
        title="Double authentification"
        aside={
          <Badge tone={mfaOn ? 'ok' : 'muted'} dot>
            {mfaOn ? 'Activée' : 'Facultative'}
          </Badge>
        }
      >
        <p className="m-0 text-14 text-ink-2">{mfaOn ? `Méthode : ${MFA_LABEL[account.mfa]}.` : 'Aucun second facteur exigé pour ce compte.'}</p>
        {!mfaOn && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPending('require-mfa')}>
            Forcer la MFA
          </Button>
        )}
      </PanelSection>

      <PanelSection title={`Nominations · ${account.offices.length}`}>
        {account.offices.length === 0 ? (
          <p className="m-0 text-14 text-ink-3">Aucune nomination.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {account.offices.map((o) => (
              <li key={`${o.office_label}-${o.node_name}`} className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
                <p className="m-0 flex justify-between gap-3 text-14 font-semibold text-ink">
                  {o.office_label}
                  <span className="tnum text-13 font-normal text-ink-3">{dayjs(o.start_date).format('DD.MM.YYYY')}</span>
                </p>
                <p className="m-0 mb-2 text-13 text-ink-3">{o.node_name}</p>
                <CapabilityChips capabilities={o.capabilities} />
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <PanelSection
        title={`Sessions actives · ${account.sessions.length}`}
        aside={
          account.sessions.length > 0 && (
            <button
              type="button"
              onClick={() => setPending('logout-sessions')}
              className="hit rounded-6 text-14 font-semibold text-err hover:underline"
            >
              Fermer les sessions
            </button>
          )
        }
      >
        {account.sessions.length === 0 ? (
          <p className="m-0 text-14 text-ink-3">Aucune session ouverte.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {account.sessions.map((s) => (
              <li key={s.id} className="flex gap-3 border-t border-line py-2.5 text-14 first:border-t-0 first:pt-0">
                <Icon name="globe" size={18} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{s.client}</span>
                  <span className="tnum block text-13 text-ink-3">
                    {s.ip} · depuis {when(s.started_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <div className="border-t border-line bg-surface px-5 py-4">
        <p className="m-0 flex gap-2 text-13 text-ink-3">
          <Icon name="cadenas" size={16} className="mt-px shrink-0" />
          <span>
            Chaque action sur ce compte est inscrite au journal d’audit. Messages chiffrés, aucun administrateur n’y a accès.
          </span>
        </p>
        {locked ? (
          <Button size="sm" className="mt-3" onClick={() => setPending('unlock')}>
            Déverrouiller le compte
          </Button>
        ) : (
          <Button variant="danger" size="sm" className="mt-3" onClick={() => setPending('lock')}>
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
        <p className="m-0 text-15 text-ink-2">{pending && ACTIONS[pending].body}</p>
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
  const roleTab = filters.role ?? 'tous';

  return (
    <div>
      <PageHeader
        compact
        title="Comptes"
        description="Les comptes Keycloak du domaine Jàngu Bi. Les droits viennent des nominations."
        actions={
          env.KEYCLOAK_CONSOLE_URL && (
            <Button asChild variant="outline" className="min-h-11 text-14">
              <a href={env.KEYCLOAK_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="lien-externe" size={18} className="text-ink-2" />
                Console Keycloak
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </Button>
          )
        }
      />
      <Tabs
        value={roleTab}
        onValueChange={(v) => setFilters((f) => ({ ...f, role: v === 'tous' ? undefined : (v as Account['realm_role']), offset: 0 }))}
      >
        <TabsList aria-label="Rôle" className="mt-6 gap-7 px-0">
          {ROLE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} count={t.value === roleTab ? list.data?.count : undefined} countPill>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={roleTab} className="focus-visible:outline-none">
          <div className="mt-4">
            <Filters value={filters} onChange={onFilters} />
          </div>
          <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_376px]">
            <section aria-label="Liste des comptes" className="min-w-0">
              {list.isPending ? (
                <LoadingBlock label="Chargement des comptes…" lines={6} />
              ) : list.isError ? (
                <EmptyState tone="err" icon="alerte" title="Les comptes n’ont pas pu être chargés">
                  {list.error.message}
                </EmptyState>
              ) : rows.length === 0 ? (
                <Card padding="lg">
                  <EmptyState icon="utilisateurs" title="Aucun compte">
                    Aucun compte ne correspond à ces filtres.
                  </EmptyState>
                </Card>
              ) : (
                <Card padding="none" className="overflow-hidden">
                  <Table label="Comptes, défilement horizontal">
                    <thead>
                      <tr>
                        <Th className="h-10">Personne</Th>
                        <Th className="h-10">Rôle</Th>
                        <Th className="h-10">MFA</Th>
                        <Th className="h-10">Statut</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((a) => {
                        const selected = a.id === currentId;
                        return (
                          <Tr key={a.id} selected={selected}>
                            <Td className="py-2.5">
                              <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setSelectedId(a.id)}
                                className={cn('block text-left text-15 font-semibold hover:underline', selected ? 'text-tint-800' : 'text-ink')}
                              >
                                {a.full_name}
                              </button>
                              <span className="block break-all text-13 text-ink-3">{a.email}</span>
                            </Td>
                            <Td className="py-2.5">
                              <span className="block text-14">{ROLE_LABEL[a.realm_role]}</span>
                              {a.node_label && <span className="block text-13 text-ink-3">{a.node_label}</span>}
                            </Td>
                            <Td className="py-2.5">
                              {a.mfa === 'facultative' ? (
                                <span className="text-13 text-ink-3">Facultative</span>
                              ) : (
                                <Icon name="bouclier" size={18} className="text-ok" label={`MFA : ${MFA_LABEL[a.mfa]}`} />
                              )}
                            </Td>
                            <Td className="py-2.5">
                              <StatusDot tone={STATUS_TONE[a.status]} label={STATUS_LABEL[a.status]} />
                              <span className="tnum mt-0.5 block text-13 text-ink-3">{when(a.last_login)}</span>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  <Pagination
                    offset={filters.offset ?? 0}
                    limit={ACCOUNTS_PAGE}
                    total={list.data.count}
                    onChange={(offset) => setFilters((f) => ({ ...f, offset }))}
                    className="px-5 py-3"
                  />
                </Card>
              )}
            </section>
            <div className="min-w-0">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
