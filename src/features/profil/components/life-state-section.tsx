'use client';

import { useState } from 'react';

import { StatusDot } from '@/components/signature/status-dot';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { dayjs } from '@/utils/dates';

import { type Declaration, useDeclaration } from '../api/get-declaration';
import { DEGRE_LABELS, ETAT_LABELS, statusOf } from '../utils/life-state-labels';

import { DeclarationForm } from './declaration-form';

export const LIFE_STATE_ANCHOR = 'etat-de-vie';

const Summary = ({ declaration: d }: { declaration: Declaration }) => {
  const status = statusOf(d);
  const lines = [
    d.etat_de_vie === 'clerc' ? DEGRE_LABELS[d.degre_ordre] : null,
    d.incardination_node ? `Incardination : ${d.incardination_node.name}` : null,
    d.institut_node ? `Institut : ${d.institut_node.name}` : null,
  ].filter(Boolean);
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="m-0 font-serif text-h3 text-ink">{ETAT_LABELS[d.etat_de_vie].court}</p>
      {lines.length > 0 && <p className="m-0 text-sm text-ink-2">{lines.join(' · ')}</p>}
      <StatusDot tone={status.tone} label={status.label} />
      <p className="m-0 text-sm text-ink-2">
        {status.detail}
        {d.declared_at && d.etat_de_vie !== 'laic' && <> Dernière déclaration le {dayjs(d.declared_at).format('D MMMM YYYY')}.</>}
      </p>
    </div>
  );
};

const Attachments = ({ declaration: d }: { declaration: Declaration }) =>
  d.attachments.length === 0 ? null : (
    <div className="mt-4">
      <p className="m-0 text-sm font-semibold text-ink">Justificatifs joints</p>
      <ul aria-label="Justificatifs joints" className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {d.attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded border border-line bg-surface px-4 py-2">
            <Icon name="document" size={20} className="shrink-0 text-ink-3" />
            {a.url ? (
              <a href={a.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-primary underline">
                {a.file_name}
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.file_name}</span>
            )}
            <span className="tnum text-meta text-ink-3">{dayjs(a.created_at).format('D MMM YYYY')}</span>
          </li>
        ))}
      </ul>
    </div>
  );

const ReviewNotice = ({ declaration: d }: { declaration: Declaration }) => {
  if (d.etat_de_vie === 'laic' || !['complement', 'rejete'].includes(d.statut_verification)) return null;
  const complement = d.statut_verification === 'complement';
  return (
    <Notice
      tone={complement ? 'warn' : 'err'}
      title={complement ? 'La chancellerie demande un complément' : 'Motif du refus'}
      className="mt-4"
    >
      {d.verification_note || (complement ? 'Joignez le justificatif demandé.' : 'Aucun motif n’a été indiqué.')}
      {complement && ' Complétez votre déclaration ci-dessous : elle repassera en attente de vérification.'}
    </Notice>
  );
};

const actionLabel = (d: Declaration) => {
  if (d.statut_verification === 'complement' && d.etat_de_vie !== 'laic') return 'Compléter ma déclaration';
  return d.etat_de_vie === 'laic' ? 'Déclarer un autre état de vie' : 'Modifier ma déclaration';
};

/** 06 — Mon état de vie : statut, justificatifs, déclaration ou complément (EF-PER-01). */
export const LifeStateSection = () => {
  const { data, isPending, isError } = useDeclaration();
  const [editing, setEditing] = useState(false);
  const needsComplement = data?.statut_verification === 'complement' && data.etat_de_vie !== 'laic';
  const open = editing || needsComplement;

  return (
    <section id={LIFE_STATE_ANCHOR} aria-labelledby="pf-etat" className="scroll-mt-24">
      <h2 id="pf-etat" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
        <span className="text-primary">06</span> — Mon état de vie
      </h2>
      <p className="m-0 mt-4 max-w-reading text-sm text-ink-2">
        Clerc ou consacré(e), déclarez-le ici avec vos justificatifs. Votre déclaration n’ouvre aucun droit tant qu’elle n’est pas vérifiée
        par la chancellerie de votre diocèse d’incardination ou par votre institut.
      </p>
      {isPending ? (
        <LoadingBlock label="Chargement de votre déclaration…" lines={3} />
      ) : isError ? (
        <p className="m-0 mt-4 text-sm text-ink-2">Votre déclaration n’a pas pu être chargée.</p>
      ) : (
        <>
          <Summary declaration={data} />
          <ReviewNotice declaration={data} />
          <Attachments declaration={data} />
          {data.statut_verification === 'verifie' && data.etat_de_vie !== 'laic' && open && (
            <Notice tone="info" title="Modifier une déclaration vérifiée" className="mt-4">
              Après envoi, elle repassera en attente de vérification.
            </Notice>
          )}
          {open ? (
            <DeclarationForm declaration={data} onDone={() => setEditing(false)} onCancel={needsComplement ? undefined : () => setEditing(false)} />
          ) : (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing(true)}>
              {actionLabel(data)}
            </Button>
          )}
        </>
      )}
    </section>
  );
};
