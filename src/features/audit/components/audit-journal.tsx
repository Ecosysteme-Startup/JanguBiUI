'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useContexts } from '@/lib/can';
import { dayjs } from '@/utils/dates';

import { AUDIT_PAGE, type AuditEvent, type AuditFilters, useAuditEvents } from '../api/get-audit-events';
import { useAuditDioceses } from '../api/get-audit-nodes';
import { ACTION_FAMILIES, actionLabel, targetLabel } from '../utils/labels';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Filtres → URL (spec §3 : les filtres sont dans l'URL, partageables). */
export const auditHref = (filters: AuditFilters, base: string = paths.plateforme.audit.getHref()) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && !(key === 'offset' && value === 0)) params.set(key, String(value));
  });
  const qs = params.toString();
  return `${base}${qs ? `?${qs}` : ''}`;
};

const metadataOf = (event: AuditEvent) => {
  if (!event.metadata || typeof event.metadata !== 'object') return '';
  return Object.entries(event.metadata as Record<string, unknown>)
    .filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v))
    .slice(0, 3)
    .map(([k, v]) => `${k} : ${String(v)}`)
    .join(' · ');
};

const shortId = (id: string) => `${id.slice(0, 8)}…`;

const ActorFilter = ({ value, onApply }: { value?: string; onApply: (actor?: string) => void }) => {
  const [draft, setDraft] = React.useState(value ?? '');
  const [error, setError] = React.useState<string | null>(null);
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const actor = draft.trim();
    if (actor && !UUID.test(actor)) {
      setError('Collez l’identifiant complet du compte (format UUID).');
      return;
    }
    setError(null);
    onApply(actor || undefined);
  };
  return (
    <form onSubmit={apply} className="flex flex-col gap-1.5" noValidate>
      <label htmlFor="f-acteur" className="tnum text-meta text-ink-3">
        Acteur
      </label>
      <Input
        id="f-acteur"
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Identifiant du compte, puis Entrée"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'f-acteur-erreur' : undefined}
        className="h-10 text-sm"
      />
      {error && (
        <p id="f-acteur-erreur" role="alert" className="m-0 text-sm text-err">
          {error}
        </p>
      )}
    </form>
  );
};

type AuditJournalProps = {
  filters: AuditFilters;
  /** Back-office d'un nœud (`/espace/[nodeId]/audit`) : journal de ce nœud et de son sous-arbre. */
  scopeNodeId?: string;
};

