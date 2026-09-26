'use client';

import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { ImportWizard } from '@/components/signature/import-wizard';
import { QualityModal } from '@/components/signature/quality-modal';
import { StatusDot } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SectionHeading } from '@/components/ui/section-heading';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { useMe } from '@/hooks/use-me';
import { useNode } from '@/hooks/use-node';
import { officeTypesQueryOptions } from '@/hooks/use-office-types';
import { useCan } from '@/lib/can';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { type Assignment, type AssignmentStatus, ASSIGNMENTS_PAGE, useAssignmentCounts, useAssignments } from '../api/get-assignments';
import { useSubnodes } from '../api/get-subnodes';
import { useImportAssignments } from '../api/import-assignments';
import { useSetAssignmentQuality, useUpdateAssignment } from '../api/update-assignment';

import { NominationPanel } from './nomination-panel';

const d = (iso: string) => dayjs(iso).format('DD.MM.YYYY');

const STATUS_FILTERS: { value: AssignmentStatus | undefined; label: string }[] = [
  { value: undefined, label: 'Toutes' },
  { value: 'active', label: 'Actives' },
  { value: 'proposee', label: 'Proposées' },
  { value: 'terminee', label: 'Terminées' },
];

const StatusCell = ({ a }: { a: Assignment }) => {
  switch (a.status) {
    case 'proposee':
      return (
        <>
          <StatusDot tone="outline" label="Proposée" />
          <span className="tnum block text-meta text-ink-3">effet {d(a.start_date)}</span>
        </>
      );
    case 'terminee':
      return (
        <>
          <StatusDot tone="muted" label="Terminée" />
          {a.end_date && <span className="tnum block text-meta text-ink-3">le {d(a.end_date)}</span>}
        </>
      );
    case 'annulee':
      return <StatusDot tone="muted" label="Annulée" />;
    default:
      return (
        <>
          <StatusDot tone="ok" label="Active" />
          <span className="tnum block text-meta text-ink-3">
            {a.end_date ? `fin le ${dayjs(a.end_date).format('DD.MM')}` : `depuis ${d(a.start_date)}`}
          </span>
        </>
      );
  }
};

type Pending = { assignment: Assignment; action: 'terminer' | 'annuler' } | null;

