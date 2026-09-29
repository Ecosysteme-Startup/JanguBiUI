'use client';

import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { ImportWizard } from '@/components/signature/import-wizard';
import { QualityModal } from '@/components/signature/quality-modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useMe } from '@/hooks/use-me';
import { useNode } from '@/hooks/use-node';
import { officeTypesQueryOptions } from '@/hooks/use-office-types';
import { useCan } from '@/lib/can';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import {
  type Assignment,
  type AssignmentStatus,
  ASSIGNMENTS_PAGE,
  useAssignmentCounts,
  useAssignments,
} from '../api/get-assignments';
import { useSubnodes } from '../api/get-subnodes';
import { useImportAssignments } from '../api/import-assignments';
import {
  useSetAssignmentQuality,
  useUpdateAssignment,
} from '../api/update-assignment';
import { assignmentBadge } from '../utils/assignment-status';

import { NominationPanel } from './nomination-panel';
import { ShortDate } from './short-date';

const STATUS_FILTERS: { value: AssignmentStatus | undefined; label: string }[] =
  [
    { value: undefined, label: 'Toutes' },
    { value: 'active', label: 'En vigueur' },
    { value: 'proposee', label: 'À venir' },
    { value: 'terminee', label: 'Échues' },
    { value: 'annulee', label: 'Annulées' },
  ];

const tabValue = (v: AssignmentStatus | undefined) => v ?? 'toutes';

/** Onglets de statut (WEB-DIO-Nominations) : souligné b600, compteur en pilule. */
const StatusTabs = ({
  counts,
  total,
  onChange,
}: {
  counts: Record<AssignmentStatus, number | undefined>;
  total: number | undefined;
  onChange: (value: AssignmentStatus | undefined) => void;
}) => (
  <TabsList aria-label="Filtrer par statut" className="mt-6 gap-7 px-0">
    {STATUS_FILTERS.map((f) => (
      <TabsTrigger
        key={f.label}
        value={tabValue(f.value)}
        count={f.value ? counts[f.value] : total}
        countPill
        onClick={() => onChange(f.value)}
      >
        {f.label}
      </TabsTrigger>
    ))}
  </TabsList>
);

/** Filtre en pilule (Office, Nœud) : contour line, teinté b50 quand une valeur est choisie. */
const pillSelect = (set: boolean) =>
  cn(
    'h-9 w-auto rounded-full pl-3.5 text-14 font-medium',
    set
      ? 'border-line-active bg-tint-50 text-tint-800'
      : 'border-line bg-paper text-ink hover:border-line-field',
  );

type Pending = {
  assignment: Assignment;
  action: 'terminer' | 'annuler';
} | null;