/** Journal d'audit (PLA-Audit) ; tous les filtres vivent dans l'URL. */
export const AuditJournal = ({ filters, scopeNodeId }: AuditJournalProps) => {
  const router = useRouter();
  const events = useAuditEvents(scopeNodeId ? { ...filters, node: filters.node ?? scopeNodeId } : filters);
  const dioceses = useAuditDioceses();
  const { contexts } = useContexts();
  const known = [
    ...contexts.filter((c) => c.nodeId).map((c) => ({ id: c.nodeId as string, name: c.name })),
    ...(dioceses.data ?? []),
  ].filter((n, i, all) => all.findIndex((m) => m.id === n.id) === i);
  // Dans l'espace d'un nœud, le filtre ne propose que ce nœud : le backend borne déjà la portée.
  const nodes = scopeNodeId ? known.filter((n) => n.id === scopeNodeId) : known;
  const nodeName = (id: string | null) => (id ? (known.find((n) => n.id === id)?.name ?? shortId(id)) : 'Plateforme');
  const base = scopeNodeId ? paths.espace.audit.getHref(scopeNodeId) : paths.plateforme.audit.getHref();

  const go = (patch: Partial<AuditFilters>) => router.replace(auditHref({ ...filters, offset: 0, ...patch }, base), { scroll: false });
  const filtered = Object.entries(filters).some(([k, v]) => k !== 'offset' && v);

  return (
    <div>
      <PageHeader
        number="04"
        eyebrow={
          scopeNodeId
            ? 'Pilotage · actions sensibles de ce nœud et de son sous-arbre'
            : 'Conformité · journal des actions sensibles, en insertion seule'
        }
        title="Journal d’audit"
      />

      {/* Six filtres sur une ligne seulement quand la place existe (sidebar comprise) ; sinon 2 ou 3 colonnes (A11Y-08). */}
      <div
        role="search"
        aria-label="Filtrer le journal"
        className="mt-8 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 [&>*]:min-w-0 2xl:grid-cols-[150px_150px_minmax(0,1fr)_200px_200px_auto]"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-du" className="tnum text-meta text-ink-3">
            Du
          </label>
          <Input
            id="f-du"
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) => go({ date_from: e.target.value || undefined })}
            className="h-10 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-au" className="tnum text-meta text-ink-3">
            Au
          </label>
          <Input
            id="f-au"
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) => go({ date_to: e.target.value || undefined })}
            className="h-10 text-sm"
          />
        </div>
        <ActorFilter key={filters.actor ?? ''} value={filters.actor} onApply={(actor) => go({ actor })} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-action" className="tnum text-meta text-ink-3">
            Action
          </label>
          <Select
            id="f-action"
            value={filters.action ?? ''}
            onChange={(e) => go({ action: e.target.value || undefined })}
            className="h-10 text-sm"
          >
            <option value="">Toutes les actions</option>
            {ACTION_FAMILIES.map((f) => (
              <option key={f.prefix} value={f.prefix}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-noeud" className="tnum text-meta text-ink-3">
            Nœud
          </label>
          <Select
            id="f-noeud"
            value={filters.node ?? ''}
            onChange={(e) => go({ node: e.target.value || undefined })}
            className="h-10 text-sm"
          >
            <option value="">{scopeNodeId ? 'Tout le sous-arbre' : 'Tous les nœuds'}</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span aria-hidden="true" className="text-meta">
            &nbsp;
          </span>
          <Button variant="tertiary" size="sm" disabled={!filtered} onClick={() => router.replace(auditHref({}, base), { scroll: false })}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {events.isPending ? (
          <LoadingBlock label="Chargement du journal…" lines={8} />
        ) : events.isError ? (
          <EmptyState tone="err" icon="alerte" title="Le journal n’a pas pu être chargé">
            {events.error.message}
          </EmptyState>
        ) : events.data.results.length === 0 ? (
          <EmptyState icon="document" title="Aucune entrée">
            {filtered ? 'Aucune action ne correspond à ces filtres.' : 'Aucune action n’a encore été journalisée.'}
          </EmptyState>
        ) : (
          <>
            <Table label="Journal d’audit, défilement horizontal">
              <thead>
                <tr>
                  <Th>Horodatage</Th>
                  <Th>Acteur</Th>
                  <Th>Action</Th>
                  <Th>Cible</Th>
                  <Th>Nœud</Th>
                  <Th className="text-right">Adresse IP</Th>
                </tr>
              </thead>
              <tbody>
                {events.data.results.map((event) => (
                  <Tr key={event.id}>
                    <Td className="tnum whitespace-nowrap">{dayjs(event.at).format('DD.MM HH:mm:ss')}</Td>
                    <Td className="whitespace-nowrap">
                      {event.actor_id ? (
                        <button
                          type="button"
                          title={event.actor_id}
                          onClick={() => go({ actor: event.actor_id ?? undefined })}
                          className="hit text-left text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                          aria-label={`Filtrer sur l’acteur ${event.actor_name ?? event.actor_id}`}
                        >
                          {event.actor_name ?? shortId(event.actor_id)}
                        </button>
                      ) : (
                        <span className="text-ink-3">Système</span>
                      )}
                    </Td>
                    <Td className="font-medium">{actionLabel(event.action)}</Td>
                    <Td>
                      <span className="block">{targetLabel(event.target_type, event.target_id)}</span>
                      {metadataOf(event) && <span className="tnum block text-meta text-ink-3">{metadataOf(event)}</span>}
                    </Td>
                    <Td>{nodeName(event.node_id)}</Td>
                    <Td className="tnum text-right text-meta text-ink-2">{event.ip ?? '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              offset={filters.offset ?? 0}
              limit={AUDIT_PAGE}
              total={events.data.count}
              onChange={(offset) => go({ offset })}
              className="mt-2"
            />
            <p className="tnum m-0 mt-2 text-meta text-ink-3">Heure de Dakar (UTC)</p>
          </>
        )}
      </div>
    </div>
  );
};
