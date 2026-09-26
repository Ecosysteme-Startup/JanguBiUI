'use client';

import * as React from 'react';

import { StatusDot } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { dayjs, hour } from '@/utils/dates';

import { useDecideVerification } from '../api/decide-verification';
import {
  type DeclarationAttachment,
  DEGRE_ORDRE,
  ETAT_DE_VIE,
  type PersonStatus,
  useVerifications,
  VERIFICATIONS_PAGE,
} from '../api/get-verifications';

const NOTE_MAX = 255;

type Decision = 'verifie' | 'rejete' | 'complement';

const DIALOG: Record<Decision, { title: string; confirm: string; note: string; required: boolean; missing?: string; done: string }> = {
  verifie: {
    title: 'Valider cette déclaration ?',
    confirm: 'Valider',
    note: 'Note (facultative)',
    required: false,
    done: 'Statut vérifié. Inscrit au journal d’audit.',
  },
  complement: {
    title: 'Demander un complément ?',
    confirm: 'Envoyer la demande',
    note: 'Ce qui manque',
    required: true,
    missing: 'Indiquez ce qui manque : le motif est transmis à la personne.',
    done: 'Complément demandé : la personne est prévenue. Inscrit au journal d’audit.',
  },
  rejete: {
    title: 'Refuser cette déclaration ?',
    confirm: 'Refuser la déclaration',
    note: 'Motif du refus',
    required: true,
    missing: 'Indiquez le motif du refus : il est transmis à la personne.',
    done: 'Déclaration refusée. Inscrit au journal d’audit.',
  },
};

const attachment = (p: PersonStatus) => [p.incardination_node?.name, p.institut_node?.name].filter(Boolean).join(' · ') || 'Non renseigné';

const nameOf = (p: PersonStatus) => p.full_name || p.email;

/** « Déclaration reçue le 22.09 à 17 h 05 » */
const receivedOn = (iso: string) => `Déclaration reçue le ${dayjs(iso).format('DD.MM')} à ${hour(iso)}`;

