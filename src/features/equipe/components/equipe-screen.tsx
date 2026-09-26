'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CAPABILITY_LABELS } from '@/components/signature/capability-chips';
import { QualityModal } from '@/components/signature/quality-modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useMe } from '@/hooks/use-me';
import { useNode } from '@/hooks/use-node';
import { useCan } from '@/lib/can';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { ofParish } from '@/utils/parish-name';

import { type Assignment, useEndAssignment, useNodeAssignments, useSetAssignmentQuality } from '../api/assignments';
import { useNodeChildren } from '../api/node-children';
import { type Office, useOfficeCatalogue } from '../api/office-catalogue';

import { NominationForm, type NominationTarget } from './nomination-form';

const VISIBLE_CAPS = 2;

/** Capacités clés d'un office : étiquettes 22 px surface2 (PAR-Equipe), le reste en « +n ». */
const OfficeCapabilities = ({ office }: { office: Office | undefined }) => {
  if (!office) return <span className="text-14 text-ink-3">—</span>;
  const shown = office.capabilities.slice(0, VISIBLE_CAPS);
  const rest = office.capabilities.slice(VISIBLE_CAPS);
  const restLabels = rest.map((c) => CAPABILITY_LABELS[c] ?? c).join(', ');
  return (
    <span className="flex flex-wrap items-center gap-1">
      <ul aria-label="Capacités" className="m-0 flex list-none flex-wrap gap-1 p-0">
        {shown.map((c) => (
          <li key={c} className="inline-flex h-[22px] items-center whitespace-nowrap rounded-6 bg-surface-2 px-2 text-12 font-medium text-ink-2">
            {CAPABILITY_LABELS[c] ?? c}
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <span title={restLabels} className="tnum text-12 font-medium text-ink-3">
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
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" disabled={end.isPending || !endDate} onClick={() => end.mutate({ id: assignment.id, endDate })}>
            {end.isPending ? 'Enregistrement…' : 'Terminer la nomination'}
          </Button>
        </>
      }
    >
      <Field id="fin-mandat" label="Date de fin">
        <Input type="date" controlSize="sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </Field>
      {end.isError && (
        <p role="alert" className="m-0 mt-3 text-14 text-err">
          {apiErrorMessage(end.error)}
        </p>
      )}
    </Modal>
  );
};

const EquipeQualityModal = ({ assignment, office, onClose }: { assignment: Assignment; office: Office; onClose: () => void }) => {
  const { data: me } = useMe();
  const save = useSetAssignmentQuality({
    meId: me?.id,
    onSuccess: (a) => {
      toast.ok(`Qualité modifiée : ${a.person.full_name}, ${a.office_label.toLowerCase()}.`);
      onClose();
    },
  });
  return (
    <QualityModal
      subject={`${assignment.person.full_name} · ${assignment.node.name}`}
      qualities={office.qualities}
      current={assignment.quality}
      pending={save.isPending}
      error={save.isError ? apiErrorMessage(save.error) : undefined}
      onSubmit={(quality) => save.mutate({ id: assignment.id, quality })}
      onClose={onClose}
    />
  );
};

const MemberActions = ({ assignment, canQualify, onQualify, onEnd }: { assignment: Assignment; canQualify: boolean; onQualify: () => void; onEnd: () => void }) => (
  <Menu>
    <MenuTrigger
      aria-label={`Actions pour ${assignment.person.full_name}`}
      className="hit inline-flex size-9 items-center justify-center rounded-10 text-ink-2 hover:bg-surface-2 data-[state=open]:bg-surface-2"
    >
      <Icon name="plus-horizontal" size={18} />
    </MenuTrigger>
    <MenuContent align="end">
      {canQualify && (
        <MenuItem icon="crayon" onSelect={onQualify}>
          Modifier la qualité
        </MenuItem>
      )}
      <MenuItem icon="x" tone="danger" onSelect={onEnd}>
        Terminer la nomination
      </MenuItem>
    </MenuContent>
  </Menu>
);

const PAST_REASON: Record<string, string> = { terminee: 'Fin de mandat', annulee: 'Annulée' };

/** PAR-Equipe : offices actifs et passés du nœud ; nomination si `offices.nommer`, lecture avec `tableau_bord.voir`. */
export const EquipeScreen = ({ nodeId }: { nodeId: string }) => {
  const canNommer = useCan('offices.nommer', nodeId);
  const [panelOpen, setPanelOpen] = useState(false);
  // Panneau non modal (A11Y-16) : le focus y entre à l'ouverture, Échap le ferme, le focus revient au bouton.
  const openerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    openerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!panelOpen) return;
    panelRef.current?.focus();
    // Écoute au niveau du document : les gestionnaires React (combobox) ont déjà traité l'événement.
    // La liste de la combobox consomme le premier Échap (preventDefault) ; le suivant ferme le panneau.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !panelRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      closePanel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panelOpen, closePanel]);
  const [ending, setEnding] = useState<Assignment | null>(null);
  const [qualifying, setQualifying] = useState<Assignment | null>(null);
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

  const pending = current.filter((a) => a.status === 'proposee');

  return (
    <div className={cn('grid items-start gap-8', panelOpen && canNommer && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
      <div className="min-w-0">
        <PageHeader
          compact
          title="Équipe et offices"
          description={`Les personnes qui servent ${node.data ? ofParish(node.data.name) : 'ce nœud'} sur Jàngu Bi. L’office donne les capacités, pour la paroisse et les nœuds rattachés.`}
          actions={
            canNommer && (
              <Button ref={openerRef} className="min-h-11 px-5" aria-expanded={panelOpen} aria-controls="panneau-nomination" onClick={() => setPanelOpen(true)}>
                <Icon name="utilisateur-plus" size={18} /> Nommer une personne
              </Button>
            )
          }
        />
        {!canNommer && (
          <Notice tone="info" title="Consultation seule" className="mt-6">
            Vous voyez l’équipe de ce nœud et des nœuds rattachés. Nommer ou terminer une nomination demande la capacité « Nominations ».
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
            {pending.length > 0 && (
              <section aria-labelledby="e-attente" className="mt-6 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
                <h2 id="e-attente" className="sr-only">
                  Nominations en attente
                </h2>
                <ul className="m-0 list-none p-0">
                  {pending.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 border-t border-line px-5 py-4 first:border-t-0">
                      <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-line-field text-ink-3">
                        <Icon name="historique" size={18} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-15 font-semibold text-ink">
                            {a.person.full_name}, {a.office_label.toLowerCase()}
                          </span>
                          <Badge tone="warn" dot>
                            Nomination en attente
                          </Badge>
                        </span>
                        <span className="text-14 text-ink-2">
                          {a.node.name} · proposée le {dayjs(a.start_date).format('D MMM')}
                          {a.decree_ref && ` · ${a.decree_ref}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Tabs defaultValue="actifs" className="mt-6">
              <TabsList aria-label="Équipe" className="gap-7 px-0">
                <TabsTrigger value="actifs" count={current.length} countPill>
                  Membres actifs
                </TabsTrigger>
                <TabsTrigger value="passes" count={past.length} countPill>
                  Offices terminés
                </TabsTrigger>
              </TabsList>
              <TabsContent value="actifs">
                <section aria-labelledby="e-actifs" className="mt-4">
                  <h2 id="e-actifs" className="sr-only">
                    Offices actifs
                  </h2>
                  <p className="sr-only" aria-live="polite">
                    {current.length} office{current.length > 1 ? 's' : ''} actif{current.length > 1 ? 's' : ''} sur {node.data?.name ?? 'ce nœud'} et les nœuds rattachés.
                  </p>
                  {current.length === 0 ? (
                    <EmptyState icon="utilisateurs" title="Aucun office actif visible" className="rounded-16 border border-line" />
                  ) : (
                    <div className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
                      <Table label="Offices actifs, défilement horizontal" className="min-w-[720px]">
                        <thead>
                          <tr>
                            <Th className="h-10 border-b-0">Personne</Th>
                            <Th className="h-10 w-[200px] border-b-0">Office</Th>
                            <Th className="h-10 w-[104px] border-b-0">Depuis</Th>
                            <Th className="h-10 w-[240px] border-b-0">Capacités clés</Th>
                            {canNommer && (
                              <Th className="h-10 w-[56px] border-b-0">
                                <span className="sr-only">Actions</span>
                              </Th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="[&>tr>td]:border-b-0 [&>tr>td]:border-t [&>tr>td]:border-line">
                          {current.map((a) => (
                            <Tr key={a.id}>
                              <Td className="h-18 max-w-0 py-3">
                                <span className="flex min-w-0 items-center gap-3">
                                  <Avatar name={a.person.full_name} size={36} />
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-15 font-semibold text-ink">{a.person.full_name}</span>
                                    <span className="truncate text-13 text-ink-3">{a.person.email}</span>
                                  </span>
                                </span>
                              </Td>
                              <Td className="py-3">
                                <span className="flex flex-col">
                                  <span className="text-14 font-medium text-ink">{a.office_label}</span>
                                  <span className="text-13 text-ink-3">{a.node.name}</span>
                                </span>
                              </Td>
                              <Td className="tnum whitespace-nowrap py-3 text-14 text-ink-2">
                                {dayjs(a.start_date).format('MMM YYYY')}
                                {a.status === 'proposee' && <span className="block text-13 text-warn">proposée</span>}
                              </Td>
                              <Td className="py-3">
                                <OfficeCapabilities office={officeOf(a.office)} />
                              </Td>
                              {canNommer && (
                                <Td className="py-3 text-right">
                                  <MemberActions
                                    assignment={a}
                                    canQualify={a.status === 'active' && (officeOf(a.office)?.qualities.length ?? 0) > 0}
                                    onQualify={() => setQualifying(a)}
                                    onEnd={() => setEnding(a)}
                                  />
                                </Td>
                              )}
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </section>
              </TabsContent>
              <TabsContent value="passes">
                <section aria-labelledby="e-passees" className="mt-4">
                  <h2 id="e-passees" className="sr-only">
                    Nominations passées
                  </h2>
                  {past.length === 0 ? (
                    <EmptyState icon="historique" title="Aucune nomination passée" className="rounded-16 border border-line" />
                  ) : (
                    <ul className="m-0 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card">
                      {past.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3.5 first:border-t-0">
                          <Avatar name={a.person.full_name} size={32} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-15 font-semibold text-ink">{a.person.full_name}</span>
                            <span className="text-13 text-ink-3">
                              {a.office_label} · {a.node.name}
                            </span>
                          </span>
                          <span className="tnum text-14 text-ink-2">
                            {dayjs(a.start_date).format('MMM YYYY')} → {a.end_date ? dayjs(a.end_date).format('MMM YYYY') : '—'}
                          </span>
                          <Badge tone="muted">{a.note || PAST_REASON[a.status]}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </TabsContent>
            </Tabs>
            <p className="m-0 mt-4 flex items-start gap-2 text-13 text-ink-3">
              <Icon name="bouclier" size={16} className="mt-px shrink-0" />
              La double authentification est obligatoire pour tout le personnel. Un office se termine à sa date de fin ; les accès sont alors retirés.
            </p>
          </>
        )}
      </div>

      {panelOpen && canNommer && (
        <section
          ref={panelRef}
          id="panneau-nomination"
          aria-labelledby="n-titre"
          tabIndex={-1}
          className="rounded-16 border border-line bg-paper p-6 shadow-card focus:outline-none xl:sticky xl:top-6"
        >
          {catalogue.isPending || node.isPending ? (
            <LoadingBlock label="Chargement du catalogue d’offices…" />
          ) : (
            <NominationForm targets={targets} offices={offices} onClose={closePanel} />
          )}
        </section>
      )}

      {ending && <EndAssignmentModal assignment={ending} onClose={() => setEnding(null)} />}
      {qualifying && officeOf(qualifying.office) && (
        <EquipeQualityModal assignment={qualifying} office={officeOf(qualifying.office)!} onClose={() => setQualifying(null)} />
      )}
    </div>
  );
};