const Registre = ({ nodeId, nodeName }: { nodeId: string; nodeName: string }) => {
  const [status, setStatus] = React.useState<AssignmentStatus | undefined>(undefined);
  const [office, setOffice] = React.useState('');
  const [scope, setScope] = React.useState(nodeId);
  const [offset, setOffset] = React.useState(0);
  const [pending, setPending] = React.useState<Pending>(null);
  const [qualifying, setQualifying] = React.useState<Assignment | null>(null);
  const offices = useQuery(officeTypesQueryOptions());
  const canNommer = useCan('offices.nommer', nodeId);
  const { data: me } = useMe();
  const setQuality = useSetAssignmentQuality({ meId: me?.id });
  const qualitiesOf = (code: string) => offices.data?.find((o) => o.code === code)?.qualities ?? [];
  const subnodes = useSubnodes(nodeId);
  const list = useAssignments({ node: scope, status, office: office || undefined, offset });
  const counts = useAssignmentCounts(scope, office || undefined);
  const update = useUpdateAssignment();
  const known = Object.values(counts).every((c) => c !== undefined);
  const total = known ? Object.values(counts).reduce<number>((sum, c) => sum + (c ?? 0), 0) : undefined;

  const confirm = () => {
    if (!pending) return;
    update.mutate(
      { id: pending.assignment.id, action: pending.action },
      {
        onSuccess: () => {
          toast.ok(pending.action === 'terminer' ? 'Nomination terminée. Inscrit au journal d’audit.' : 'Nomination annulée.');
          setPending(null);
        },
        onError: (error) => toast.err(error.message),
      },
    );
  };

  return (
    <section aria-labelledby="n-liste" className="flex min-w-0 flex-col">
      <SectionHeading
        id="n-liste"
        number="01"
        title="Registre"
        aside={`Sous-arbre ${scope === nodeId ? nodeName : (subnodes.data?.find((s) => s.id === scope)?.name ?? '')}`}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="n-office" className="tnum text-meta text-ink-3">
            Office
          </label>
          <Select
            id="n-office"
            value={office}
            onChange={(e) => {
              setOffice(e.target.value);
              setOffset(0);
            }}
            className="h-10 text-sm"
          >
            <option value="">Tous les offices</option>
            {(offices.data ?? []).map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="n-noeud" className="tnum text-meta text-ink-3">
            Nœud
          </label>
          <Select
            id="n-noeud"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setOffset(0);
            }}
            className="h-10 text-sm"
          >
            <option value={nodeId}>{nodeName}</option>
            {(subnodes.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <ChipGroup label="Filtrer par statut" className="mt-4">
        {STATUS_FILTERS.map((f) => {
          const count = f.value ? counts[f.value] : total;
          return (
            <Chip
              key={f.label}
              pressed={status === f.value}
              onClick={() => {
                setStatus(f.value);
                setOffset(0);
              }}
            >
              {f.label}
              {count !== undefined && <span className="tnum text-meta">· {count}</span>}
            </Chip>
          );
        })}
      </ChipGroup>
      <div className="mt-4">
        {list.isPending ? (
          <LoadingBlock label="Chargement du registre…" lines={5} />
        ) : list.isError ? (
          <EmptyState tone="err" icon="alerte" title="Le registre n’a pas pu être chargé">
            {list.error.message}
          </EmptyState>
        ) : list.data.results.length === 0 ? (
          <EmptyState icon="utilisateurs" title="Aucune nomination">
            Aucune nomination ne correspond à ces filtres.
          </EmptyState>
        ) : (
          <>
            <Table label="Nominations, défilement horizontal">
              <thead>
                <tr>
                  <Th>Titulaire · office · nœud</Th>
                  <Th>Statut</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {list.data.results.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <span className="flex items-center gap-3 py-2">
                        <Avatar name={a.person.full_name} size={32} />
                        <span className="min-w-0">
                          <span className="block font-medium">{a.person.full_name}</span>
                          <span className="block text-sm text-ink-2">
                            {a.office_label} · {a.node.name}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <StatusCell a={a} />
                    </Td>
                    <Td className="text-right">
                      {a.status === 'active' && canNommer && qualitiesOf(a.office).length > 0 && (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setQualifying(a)}
                          aria-label={`Modifier la qualité : ${a.person.full_name}, ${a.office_label}`}
                        >
                          Modifier la qualité
                        </Button>
                      )}
                      {a.status === 'active' && (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setPending({ assignment: a, action: 'terminer' })}
                          aria-label={`Terminer : ${a.person.full_name}, ${a.office_label}`}
                        >
                          Terminer
                        </Button>
                      )}
                      {a.status === 'proposee' && (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setPending({ assignment: a, action: 'annuler' })}
                          aria-label={`Annuler : ${a.person.full_name}, ${a.office_label}`}
                        >
                          Annuler
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination offset={offset} limit={ASSIGNMENTS_PAGE} total={list.data.count} onChange={setOffset} className="mt-2" />
          </>
        )}
      </div>
      {qualifying && (
        <QualityModal
          subject={`${qualifying.person.full_name} · ${qualifying.node.name}`}
          qualities={qualitiesOf(qualifying.office)}
          current={qualifying.quality}
          pending={setQuality.isPending}
          error={setQuality.isError ? apiErrorMessage(setQuality.error) : undefined}
          onSubmit={(quality) =>
            setQuality.mutate(
              { id: qualifying.id, quality },
              {
                onSuccess: (a) => {
                  toast.ok(`Qualité modifiée : ${a.person.full_name}, ${a.office_label.toLowerCase()}. Inscrit au journal d’audit.`);
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
        title={pending?.action === 'terminer' ? 'Terminer cette nomination ?' : 'Annuler cette nomination ?'}
        description={
          pending && `${pending.assignment.person.full_name} · ${pending.assignment.office_label} · ${pending.assignment.node.name}`
        }
        confirmLabel={pending?.action === 'terminer' ? 'Terminer aujourd’hui' : 'Annuler la nomination'}
        tone="danger"
        pending={update.isPending}
        onConfirm={confirm}
      >
        <p className="m-0 text-base text-ink-2">
          {pending?.action === 'terminer'
            ? 'Les capacités liées à cet office cessent aujourd’hui. L’opération est inscrite au journal d’audit.'
            : 'La nomination proposée ne prendra jamais effet. L’opération est inscrite au journal d’audit.'}
        </p>
      </ConfirmDialog>
    </section>
  );
};

const MovementImport = ({ onClose }: { onClose: () => void }) => {
  const importer = useImportAssignments();
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const eve = effectiveDate ? dayjs(effectiveDate).subtract(1, 'day').format('DD/MM') : null;
  const run = (dryRun: boolean) => (file: File) => importer.mutateAsync({ file, effectiveDate, dryRun });
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
          hint={eve ? `Fins de mandat au ${eve}` : 'Les fins de mandat sont datées de la veille.'}
        >
          <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="max-w-xs" />
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
  const active = useAssignmentCounts(nodeId).active;
  const name = node.data?.name ?? '';
  const toggle = (p: Exclude<Panel, null>) => setPanel((current) => (current === p ? null : p));

  return (
    <div>
      <PageHeader
        number="03"
        eyebrow={`Gouvernance · ${active === undefined ? '…' : `${active} nomination${active > 1 ? 's' : ''} active${active > 1 ? 's' : ''}`}`}
        title="Nominations"
        actions={
          <>
            <Button
              variant={panel === 'nomination' ? 'secondary' : 'primary'}
              aria-pressed={panel === 'nomination'}
              onClick={() => toggle('nomination')}
            >
              Nouvelle nomination
            </Button>
            <Button variant="secondary" aria-pressed={panel === 'import'} onClick={() => toggle('import')}>
              Importer le mouvement
            </Button>
          </>
        }
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className={panel ? 'min-w-0 lg:col-span-5' : 'min-w-0 lg:col-span-12'}>
          <Registre nodeId={nodeId} nodeName={name} />
        </div>
        {panel === 'import' && (
          <div className="min-w-0 lg:col-span-7">
            <MovementImport onClose={() => setPanel(null)} />
          </div>
        )}
        {panel === 'nomination' && node.data && (
          <div className="min-w-0 lg:col-span-7">
            <NominationPanel nodeId={nodeId} nodeName={name} nodeType={node.data.type.code} onClose={() => setPanel(null)} />
          </div>
        )}
      </div>
    </div>
  );
};
