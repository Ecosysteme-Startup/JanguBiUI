'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useContexts } from '@/lib/can';
import { cn } from '@/utils/cn';
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
    <form onSubmit={apply} className="flex w-full flex-col gap-1 sm:w-72" noValidate>
      <label htmlFor="f-acteur" className="sr-only">
        Acteur
      </label>
      <Input
        id="f-acteur"
        type="search"
        icon="recherche"
        controlSize="sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Identifiant de l’acteur, puis Entrée"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'f-acteur-erreur' : undefined}
        className="h-9 rounded-10 text-14"
      />
      {error && (
        <p id="f-acteur-erreur" role="alert" className="m-0 text-13 text-err">
          {error}
        </p>
      )}
    </form>
  );
};

const pill = (set: boolean) =>
  cn(
    'h-9 w-auto rounded-full px-3.5 text-14 font-medium',
    set ? 'border-line-active bg-tint-50 text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field',
  );

/** Fiche de l'événement choisi (WEB-PLA-Audit, colonne de droite) : faits, puis l'événement brut. */
const EventPanel = ({ event, nodeName, onClose }: { event: AuditEvent; nodeName: string; onClose: () => void }) => {
  const raw = JSON.stringify(
    {
      id: event.id,
      horodatage: event.at,
      acteur: event.actor_id,
      action: event.action,
      objet: `${event.target_type}:${event.target_id}`,
      noeud: event.node_id,
      ip: event.ip,
      metadata: event.metadata ?? null,
    },
    null,
    2,
  );
  const copy = () => {
    navigator.clipboard?.writeText(raw).then(
      () => toast.ok('Événement copié.'),
      () => toast.err('La copie a échoué.'),
    );
  };
  return (
    <section aria-labelledby="a-evt" className="overflow-hidden rounded-16 border border-line bg-paper shadow-menu">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="tnum m-0 text-13 text-ink-3">{dayjs(event.at).format('dddd D MMMM YYYY, HH:mm:ss')}</p>
            <h2 id="a-evt" className="m-0 mt-0.5 text-20 font-semibold text-ink">
              {actionLabel(event.action)}
            </h2>
          </div>
          <IconButton icon="x" label="Fermer le détail" size="sm" className="-mr-1.5 -mt-1" onClick={onClose} />
        </div>
        <dl className="m-0 mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-2 text-14">
          <dt className="text-ink-3">Acteur</dt>
          <dd className="m-0 break-words text-ink">{event.actor_id ? (event.actor_name ?? shortId(event.actor_id)) : 'Système'}</dd>
          <dt className="text-ink-3">Objet</dt>
          <dd className="m-0 break-words text-ink">{targetLabel(event.target_type, event.target_id)}</dd>
          <dt className="text-ink-3">Nœud</dt>
          <dd className="m-0 break-words text-ink">{nodeName}</dd>
          <dt className="text-ink-3">Adresse IP</dt>
          <dd className="tnum m-0 text-ink">{event.ip ?? '—'}</dd>
        </dl>
      </div>
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-15 font-semibold text-ink">Événement brut</h3>
          <button type="button" onClick={copy} className="hit inline-flex items-center gap-1.5 rounded-6 text-14 font-semibold text-primary hover:underline">
            <Icon name="copier" size={16} />
            Copier
          </button>
        </div>
        <pre className="tnum m-0 mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-12 border border-line bg-surface p-4 font-sans text-13 text-ink-2">
          {raw}
        </pre>
      </div>
      <p className="m-0 flex gap-2 border-t border-line bg-surface px-5 py-4 text-13 text-ink-3">
        <Icon name="cadenas" size={16} className="mt-px shrink-0" />
        Le journal ne contient ni le contenu des messages, ni les notes internes, ni les données des registres. Les adresses IP sont
        tronquées.
      </p>
    </section>
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
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [closed, setClosed] = React.useState(false);
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
  const results = events.data?.results ?? [];
  const selected = closed ? undefined : (results.find((e) => e.id === selectedId) ?? results[0]);

  return (
    <div>
      <PageHeader
        compact
        title="Journal d’audit"
        description={
          scopeNodeId
            ? 'Les actions sensibles de ce nœud et de son sous-arbre, en lecture seule.'
            : 'Chaque action sensible de la plateforme, inscrite en lecture seule.'
        }
      />

      <div role="search" aria-label="Filtrer le journal" className="mt-6 flex flex-wrap items-start gap-2">
        <ActorFilter key={filters.actor ?? ''} value={filters.actor} onApply={(actor) => go({ actor })} />
        <div>
          <label htmlFor="f-du" className="sr-only">
            Du
          </label>
          <Input
            id="f-du"
            type="date"
            controlSize="sm"
            title="Du"
            value={filters.date_from ?? ''}
            onChange={(e) => go({ date_from: e.target.value || undefined })}
            className={pill(Boolean(filters.date_from))}
          />
        </div>
        <div>
          <label htmlFor="f-au" className="sr-only">
            Au
          </label>
          <Input
            id="f-au"
            type="date"
            controlSize="sm"
            title="Au"
            value={filters.date_to ?? ''}
            onChange={(e) => go({ date_to: e.target.value || undefined })}
            className={pill(Boolean(filters.date_to))}
          />
        </div>
        <div>
          <label htmlFor="f-action" className="sr-only">
            Action
          </label>
          <Select
            id="f-action"
            controlSize="sm"
            value={filters.action ?? ''}
            onChange={(e) => go({ action: e.target.value || undefined })}
            className={cn(pill(Boolean(filters.action)), 'pr-10')}
          >
            <option value="">Toutes les actions</option>
            {ACTION_FAMILIES.map((f) => (
              <option key={f.prefix} value={f.prefix}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="f-noeud" className="sr-only">
            Nœud
          </label>
          <Select
            id="f-noeud"
            controlSize="sm"
            value={filters.node ?? ''}
            onChange={(e) => go({ node: e.target.value || undefined })}
            className={cn(pill(Boolean(filters.node)), 'pr-10')}
          >
            <option value="">{scopeNodeId ? 'Tout le sous-arbre' : 'Tous les nœuds'}</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        {filtered && (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => router.replace(auditHref({}, base), { scroll: false })}>
            Réinitialiser
          </Button>
        )}
        <span className="flex-1" />
        {events.data && (
          <span className="tnum self-center whitespace-nowrap text-14 text-ink-3">
            {events.data.count} événement{events.data.count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className={cn('mt-4 grid grid-cols-1 items-start gap-6', selected && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
        <div className="min-w-0">
          {events.isPending ? (
            <LoadingBlock label="Chargement du journal…" lines={8} />
          ) : events.isError ? (
            <EmptyState tone="err" icon="alerte" title="Le journal n’a pas pu être chargé">
              {events.error.message}
            </EmptyState>
          ) : results.length === 0 ? (
            <Card padding="lg">
              <EmptyState icon="document" title="Aucune entrée">
                {filtered ? 'Aucune action ne correspond à ces filtres.' : 'Aucune action n’a encore été journalisée.'}
              </EmptyState>
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <Table label="Journal d’audit, défilement horizontal">
                <thead>
                  <tr>
                    <Th className="h-10">Heure</Th>
                    <Th className="h-10">Acteur</Th>
                    <Th className="h-10">Action et objet</Th>
                    <Th className="h-10">Nœud · adresse IP</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((event) => {
                    const isSelected = event.id === selected?.id;
                    const meta = metadataOf(event);
                    return (
                      <Tr key={event.id} selected={isSelected}>
                        <Td className="tnum whitespace-nowrap py-2.5">
                          <span className={cn('block text-15', isSelected && 'font-semibold text-tint-800')}>
                            {dayjs(event.at).format('HH:mm:ss')}
                          </span>
                          <span className="block text-13 text-ink-3">{dayjs(event.at).format('DD.MM.YYYY')}</span>
                        </Td>
                        <Td className="whitespace-nowrap py-2.5">
                          {event.actor_id ? (
                            <button
                              type="button"
                              title={event.actor_id}
                              onClick={() => go({ actor: event.actor_id ?? undefined })}
                              className="hit text-left text-14 font-semibold text-ink hover:text-primary hover:underline"
                              aria-label={`Filtrer sur l’acteur ${event.actor_name ?? event.actor_id}`}
                            >
                              {event.actor_name ?? shortId(event.actor_id)}
                            </button>
                          ) : (
                            <span className="text-14 font-semibold text-ink-2">Système</span>
                          )}
                        </Td>
                        <Td className="py-2.5">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedId(event.id);
                              setClosed(false);
                            }}
                            className="block text-left text-14 font-semibold text-ink hover:underline"
                          >
                            {actionLabel(event.action)}
                          </button>
                          <span title={targetLabel(event.target_type, event.target_id)} className="block max-w-64 truncate text-13 text-ink-3">
                            {targetLabel(event.target_type, event.target_id)}
                          </span>
                          {meta && (
                            <span title={meta} className="tnum block max-w-64 truncate text-13 text-ink-3">
                              {meta}
                            </span>
                          )}
                        </Td>
                        <Td className="py-2.5">
                          <span className="block max-w-40 truncate text-14" title={event.node_name ?? nodeName(event.node_id)}>
                            {event.node_name ?? nodeName(event.node_id)}
                          </span>
                          <span className="tnum block text-13 text-ink-3">{event.ip ?? '—'}</span>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <Pagination offset={filters.offset ?? 0} limit={AUDIT_PAGE} total={events.data.count} onChange={(offset) => go({ offset })} />
                <span className="tnum text-13 text-ink-3">Heure de Dakar (UTC)</span>
              </div>
            </Card>
          )}
        </div>
        {selected && (
          <div className="min-w-0">
            <EventPanel event={selected} nodeName={selected.node_name ?? nodeName(selected.node_id)} onClose={() => setClosed(true)} />
          </div>
        )}
      </div>
    </div>
  );
};
