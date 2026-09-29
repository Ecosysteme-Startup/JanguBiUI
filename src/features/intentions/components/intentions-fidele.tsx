'use client';

import { HandHeart, Info } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useMesParoisses } from '@/lib/paroisses/api';

import {
  LIBELLES_TYPE_INTENTION,
  type MassIntention,
  PHRASE_OFFRANDE,
  TYPES_INTENTION,
  type TypeIntention,
  useAnnulerIntention,
  useDemanderIntention,
  useMesIntentions,
} from '../api/intentions';
import { aujourdhuiIso, ligneSuivi, PAS_DE_DATE } from '../utils/format';

import { IntentionStatusBadge } from './intention-status-badge';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
const MAX_TEXTE = 300;

const messageErreur = (e: unknown) =>
  e instanceof ApiError ? e.message : 'L’envoi n’a pas abouti. Réessayez.';

/** La phrase sur l'offrande : aucun montant, aucun paiement dans l'application. */
export function NoteOffrande() {
  return (
    <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{PHRASE_OFFRANDE}</span>
    </p>
  );
}

function FormulaireIntention({
  preremplie,
  onEnvoyee,
}: {
  preremplie: MassIntention | null;
  onEnvoyee: () => void;
}) {
  const id = useId();
  const { data: paroisses = [] } = useMesParoisses();
  const [paroisse, setParoisse] = useState(preremplie?.parish.id ?? '');
  const [date, setDate] = useState('');
  const [sansDate, setSansDate] = useState(false);
  const [messe, setMesse] = useState('');
  const [type, setType] = useState<TypeIntention>(
    (preremplie?.kind as TypeIntention) ?? 'defunt',
  );
  const [texte, setTexte] = useState(preremplie?.intention ?? '');
  const [anonyme, setAnonyme] = useState(preremplie?.is_anonymous ?? false);
  const demander = useDemanderIntention();
  const paroisseId = paroisse || paroisses[0]?.paroisse.id || '';

  return (
    <form
      className="space-y-4"
      aria-label="Nouvelle demande"
      onSubmit={(e) => {
        e.preventDefault();
        if (!paroisseId || (!sansDate && !date) || !texte.trim()) return;
        demander.mutate(
          {
            node: paroisseId,
            kind: type,
            intention: texte.trim(),
            is_anonymous: anonyme,
            requested_date: sansDate ? null : date,
            requested_mass: messe.trim(),
          },
          {
            onSuccess: () => {
              setTexte('');
              setDate('');
              setSansDate(false);
              setMesse('');
              setAnonyme(false);
              onEnvoyee();
            },
          },
        );
      }}
    >
      <div className="space-y-1">
        <label htmlFor={`${id}-paroisse`} className="text-sm font-medium">
          Paroisse
        </label>
        <select
          id={`${id}-paroisse`}
          className={champ}
          value={paroisseId}
          onChange={(e) => setParoisse(e.target.value)}
          disabled={paroisses.length === 0}
        >
          {paroisses.length === 0 && (
            <option value="">
              Choisissez d’abord votre paroisse dans le profil
            </option>
          )}
          {paroisses.map((p) => (
            <option key={p.paroisse.id} value={p.paroisse.id}>
              {p.paroisse.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-date`} className="text-sm font-medium">
            Messe souhaitée le
          </label>
          <input
            id={`${id}-date`}
            type="date"
            required={!sansDate}
            disabled={sansDate}
            min={aujourdhuiIso()}
            className={champ}
            value={sansDate ? '' : date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={sansDate}
              onChange={(e) => setSansDate(e.target.checked)}
            />
            {PAS_DE_DATE}
          </label>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-messe`} className="text-sm font-medium">
            Messe (facultatif)
          </label>
          <input
            id={`${id}-messe`}
            placeholder="Messe de 11:30"
            maxLength={120}
            className={champ}
            value={messe}
            onChange={(e) => setMesse(e.target.value)}
          />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Intention</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES_INTENTION.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
            >
              <input
                type="radio"
                name={`${id}-type`}
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              {LIBELLES_TYPE_INTENTION[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1">
        <label htmlFor={`${id}-texte`} className="text-sm font-medium">
          Texte de l’intention
        </label>
        <textarea
          id={`${id}-texte`}
          rows={3}
          required
          maxLength={MAX_TEXTE}
          className={champ}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
        <p className="flex justify-between text-xs text-muted-foreground">
          <span>Elle sera lue telle que vous l’écrivez.</span>
          <span>
            {texte.length} / {MAX_TEXTE}
          </span>
        </p>
      </div>
      <div className="flex items-start gap-3 text-sm">
        <input
          id={`${id}-anonyme`}
          type="checkbox"
          className="mt-1"
          aria-describedby={`${id}-anonyme-aide`}
          checked={anonyme}
          onChange={(e) => setAnonyme(e.target.checked)}
        />
        <div>
          <label htmlFor={`${id}-anonyme`} className="block font-medium">
            Demande anonyme
          </label>
          <p
            id={`${id}-anonyme-aide`}
            className="text-xs text-muted-foreground"
          >
            Votre nom n’est pas lu à la messe. Seul le secrétariat le voit, pour
            vous répondre.
          </p>
        </div>
      </div>
      <NoteOffrande />
      {demander.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageErreur(demander.error)}
        </p>
      )}
      <div className="space-y-1">
        <Button
          type="submit"
          fullWidth
          isLoading={demander.isPending}
          disabled={!paroisseId}
        >
          Envoyer la demande
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Le secrétariat de la paroisse vous répond dans l’application.
        </p>
      </div>
    </form>
  );
}

function CarteIntention({
  intention,
  onAutreMesse,
}: {
  intention: MassIntention;
  onAutreMesse: (i: MassIntention) => void;
}) {
  const annuler = useAnnulerIntention();
  const ouverte =
    intention.status === 'recue' || intention.status === 'planifiee';
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {intention.parish.name}
        </span>
        <IntentionStatusBadge status={intention.status} />
      </div>
      <p className="text-sm font-medium text-foreground">
        {intention.intention}
      </p>
      <p className="text-xs text-muted-foreground">{ligneSuivi(intention)}</p>
      {intention.status === 'refusee' && intention.refusal_reason && (
        <p className="text-xs text-foreground">
          <span className="font-medium">Motif : </span>
          {intention.refusal_reason}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {intention.status === 'refusee' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAutreMesse(intention)}
          >
            Choisir une autre messe
          </Button>
        )}
        {ouverte && (
          <Button
            size="sm"
            variant="ghost"
            isLoading={annuler.isPending}
            onClick={() => annuler.mutate(intention.id)}
          >
            Annuler la demande
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Demander une messe et suivre ses intentions (WEB-FID-Intention-Messe). */
export function IntentionsFidele() {
  const { data, isLoading, isError, refetch } = useMesIntentions();
  const [preremplie, setPreremplie] = useState<MassIntention | null>(null);
  const [cle, setCle] = useState(0);
  const [envoyee, setEnvoyee] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section
        ref={formRef}
        aria-labelledby="nouvelle-demande"
        className="space-y-3"
      >
        <Card className="space-y-4 p-5">
          <div>
            <h2
              id="nouvelle-demande"
              className="font-serif text-lg font-semibold"
            >
              Nouvelle demande
            </h2>
            <p className="text-sm text-muted-foreground">
              Une intention confiée à la prière de la communauté, lue pendant la
              messe.
            </p>
          </div>
          {envoyee && (
            <p
              role="status"
              className="rounded-md bg-success/10 p-3 text-sm text-success"
            >
              Votre demande a bien été transmise à la paroisse.
            </p>
          )}
          <FormulaireIntention
            key={cle}
            preremplie={preremplie}
            onEnvoyee={() => {
              setEnvoyee(true);
              setPreremplie(null);
            }}
          />
        </Card>
      </section>
      <section aria-labelledby="mes-intentions" className="space-y-3">
        <h2 id="mes-intentions" className="font-serif text-lg font-semibold">
          Mes intentions
        </h2>
        {isLoading && <SkeletonList count={3} />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && data.results.length === 0 && (
          <EmptyState
            icon={<HandHeart aria-hidden="true" />}
            title="Aucune intention pour le moment"
            description="Vos demandes et leur suivi apparaîtront ici."
          />
        )}
        {data?.results.map((i) => (
          <CarteIntention
            key={i.id}
            intention={i}
            onAutreMesse={(x) => {
              setPreremplie(x);
              setEnvoyee(false);
              setCle((k) => k + 1);
              formRef.current?.scrollIntoView?.({ behavior: 'smooth' });
            }}
          />
        ))}
      </section>
    </div>
  );
}
