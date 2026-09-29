'use client';

import { Paperclip } from 'lucide-react';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import {
  type ActeDetail,
  LIBELLES_STATUT,
  LIBELLES_TRANSITION,
  MESSAGE_REQUIS,
  type StatutActe,
  TRANSITIONS_PAR_STATUT,
  type TransitionActe,
  useActe,
  useAjouterNote,
  useAssignables,
  useAttribuer,
  useNotesActe,
  useTransitionActe,
} from '../api/staff-documents';

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function Ligne({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground">{valeur}</dd>
    </div>
  );
}

function Actions({ acte }: { acte: ActeDetail }) {
  const id = useId();
  const [choix, setChoix] = useState<TransitionActe | null>(null);
  const [message, setMessage] = useState('');
  const transition = useTransitionActe(acte.id);
  const possibles = TRANSITIONS_PAR_STATUT[acte.status] ?? [];
  if (possibles.length === 0) return null;
  const requis = choix ? MESSAGE_REQUIS.includes(choix) : false;
  const erreur =
    transition.error instanceof ApiError ? transition.error.message : null;

  return (
    <section
      aria-labelledby={`${id}-t`}
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 id={`${id}-t`} className="mb-3 text-sm font-semibold">
        Faire avancer la demande
      </h2>
      <div className="flex flex-wrap gap-2">
        {possibles.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={
              choix === t ? 'default' : t === 'reject' ? 'outline' : 'secondary'
            }
            onClick={() => {
              setChoix(t);
              transition.reset();
            }}
          >
            {LIBELLES_TRANSITION[t]}
          </Button>
        ))}
      </div>
      {choix && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            transition.mutate(
              { transition: choix, message },
              {
                onSuccess: () => {
                  setChoix(null);
                  setMessage('');
                },
              },
            );
          }}
        >
          <label htmlFor={`${id}-m`} className="block text-sm font-medium">
            {choix === 'reject'
              ? 'Motif du rejet (transmis au fidèle)'
              : choix === 'request-info'
                ? 'Complément attendu (transmis au fidèle)'
                : 'Message au fidèle (facultatif)'}
          </label>
          <textarea
            id={`${id}-m`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required={requis}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {erreur && (
            <p role="alert" className="text-sm text-destructive">
              {erreur}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              isLoading={transition.isPending}
              disabled={requis && !message.trim()}
            >
              Confirmer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setChoix(null)}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function Attribution({ acte }: { acte: ActeDetail }) {
  const id = useId();
  const { data: equipe = [] } = useAssignables(acte.id);
  const attribuer = useAttribuer(acte.id);
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="text-muted-foreground">
        Suivi par
      </label>
      <select
        id={id}
        value={acte.assigned_to_id ?? ''}
        disabled={attribuer.isPending}
        onChange={(e) => attribuer.mutate(e.target.value || null)}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        <option value="">À attribuer</option>
        {equipe.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Notes({ acteId }: { acteId: string }) {
  const id = useId();
  const { data: notes = [] } = useNotesActe(acteId);
  const ajouter = useAjouterNote(acteId);
  const [texte, setTexte] = useState('');
  return (
    <section
      aria-labelledby={`${id}-n`}
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 id={`${id}-n`} className="mb-1 text-sm font-semibold">
        Notes internes
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Jamais visibles du fidèle.
      </p>
      <ul className="mb-3 space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg bg-muted/40 p-2 text-sm">
            <p className="whitespace-pre-line">{n.content}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {n.author_name} · {dateLongue(n.created_at)}
            </p>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texte.trim()) return;
          ajouter.mutate(texte.trim(), { onSuccess: () => setTexte('') });
        }}
      >
        <label htmlFor={`${id}-i`} className="sr-only">
          Nouvelle note
        </label>
        <input
          id={`${id}-i`}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Ajouter une note"
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <Button type="submit" size="sm" isLoading={ajouter.isPending}>
          Ajouter
        </Button>
      </form>
    </section>
  );
}

/** Détail d'une demande d'acte côté paroisse (`/v1/staff/documents/{id}/`). */
export function StaffActeDetail({ acteId }: { acteId: string }) {
  const { data: acte, isLoading, isError, error, refetch } = useActe(acteId);

  if (isLoading) return <SkeletonList />;
  if (isError || !acte) {
    const introuvable = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={introuvable ? 'Demande introuvable' : undefined}
        description={
          introuvable
            ? 'Cette demande n’existe pas ou ne relève pas de votre file.'
            : undefined
        }
        onRetry={introuvable ? undefined : () => refetch()}
      />
    );
  }

  const statut =
    LIBELLES_STATUT[acte.status as StatutActe] ?? acte.status_label;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{acte.reference}</p>
              <h2 className="font-serif text-lg font-semibold">
                {acte.document_type_free || acte.document_type_label}
              </h2>
            </div>
            <Badge variant="outline">{statut}</Badge>
          </div>
          <dl className="divide-y divide-border">
            <Ligne
              label="Demandeur"
              valeur={`${acte.requester_first_names} ${acte.requester_last_name}`.trim()}
            />
            <Ligne label="Téléphone" valeur={acte.contact_phone} />
            <Ligne label="E-mail" valeur={acte.contact_email} />
            <Ligne
              label="Motif"
              valeur={acte.reason_free || acte.reason_label}
            />
            <Ligne
              label="Inscrit au registre sous"
              valeur={`${acte.registered_first_names ?? ''} ${acte.registered_last_name ?? ''}`.trim()}
            />
            <Ligne label="Né(e) le" valeur={acte.date_of_birth} />
            <Ligne label="À" valeur={acte.place_of_birth} />
            <Ligne label="Père" valeur={acte.father_last_name} />
            <Ligne label="Mère" valeur={acte.mother_last_name} />
            <Ligne
              label="Date du sacrement"
              valeur={acte.sacrament_approximate_date}
            />
            <Ligne label="Lieu du sacrement" valeur={acte.sacrament_location} />
            <Ligne label="Précisions" valeur={acte.additional_info} />
            <Ligne label="Motif du rejet" valeur={acte.rejection_reason} />
          </dl>
          {acte.attachments.length > 0 && (
            <ul className="mt-3 space-y-1">
              {acte.attachments.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <Paperclip className="size-4" aria-hidden="true" />
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Actions acte={acte} />
        <Notes acteId={acte.id} />
      </div>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <Attribution acte={acte} />
          {acte.estimated_ready_on && (
            <p className="text-sm text-muted-foreground">
              Mise à disposition estimée : {acte.estimated_ready_on}
            </p>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Historique</h2>
          <ol className="space-y-2">
            {acte.history.map((h, i) => (
              <li key={i} className="text-sm">
                <p>
                  {LIBELLES_STATUT[h.to_status as StatutActe] ?? h.to_status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dateLongue(h.created_at)}
                  {h.changed_by_name ? ` · ${h.changed_by_name}` : ''}
                </p>
                {h.comment && (
                  <p className="text-xs text-muted-foreground">{h.comment}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