const Attachments = ({ files }: { files: DeclarationAttachment[] }) => (
  <div className="mt-5 border-t border-line pt-3">
    <p className="tnum m-0 text-meta text-ink-3">Justificatifs · {files.length}</p>
    {files.length === 0 ? (
      <p className="m-0 mt-2 text-sm text-ink-2">Aucun justificatif joint à la déclaration.</p>
    ) : (
      <ul className="m-0 mt-2 list-none p-0">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 py-1.5 text-sm">
            <Icon name="document" size={16} className="shrink-0 text-ink-3" />
            {f.url ? (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {f.file_name}
                <span className="sr-only"> (ouvre un nouvel onglet)</span>
              </a>
            ) : (
              <span className="break-all text-ink">{f.file_name}</span>
            )}
            <span className="tnum ml-auto shrink-0 text-meta text-ink-3">{dayjs(f.created_at).format('DD.MM.YYYY')}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const DecisionPanel = ({ person, onDone }: { person: PersonStatus; onDone: () => void }) => {
  const decide = useDecideVerification();
  const [dialog, setDialog] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState('');
  const [noteError, setNoteError] = React.useState<string | undefined>(undefined);
  const waiting = person.statut_verification === 'complement';

  const close = () => {
    setDialog(null);
    setNote('');
    setNoteError(undefined);
  };

  const confirm = () => {
    if (!dialog) return;
    const spec = DIALOG[dialog];
    if (spec.required && !note.trim()) {
      setNoteError(spec.missing);
      return;
    }
    decide.mutate(
      { personId: person.id, body: { decision: dialog, note: note.trim() } },
      {
        onSuccess: () => {
          toast.ok(spec.done);
          close();
          onDone();
        },
        onError: (error) => toast.err(error.message),
      },
    );
  };

  const spec = dialog ? DIALOG[dialog] : null;
  return (
    <section aria-labelledby="c-verif" className="border border-line bg-surface p-6">
      <p className={`tnum m-0 flex items-center gap-2 text-meta ${waiting ? 'text-ink-2' : 'text-warn'}`}>
        <span aria-hidden="true" className={`size-2 rounded-full ${waiting ? 'bg-ink-3' : 'bg-warn-dot'}`} />
        {waiting ? 'Complément demandé' : 'Vérification en attente'}
      </p>
      <h2 id="c-verif" className="m-0 mt-2 break-words font-serif text-h3 font-normal text-ink">
        {nameOf(person)}
      </h2>
      <p className="m-0 mt-1 break-all text-sm text-ink-2">
        {person.declared_at ? `${receivedOn(person.declared_at)} · ` : ''}compte {person.email}
      </p>
      {waiting && (
        <Notice tone="info" title="En attente de la personne" className="mt-4">
          {person.verification_note || 'Un complément a été demandé.'}
        </Notice>
      )}
      <dl className="m-0 mt-5">
        {[
          { label: 'État de vie', value: ETAT_DE_VIE[person.etat_de_vie] ?? person.etat_de_vie },
          { label: 'Degré', value: DEGRE_ORDRE[person.degre_ordre] ?? person.degre_ordre },
          { label: 'Incardination', value: person.incardination_node?.name ?? '—' },
          { label: 'Institut', value: person.institut_node?.name ?? '—' },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 border-t border-line py-2.5">
            <dt className="tnum text-meta text-ink-3">{row.label}</dt>
            <dd className="m-0 text-sm text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Attachments files={person.attachments} />
      <p className="m-0 mt-4 text-sm text-ink-2">
        Vérifiez le celebret ou la lettre d’obédience avant de valider. La déclaration n’ouvre aucun droit tant qu’elle n’est pas
        vérifiée.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button block onClick={() => setDialog('verifie')}>
          Valider le statut de clerc
        </Button>
        <Button block variant="secondary" onClick={() => setDialog('complement')}>
          Demander un complément
        </Button>
        <Button block variant="danger" onClick={() => setDialog('rejete')}>
          Refuser
        </Button>
      </div>
      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && close()}
        title={spec?.title ?? ''}
        description={`${nameOf(person)} · ${DEGRE_ORDRE[person.degre_ordre] ?? person.degre_ordre}`}
        confirmLabel={spec?.confirm ?? ''}
        tone={dialog === 'rejete' ? 'danger' : 'primary'}
        pending={decide.isPending}
        onConfirm={confirm}
      >
        <Field
          id="c-note"
          label={spec?.note ?? ''}
          required={spec?.required}
          hint={dialog === 'complement' ? 'Transmis à la personne, qui complète sa déclaration.' : undefined}
          error={noteError}
          counter={{ value: note.length, max: NOTE_MAX }}
        >
          <Textarea value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </ConfirmDialog>
    </section>
  );
};

/** Clergé : déclarations d'état de vie à vérifier (DIO-Clerge). */
export const ClergePage = () => {
  const [offset, setOffset] = React.useState(0);
  const [q, setQ] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const list = useVerifications(offset);
  const rows = (list.data?.results ?? []).filter((p) =>
    `${p.full_name} ${p.email} ${attachment(p)}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const selected = rows.find((p) => p.id === selectedId) ?? rows[0];
  const count = list.data?.count;

  return (
    <div>
      <PageHeader
        number="04"
        eyebrow={`Gouvernance · ${count === undefined ? '…' : `${count} déclaration${count > 1 ? 's' : ''} à vérifier`}`}
        title="Annuaire du clergé"
      />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section aria-labelledby="c-liste" className="flex min-w-0 flex-col lg:col-span-8">
          <SectionHeading
            id="c-liste"
            number="01"
            title="Déclarations à vérifier"
            aside={count !== undefined ? String(count) : undefined}
          />
          <div className="flex max-w-md flex-col gap-1.5">
            <label htmlFor="c-rech" className="tnum text-meta text-ink-3">
              Rechercher
            </label>
            <Input
              id="c-rech"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, e-mail, diocèse, institut"
              className="h-10 text-sm"
            />
          </div>
          <div className="mt-4">
            {list.isPending ? (
              <LoadingBlock label="Chargement des déclarations…" lines={4} />
            ) : list.isError ? (
              <EmptyState tone="err" icon="alerte" title="Les déclarations n’ont pas pu être chargées">
                {list.error.message}
              </EmptyState>
            ) : rows.length === 0 ? (
              <EmptyState icon="check" title={q ? 'Aucune déclaration ne correspond' : 'Aucune déclaration en attente'}>
                {q ? 'Modifiez la recherche.' : 'Toutes les déclarations de votre périmètre ont été traitées.'}
              </EmptyState>
            ) : (
              <>
                <Table label="Déclarations en attente, défilement horizontal">
                  <thead>
                    <tr>
                      <Th>Clerc</Th>
                      <Th>Incardination · institut</Th>
                      <Th>Statut</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <Tr key={p.id} selected={p.id === selected?.id}>
                        <Td>
                          <span className="flex items-center gap-3 py-2">
                            <Avatar name={p.full_name || p.email.split('@')[0].replace(/[._]/g, ' ')} size={32} />
                            <span className="min-w-0">
                              <button
                                type="button"
                                aria-pressed={p.id === selected?.id}
                                onClick={() => setSelectedId(p.id)}
                                className="block break-words text-left font-medium text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                              >
                                {nameOf(p)}
                              </button>
                              <span className="block text-sm text-ink-2">
                                {ETAT_DE_VIE[p.etat_de_vie] ?? p.etat_de_vie} · {DEGRE_ORDRE[p.degre_ordre] ?? p.degre_ordre}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>{attachment(p)}</Td>
                        <Td>
                          {p.statut_verification === 'complement' ? (
                            <StatusDot tone="outline" label="Complément demandé" />
                          ) : (
                            <StatusDot tone="warn" label="À vérifier" />
                          )}
                          {p.declared_at && (
                            <span className="tnum block text-meta text-ink-3">reçue le {dayjs(p.declared_at).format('DD.MM')}</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination offset={offset} limit={VERIFICATIONS_PAGE} total={list.data.count} onChange={setOffset} className="mt-2" />
              </>
            )}
          </div>
        </section>
        <div className="min-w-0 lg:col-span-4">
          {selected ? (
            <DecisionPanel key={selected.id} person={selected} onDone={() => setSelectedId(null)} />
          ) : (
            !list.isPending && (
              <p className="m-0 border border-line bg-surface p-6 text-sm text-ink-2">Sélectionnez une déclaration pour la vérifier.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