const Registre = ({
  nodeId,
  nodeName,
}: {
  nodeId: string;
  nodeName: string;
}) => {
  const [status, setStatus] = React.useState<AssignmentStatus | undefined>(
    undefined,
  );
  const [office, setOffice] = React.useState('');
  const [scope, setScope] = React.useState(nodeId);
  const [offset, setOffset] = React.useState(0);
  const [pending, setPending] = React.useState<Pending>(null);
  const [qualifying, setQualifying] = React.useState<Assignment | null>(null);
  const offices = useQuery(officeTypesQueryOptions());
  const canNommer = useCan('offices.nommer', nodeId);
  const { data: me } = useMe();
  const setQuality = useSetAssignmentQuality({ meId: me?.id });
  const qualitiesOf = (code: string) =>
    offices.data?.find((o) => o.code === code)?.qualities ?? [];
  const subnodes = useSubnodes(nodeId);
  const list = useAssignments({
    node: scope,
    status,
    office: office || undefined,
    offset,
  });
  const counts = useAssignmentCounts(scope, office || undefined);
  const update = useUpdateAssignment();
  const known = Object.values(counts).every((c) => c !== undefined);
  const total = known
    ? Object.values(counts).reduce<number>((sum, c) => sum + (c ?? 0), 0)
    : undefined;

  const confirm = () => {
    if (!pending) return;
    update.mutate(
      { id: pending.assignment.id, action: pending.action },
      {
        onSuccess: () => {
          toast.ok(
            pending.action === 'terminer'
              ? 'Nomination terminée. Inscrit au journal d’audit.'
              : 'Nomination annulée.',
          );
          setPending(null);
        },
        onError: (error) => toast.err(error.message),
      },
    );
  };

  return (
    <Tabs asChild value={tabValue(status)}>
      <section
        aria-label="Registre des nominations"
        className="flex min-w-0 flex-col"
      >
        <StatusTabs
          counts={counts}
          total={total}
          onChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor="n-noeud" className="sr-only">
              Nœud
            </label>
            <Select
              id="n-noeud"
              controlSize="sm"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setOffset(0);
              }}
              className={pillSelect(scope !== nodeId)}
            >
              <option value={nodeId}>{nodeName || 'Tout le sous-arbre'}</option>
              {(subnodes.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="n-office" className="sr-only">
              Office
            </label>
            <Select
              id="n-office"
              controlSize="sm"
              value={office}
              onChange={(e) => {
                setOffice(e.target.value);
                setOffset(0);
              }}
              className={pillSelect(Boolean(office))}
            >
              <option value="">Tous les offices</option>
              {(offices.data ?? []).map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <TabsContent
          value={tabValue(status)}
          className="mt-4 focus-visible:outline-none"
        >
          {list.isPending ? (
            <LoadingBlock label="Chargement du registre…" lines={5} />
          ) : list.isError ? (
            <EmptyState
              tone="err"
              icon="alerte"
              title="Le registre n’a pas pu être chargé"
            >
              {list.error.message}
            </EmptyState>
          ) : list.data.results.length === 0 ? (
            <EmptyState icon="utilisateurs" title="Aucune nomination">
              Aucune nomination ne correspond à ces filtres.
            </EmptyState>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <Table label="Nominations, défilement horizontal">
                <thead>
                  <tr>
                    <Th className="h-10">Personne</Th>
                    <Th className="h-10">Office</Th>
                    <Th className="h-10">Nœud</Th>
                    <Th className="h-10">Début</Th>
                    <Th className="h-10">Fin</Th>
                    <Th className="h-10">Statut</Th>
                    <Th className="h-10">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.results.map((a) => {
                    const badge = assignmentBadge(a);
                    return (
                      <Tr key={a.id}>
                        <Td className="h-13 py-1.5">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={a.person.full_name} size={32} />
                            <span className="whitespace-nowrap text-15 font-semibold">
                              {a.person.full_name}
                            </span>
                          </span>
                        </Td>
                        <Td className="h-13 py-1.5 text-ink-2">
                          {a.office_label}
                        </Td>
                        <Td className="h-13 py-1.5 text-ink-2">
                          {a.node.name}
                        </Td>
                        <Td className="tnum h-13 py-1.5">
                          <ShortDate iso={a.start_date} />
                        </Td>
                        <Td
                          className={cn(
                            'tnum h-13 py-1.5',
                            badge.endingSoon
                              ? 'font-semibold text-warn'
                              : 'text-ink-2',
                          )}
                        >
                          {a.end_date ? (
                            <ShortDate iso={a.end_date} />
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </Td>
                        <Td className="h-13 py-1.5">
                          <Badge tone={badge.tone} dot>
                            {badge.label}
                          </Badge>
                        </Td>
                        <Td className="h-13 whitespace-nowrap py-1.5 text-right">
                          {a.status === 'active' &&
                            canNommer &&
                            qualitiesOf(a.office).length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQualifying(a)}
                                aria-label={`Modifier la qualité : ${a.person.full_name}, ${a.office_label}`}
                              >
                                Qualité
                              </Button>
                            )}
                          {a.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPending({
                                  assignment: a,
                                  action: 'terminer',
                                })
                              }
                              aria-label={`Terminer : ${a.person.full_name}, ${a.office_label}`}
                            >
                              Terminer
                            </Button>
                          )}
                          {a.status === 'proposee' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPending({ assignment: a, action: 'annuler' })
                              }
                              aria-label={`Annuler : ${a.person.full_name}, ${a.office_label}`}
                            >
                              Annuler
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              {list.data.count > ASSIGNMENTS_PAGE ? (
                <Pagination
                  offset={offset}
                  limit={ASSIGNMENTS_PAGE}
                  total={list.data.count}
                  onChange={setOffset}
                  noun="Nominations"
                  className="px-5 py-3"
                />
              ) : (
                <p className="tnum m-0 px-5 py-3 text-14 text-ink-2">
                  {list.data.count} nomination{list.data.count > 1 ? 's' : ''}
                </p>
              )}
            </Card>
          )}
        </TabsContent>
        {qualifying && (
          <QualityModal
            subject={`${qualifying.person.full_name} · ${qualifying.node.name}`}
            qualities={qualitiesOf(qualifying.office)}
            current={qualifying.quality}
            pending={setQuality.isPending}
            error={
              setQuality.isError ? apiErrorMessage(setQuality.error) : undefined
            }
            onSubmit={(quality) =>
              setQuality.mutate(
                { id: qualifying.id, quality },
                {
                  onSuccess: (a) => {
                    toast.ok(
                      `Qualité modifiée : ${a.person.full_name}, ${a.office_label.toLowerCase()}. Inscrit au journal d’audit.`,
                    );
                    setQualifying(null);
                    setQuality.reset();
                  },
                },
              )
            }
            onClose={() => {
              setQualifying(null);
              setQuality.reset();
            }}
          />
        )}
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => !open && setPending(null)}
          title={
            pending?.action === 'terminer'
              ? 'Terminer cette nomination ?'
              : 'Annuler cette nomination ?'
          }
          description={
            pending &&
            `${pending.assignment.person.full_name} · ${pending.assignment.office_label} · ${pending.assignment.node.name}`
          }
          confirmLabel={
            pending?.action === 'terminer'
              ? 'Terminer aujourd’hui'
              : 'Annuler la nomination'
          }
          tone="danger"
          pending={update.isPending}
          onConfirm={confirm}
        >
          <p className="m-0 text-15 text-ink-2">
            {pending?.action === 'terminer'
              ? 'Les capacités liées à cet office cessent aujourd’hui. L’opération est inscrite au journal d’audit.'
              : 'La nomination proposée ne prendra jamais effet. L’opération est inscrite au journal d’audit.'}
          </p>
        </ConfirmDialog>
      </section>
    </Tabs>
  );
};

const MovementImport = ({ onClose }: { onClose: () => void }) => {
  const importer = useImportAssignments();
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const eve = effectiveDate
    ? dayjs(effectiveDate).subtract(1, 'day').format('DD/MM')
    : null;
  const run = (dryRun: boolean) => (file: File) =>
    importer.mutateAsync({ file, effectiveDate, dryRun });
  return (
    <ImportWizard
      eyebrow="Assistant d’import · mouvement annuel"
      title="Mouvement des affectations"
      columns="action, email, office, node_code (puis decree_ref, quality : cure ou administrateur pour une cure)"
      ready={Boolean(effectiveDate)}
      extra={
        <Field
          id="n-effet"
          label="Date d’effet"
          required
          hint={
            eve
              ? `Fins de mandat au ${eve}`
              : 'Les fins de mandat sont datées de la veille.'
          }
        >
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="max-w-xs"
          />
        </Field>
      }
      simulate={run(true)}
      apply={run(false)}
      auditNote="Chaque nomination créée ou terminée est inscrite au journal d’audit."
      onClose={onClose}
    />
  );
};

type Panel = 'import' | 'nomination' | null;

/** Registre des nominations, nomination unitaire et import du mouvement annuel (DIO-Nominations). */
export const NominationsPage = ({ nodeId }: { nodeId: string }) => {
  const node = useNode(nodeId);
  const [panel, setPanel] = React.useState<Panel>('import');
  const name = node.data?.name ?? '';
  const toggle = (p: Exclude<Panel, null>) =>
    setPanel((current) => (current === p ? null : p));

  return (
    <div>
      <PageHeader
        compact
        title="Nominations"
        description="Chaque office est daté, rattaché à un nœud, et ouvre ses droits sur Jàngu Bi."
        actions={
          <>
            <Button
              variant="outline"
              className="min-h-11 text-14"
              aria-pressed={panel === 'import'}
              onClick={() => toggle('import')}
            >
              <Icon name="import" size={18} className="text-ink-2" />
              Importer
            </Button>
            <Button
              className="min-h-11 px-5"
              aria-pressed={panel === 'nomination'}
              onClick={() => toggle('nomination')}
            >
              <Icon name="plus" size={18} />
              Nouvelle nomination
            </Button>
          </>
        }
      />
      {panel === 'nomination' && node.data && (
        <div className="mt-6">
          <NominationPanel
            nodeId={nodeId}
            nodeName={name}
            nodeType={node.data.type.code}
            onClose={() => setPanel(null)}
          />
        </div>
      )}
      <Registre nodeId={nodeId} nodeName={name} />
      {panel === 'import' && (
        <div className="mt-8">
          <MovementImport onClose={() => setPanel(null)} />
        </div>
      )}
    </div>
  );
};
