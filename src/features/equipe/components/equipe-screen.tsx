'use client';

import { useState } from 'react';

import { CAPABILITY_LABELS, CapabilityChips } from '@/components/signature/capability-chips';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { useNode } from '@/hooks/use-node';
import { useCan } from '@/lib/can';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { type Assignment, useEndAssignment, useNodeAssignments } from '../api/assignments';
import { useNodeChildren } from '../api/node-children';
import { type Office, useOfficeCatalogue } from '../api/office-catalogue';

import { NominationForm, type NominationTarget } from './nomination-form';

const VISIBLE_CAPS = 2;

const OfficeCapabilities = ({ office }: { office: Office | undefined }) => {
  if (!office) return <span className="text-sm text-ink-3">—</span>;
  const shown = office.capabilities.slice(0, VISIBLE_CAPS);
  const rest = office.capabilities.slice(VISIBLE_CAPS);
  const restLabels = rest.map((c) => CAPABILITY_LABELS[c] ?? c).join(', ');
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <CapabilityChips capabilities={shown} />
      {rest.length > 0 && (
        <span title={restLabels} className="tnum text-meta text-ink-3">
          +{rest.length}
          <span className="sr-only"> : {restLabels}</span>
        </span>
      )}
    </span>
  );
};

const EndAssignmentModal = ({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) => {
  const [endDate, setEndDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const end = useEndAssignment({
    onSuccess: () => {
      toast.ok('Nomination terminée : les capacités de l’office sont retirées.');
      onClose();
    },
  });
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Terminer cette nomination ?"
      description={`${assignment.person.full_name}, ${assignment.office_label.toLowerCase()} · ${assignment.node.name}. Les capacités de l’office cessent à la date de fin.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" disabled={end.isPending || !endDate} onClick={() => end.mutate({ id: assignment.id, endDate })}>
            {end.isPending ? 'Enregistrement…' : 'Terminer la nomination'}
          </Button>
        </>
      }
    >
      <Field id="fin-mandat" label="Date de fin">
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </Field>
      {end.isError && (
        <p role="alert" className="m-0 mt-3 text-sm text-err">
          {apiErrorMessage(end.error)}
        </p>
      )}
    </Modal>
  );
};

const PAST_REASON: Record<string, string> = { terminee: 'Fin de mandat', annulee: 'Annulée' };

/** PAR-Equipe : offices actifs et passés du nœud ; nomination si `offices.nommer`, sinon lecture. */
export const EquipeScreen = ({ nodeId }: { nodeId: string }) => {
  const canNommer = useCan('offices.nommer', nodeId);
  const [panelOpen, setPanelOpen] = useState(false);
  const [ending, setEnding] = useState<Assignment | null>(null);
  const assignments = useNodeAssignments(nodeId);
  const catalogue = useOfficeCatalogue();
  const node = useNode(nodeId);
  const children = useNodeChildren(nodeId);

  const offices = catalogue.data ?? [];
  const officeOf = (code: string) => offices.find((o) => o.code === code);
  const all = assignments.data?.results ?? [];
  const current = all.filter((a) => a.status === 'active' || a.status === 'proposee');
  const past = all.filter((a) => a.status === 'terminee' || a.status === 'annulee');
  const targets: NominationTarget[] = [
    ...(node.data ? [{ id: node.data.id, name: node.data.name, type: node.data.type.code }] : []),
    ...(children.data ?? []).map((c) => ({ id: c.id, name: c.name, type: c.type.code })),
  ];

  return (
    <div className={cn('grid items-start gap-8', panelOpen && canNommer && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="tnum m-0 text-meta text-ink-2">
              <span className="text-primary">08</span> — Administration · offices et capacités
            </p>
            <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">Équipe et nominations</h1>
          </div>
          {canNommer && (
            <Button aria-expanded={panelOpen} aria-controls="panneau-nomination" onClick={() => setPanelOpen(true)}>
              <Icon name="plus" size={16} /> Nommer une personne
            </Button>
          )}
        </div>
        {assignments.data && (
          <p className="m-0 mt-3 text-base text-ink-2" aria-live="polite">
            {current.length} office{current.length > 1 ? 's' : ''} actif{current.length > 1 ? 's' : ''} sur {node.data?.name ?? 'ce nœud'} et les nœuds rattachés.
          </p>
        )}
        {!canNommer && (
          <Notice tone="info" title="Consultation seule" className="mt-4">
            Nommer ou terminer une nomination demande la capacité « Nominations » sur ce nœud. Vous voyez les nominations que le serveur vous
            ouvre.
          </Notice>
        )}

        {assignments.isPending ? (
          <div className="mt-8">
            <LoadingBlock label="Chargement de l’équipe…" lines={5} />
          </div>
        ) : assignments.isError ? (
          <EmptyState icon={isForbidden(assignments.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(assignments.error) ? 'Accès refusé' : 'Équipe indisponible'} className="mt-8">
            {apiErrorMessage(assignments.error)}
          </EmptyState>
        ) : (
          <>
            <section aria-labelledby="e-actifs" className="mt-8">
              <h2 id="e-actifs" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
                <span className="text-primary">01</span> — Offices actifs
              </h2>
              {current.length === 0 ? (
                <p className="m-0 mt-3 text-sm text-ink-3">Aucun office actif visible.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Office · lieu</Th>
                      <Th>Titulaire · depuis</Th>
                      <Th>Capacités</Th>
                      {canNommer && (
                        <Th className="w-28">
                          <span className="sr-only">Actions</span>
                        </Th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {current.map((a) => (
                      <Tr key={a.id}>
                        <Td>
                          <span className="block font-semibold text-ink">{a.office_label}</span>
                          <span className="block text-xs text-ink-3">{a.node.name}</span>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-3">
                            <Avatar name={a.person.full_name} />
                            <span>
                              <span className="block font-medium">{a.person.full_name}</span>
                              <span className="tnum block text-meta text-ink-3">
                                {dayjs(a.start_date).format('DD.MM.YYYY')}
                                {a.status === 'proposee' && ' · proposée'}
                                {a.decree_ref && ` · ${a.decree_ref}`}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>
                          <OfficeCapabilities office={officeOf(a.office)} />
                        </Td>
                        {canNommer && (
                          <Td className="text-right">
                            <Button variant="tertiary" size="sm" onClick={() => setEnding(a)} aria-label={`Terminer la nomination de ${a.person.full_name}`}>
                              Terminer
                            </Button>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>

            <section aria-labelledby="e-passees" className="mt-10">
              <h2 id="e-passees" className="tnum m-0 flex justify-between border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
                <span>
                  <span className="text-primary">02</span> — Nominations passées
                </span>
                <span className="text-ink-3">{past.length}</span>
              </h2>
              {past.length === 0 ? (
                <p className="m-0 mt-3 text-sm text-ink-3">Aucune nomination passée.</p>
              ) : (
                <ul className="m-0 mt-2 list-none p-0">
                  {past.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line py-3 text-sm">
                      <span className="w-44 font-semibold text-ink">{a.office_label}</span>
                      <span className="min-w-0 flex-1 text-ink-2">
                        {a.person.full_name} · {a.node.name}
                      </span>
                      <span className="tnum text-meta text-ink-3">
                        {dayjs(a.start_date).format('DD.MM.YYYY')} → {a.end_date ? dayjs(a.end_date).format('DD.MM.YYYY') : '—'}
                      </span>
                      <span className="w-32 text-right text-ink-3">{a.note || PAST_REASON[a.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {panelOpen && canNommer && (
        <section id="panneau-nomination" aria-labelledby="n-titre" className="rounded border border-line-strong bg-surface p-6 xl:sticky xl:top-6">
          {catalogue.isPending || node.isPending ? (
            <LoadingBlock label="Chargement du catalogue d’offices…" />
          ) : (
            <NominationForm targets={targets} offices={offices} onClose={() => setPanelOpen(false)} />
          )}
        </section>
      )}

      {ending && <EndAssignmentModal assignment={ending} onClose={() => setEnding(null)} />}
    </div>
  );
};
