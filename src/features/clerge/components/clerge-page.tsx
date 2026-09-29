'use client';

import * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { cn } from '@/utils/cn';
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

const DIALOG: Record<
  Decision,
  {
    title: string;
    confirm: string;
    note: string;
    required: boolean;
    missing?: string;
    done: string;
  }
> = {
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

const attachment = (p: PersonStatus) =>
  [p.incardination_node?.name, p.institut_node?.name]
    .filter(Boolean)
    .join(' · ') || 'Non renseigné';

const nameOf = (p: PersonStatus) => p.full_name || p.email;

/** Nom pour les initiales : à défaut du nom, la partie locale de l'e-mail. */
const displayName = (p: PersonStatus) =>
  p.full_name || p.email.split('@')[0].replace(/[._]/g, ' ');

/** « Déclaration reçue le 22.09 à 17 h 05 » */
const receivedOn = (iso: string) =>
  `Déclaration reçue le ${dayjs(iso).format('DD.MM')} à ${hour(iso)}`;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-t border-line px-5 py-4">
    <h3 className="m-0 text-15 font-semibold text-ink">{title}</h3>
    <div className="mt-2">{children}</div>
  </div>
);

const Attachments = ({ files }: { files: DeclarationAttachment[] }) => (
  <Section title={`Justificatifs · ${files.length}`}>
    {files.length === 0 ? (
      <p className="m-0 text-14 text-ink-2">
        Aucun justificatif joint à la déclaration.
      </p>
    ) : (
      <ul className="m-0 list-none p-0">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2 border-t border-line py-2 text-14 first:border-t-0"
          >
            <Icon name="document" size={16} className="shrink-0 text-ink-3" />
            {f.url ? (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium hover:underline"
              >
                {f.file_name}
                <span className="sr-only"> (ouvre un nouvel onglet)</span>
              </a>
            ) : (
              <span className="break-all text-ink">{f.file_name}</span>
            )}
            <span className="tnum ml-auto shrink-0 text-13 text-ink-3">
              {dayjs(f.created_at).format('DD.MM.YYYY')}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Section>
);

const StatusBadge = ({ person }: { person: PersonStatus }) =>
  person.statut_verification === 'complement' ? (
    <Badge tone="info" dot>
      Complément demandé
    </Badge>
  ) : (
    <Badge tone="warn" dot>
      À vérifier
    </Badge>
  );

const DecisionPanel = ({
  person,
  onDone,
  onClose,
}: {
  person: PersonStatus;
  onDone: () => void;
  onClose: () => void;
}) => {
  const decide = useDecideVerification();
  const [dialog, setDialog] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState('');
  const [noteError, setNoteError] = React.useState<string | undefined>(
    undefined,
  );
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
    <section
      aria-labelledby="c-verif"
      className="overflow-hidden rounded-16 border border-line bg-paper shadow-menu"
    >
      <div className="flex items-start gap-3.5 px-5 pb-4 pt-5">
        <Avatar name={displayName(person)} size={56} />
        <div className="min-w-0 flex-1">
          <h2
            id="c-verif"
            className="m-0 mt-0.5 break-words text-20 font-semibold text-ink"
          >
            {nameOf(person)}
          </h2>
          <p className="m-0 text-14 text-ink-2">
            {ETAT_DE_VIE[person.etat_de_vie] ?? person.etat_de_vie} ·{' '}
            {DEGRE_ORDRE[person.degre_ordre] ?? person.degre_ordre}
          </p>
          <p className="tnum m-0 mt-0.5 break-all text-13 text-ink-3">
            {person.declared_at ? `${receivedOn(person.declared_at)} · ` : ''}
            compte {person.email}
          </p>
        </div>
        <IconButton
          icon="x"
          label="Fermer la fiche"
          size="sm"
          className="-mr-1.5 -mt-1.5"
          onClick={onClose}
        />
      </div>
      <div className="px-5 pb-5">
        <StatusBadge person={person} />
        {waiting && (
          <Notice
            tone="info"
            title="En attente de la personne"
            className="mt-3"
          >
            {person.verification_note || 'Un complément a été demandé.'}
          </Notice>
        )}
      </div>
      <Section title="Déclaration">
        <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-2 text-14">
          {[
            {
              label: 'État de vie',
              value: ETAT_DE_VIE[person.etat_de_vie] ?? person.etat_de_vie,
            },
            {
              label: 'Degré',
              value: DEGRE_ORDRE[person.degre_ordre] ?? person.degre_ordre,
            },
            {
              label: 'Incardination',
              value: person.incardination_node?.name ?? '—',
            },
            { label: 'Institut', value: person.institut_node?.name ?? '—' },
          ].map((row) => (
            <React.Fragment key={row.label}>
              <dt className="text-ink-3">{row.label}</dt>
              <dd className="m-0 break-words text-ink">{row.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </Section>
      <Attachments files={person.attachments} />
      <div className="border-t border-line px-5 pb-5 pt-4">
        <p className="m-0 flex gap-2 rounded-10 bg-surface px-3 py-2.5 text-13 text-ink-3">
          <Icon name="bouclier" size={16} className="mt-px shrink-0" />
          Vérifiez le celebret ou la lettre d’obédience avant de valider. La
          déclaration n’ouvre aucun droit tant qu’elle n’est pas vérifiée.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button block onClick={() => setDialog('verifie')}>
            Valider le statut de clerc
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-14"
              onClick={() => setDialog('complement')}
            >
              Demander un complément
            </Button>
            <Button
              variant="danger"
              className="text-14"
              onClick={() => setDialog('rejete')}
            >
              Refuser
            </Button>
          </div>
        </div>
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
          hint={
            dialog === 'complement'
              ? 'Transmis à la personne, qui complète sa déclaration.'
              : undefined
          }
          error={noteError}
          counter={{ value: note.length, max: NOTE_MAX }}
        >
          <Textarea
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </section>
  );
};

type StatusFilter = '' | 'declare' | 'complement';

/** Clergé : déclarations d'état de vie à vérifier (DIO-Clerge). */
export const ClergePage = () => {
  const [offset, setOffset] = React.useState(0);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [closed, setClosed] = React.useState(false);
  const list = useVerifications(offset);
  const results = list.data?.results ?? [];
  const rows = results.filter(
    (p) =>
      (!status || p.statut_verification === status) &&
      `${p.full_name} ${p.email} ${attachment(p)}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
  );
  const selected = closed
    ? undefined
    : (rows.find((p) => p.id === selectedId) ?? rows[0]);
  const count = list.data?.count;
  const select = (id: string) => {
    setSelectedId(id);
    setClosed(false);
  };

  return (
    <div>
      <PageHeader
        compact
        title="Clergé"
        description="Les déclarations d’état de vie des clercs et consacrés de votre périmètre, à vérifier avant d’ouvrir leurs droits."
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label htmlFor="c-rech" className="sr-only">
          Rechercher
        </label>
        <div className="w-full sm:w-72">
          <Input
            id="c-rech"
            type="search"
            icon="recherche"
            controlSize="sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, e-mail, diocèse, institut"
            className="h-9 rounded-10 text-14"
          />
        </div>
        <div>
          <label htmlFor="c-statut" className="sr-only">
            Statut
          </label>
          <Select
            id="c-statut"
            controlSize="sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={cn(
              'h-9 w-auto rounded-full pl-3.5 text-14 font-medium',
              status
                ? 'border-line-active bg-tint-50 text-tint-800'
                : 'border-line bg-paper text-ink hover:border-line-field',
            )}
          >
            <option value="">Tous les statuts</option>
            <option value="declare">À vérifier</option>
            <option value="complement">Complément demandé</option>
          </Select>
        </div>
        <span className="flex-1" />
        {count !== undefined && count > 0 && (
          <span className="tnum whitespace-nowrap text-14 text-ink-3">
            {rows.length} sur {count} déclaration{count > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div
        className={cn(
          'mt-4 grid grid-cols-1 items-start gap-6',
          rows.length > 0 && 'lg:grid-cols-[minmax(0,1fr)_376px]',
        )}
      >
        <div className="min-w-0">
          {list.isPending ? (
            <LoadingBlock label="Chargement des déclarations…" lines={4} />
          ) : list.isError ? (
            <EmptyState
              tone="err"
              icon="alerte"
              title="Les déclarations n’ont pas pu être chargées"
            >
              {list.error.message}
            </EmptyState>
          ) : rows.length === 0 ? (
            <EmptyState
              icon="check"
              title={
                q || status
                  ? 'Aucune déclaration ne correspond'
                  : 'Aucune déclaration en attente'
              }
            >
              {q || status
                ? 'Modifiez la recherche ou le filtre.'
                : 'Toutes les déclarations de votre périmètre ont été traitées.'}
            </EmptyState>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <Table label="Déclarations en attente, défilement horizontal">
                <thead>
                  <tr>
                    <Th className="h-10">Nom</Th>
                    <Th className="h-10">Incardination · institut</Th>
                    <Th className="h-10">Statut</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const isSelected = p.id === selected?.id;
                    return (
                      <Tr key={p.id} selected={isSelected}>
                        <Td className="h-16 py-2.5">
                          <span className="flex items-center gap-3">
                            <Avatar name={displayName(p)} size={36} />
                            <span className="flex min-w-0 flex-col">
                              <button
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => select(p.id)}
                                className={cn(
                                  'break-words text-left text-15 font-semibold hover:underline',
                                  isSelected ? 'text-tint-800' : 'text-ink',
                                )}
                              >
                                {nameOf(p)}
                              </button>
                              <span className="text-13 text-ink-3">
                                {ETAT_DE_VIE[p.etat_de_vie] ?? p.etat_de_vie} ·{' '}
                                {DEGRE_ORDRE[p.degre_ordre] ?? p.degre_ordre}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td className="h-16 py-2.5 text-14">{attachment(p)}</Td>
                        <Td className="h-16 py-2.5">
                          <StatusBadge person={p} />
                          {p.declared_at && (
                            <span className="tnum mt-0.5 block text-13 text-ink-3">
                              reçue le {dayjs(p.declared_at).format('DD.MM')}
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              {list.data.count > VERIFICATIONS_PAGE && (
                <Pagination
                  offset={offset}
                  limit={VERIFICATIONS_PAGE}
                  total={list.data.count}
                  onChange={setOffset}
                  className="px-5 py-3"
                />
              )}
            </Card>
          )}
        </div>
        <div className="min-w-0">
          {selected ? (
            <DecisionPanel
              key={selected.id}
              person={selected}
              onDone={() => setSelectedId(null)}
              onClose={() => setClosed(true)}
            />
          ) : (
            !list.isPending &&
            rows.length > 0 && (
              <p className="m-0 rounded-16 border border-line bg-surface p-5 text-14 text-ink-2">
                Sélectionnez une déclaration pour la vérifier.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
