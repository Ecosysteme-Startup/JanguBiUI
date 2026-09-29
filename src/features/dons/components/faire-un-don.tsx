'use client';

import { HeartHandshake } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatFcfa } from '@/features/dons-analyse/utils/format';
import { ApiError } from '@/lib/api-client';
import { useMesParoisses } from '@/lib/paroisses/api';
import { cn } from '@/utils/cn';

import {
  FUND_KIND_LABELS,
  type PageDon,
  type PublicFund,
  fraisEstimes,
  useCheckout,
  usePageDon,
} from '../api/dons';
import { ouvrirPaiement } from '../utils/paiement';

const nouvelleCle = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function Fonds({
  fonds,
  choisi,
  onChoisir,
}: {
  fonds: PublicFund[];
  choisi: string | null;
  onChoisir: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs font-medium text-muted-foreground">
        Pour
      </legend>
      {fonds.map((f) => {
        const actif = f.id === choisi;
        const part =
          f.goal_amount && f.goal_amount > 0
            ? Math.min(100, Math.round((f.raised / f.goal_amount) * 100))
            : null;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={actif}
            onClick={() => onChoisir(f.id)}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-colors',
              actif
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40',
            )}
          >
            <p className="text-sm font-medium text-foreground">{f.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {FUND_KIND_LABELS[f.kind] ?? f.kind}
              {f.place ? ` · ${f.place.name}` : ''}
            </p>
            {f.description && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {f.description}
              </p>
            )}
            {part !== null && f.goal_amount && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${part}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFcfa(f.raised)} réunis sur {formatFcfa(f.goal_amount)}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </fieldset>
  );
}

function FormulaireDon({ page }: { page: PageDon }) {
  const [fundId, setFundId] = useState<string | null>(
    page.funds.length === 1 ? page.funds[0].id : null,
  );
  const [montant, setMontant] = useState('');
  const [frais, setFrais] = useState(false);
  const [anonyme, setAnonyme] = useState(false);
  const checkout = useCheckout();

  const valeur = Number.parseInt(montant, 10) || 0;
  const horsBornes =
    valeur > 0 && (valeur < page.min_amount || valeur > page.max_amount);
  // Même intention de don = même clé (double clic, reprise réseau).
  const cle = useMemo(
    () => nouvelleCle(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fundId, valeur, frais, anonyme],
  );
  const estimation = fraisEstimes(valeur, page.fee_rate_bp);

  const valider = () => {
    if (!fundId || valeur <= 0 || horsBornes) return;
    checkout.mutate(
      {
        fund_id: fundId,
        amount: valeur,
        fees_covered: frais,
        anonymous: anonyme,
        idempotencyKey: cle,
      },
      { onSuccess: (res) => ouvrirPaiement(res.checkout_url) },
    );
  };

  const erreur =
    checkout.error instanceof ApiError
      ? checkout.error.status === 429
        ? 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.'
        : checkout.error.status === 503
          ? 'Le service de paiement est momentanément indisponible. Réessayez plus tard.'
          : checkout.error.message
      : checkout.error
        ? 'Le don n’a pas pu être préparé. Réessayez dans un instant.'
        : null;

  return (
    <div className="space-y-4">
      {page.funds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune quête ni campagne n’est ouverte en ce moment dans cette
          paroisse.
        </p>
      ) : (
        <Fonds fonds={page.funds} choisi={fundId} onChoisir={setFundId} />
      )}

      <div className="space-y-2">
        <label
          htmlFor="montant-don"
          className="block text-xs font-medium text-muted-foreground"
        >
          Montant (FCFA)
        </label>
        <div className="flex flex-wrap gap-2">
          {page.suggested_amounts.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={valeur === m}
              onClick={() => setMontant(String(m))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                valeur === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-primary/40',
              )}
            >
              {formatFcfa(m)}
            </button>
          ))}
        </div>
        <input
          id="montant-don"
          type="number"
          inputMode="numeric"
          min={page.min_amount}
          max={page.max_amount}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Autre montant"
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {horsBornes && (
          <p className="text-xs text-warning" role="alert">
            Le montant va de {formatFcfa(page.min_amount)} à{' '}
            {formatFcfa(page.max_amount)}.
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={frais}
          onChange={(e) => setFrais(e.target.checked)}
          className="mt-0.5 rounded"
        />
        <span>
          Je prends à ma charge les frais de paiement
          {valeur > 0 && estimation > 0
            ? ` (environ ${formatFcfa(estimation)})`
            : ''}
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={anonyme}
          onChange={(e) => setAnonyme(e.target.checked)}
          className="rounded"
        />
        Ne pas afficher mon nom à la paroisse
      </label>

      {erreur && (
        <p className="text-sm text-destructive" role="alert">
          {erreur}
        </p>
      )}

      <Button
        className="w-full"
        onClick={valider}
        disabled={!fundId || valeur <= 0 || horsBornes || checkout.isPending}
      >
        {checkout.isPending ? 'Préparation…' : 'Continuer vers le paiement'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Vous choisirez Wave, Orange Money, Free Money ou la carte sur la page de
        paiement sécurisée.
      </p>

      {page.authorization?.text && (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          {page.authorization.text}
        </p>
      )}
    </div>
  );
}

/**
 * Faire un don à l'une de mes paroisses : page de don publique de la paroisse
 * (`/v1/public/dons/paroisses/<id>/`), puis `POST /v1/dons/checkout/` et
 * redirection vers l'agrégateur.
 */
export function FaireUnDon() {
  const { data: mesParoisses, isLoading } = useMesParoisses();
  const [paroisseId, setParoisseId] = useState<string | null>(null);
  const choisie = paroisseId ?? mesParoisses?.[0]?.paroisse.id ?? null;
  const page = usePageDon(choisie);

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chargement…
      </p>
    );
  }

  if (!mesParoisses?.length) {
    return (
      <EmptyState
        icon={<HeartHandshake />}
        title="Choisissez d’abord votre paroisse"
        description="Les dons vont toujours à une paroisse. Ajoutez la vôtre depuis votre profil."
      />
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground">Faire un don</h2>

      {mesParoisses.length > 1 && (
        <div>
          <label
            htmlFor="paroisse-don"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Paroisse
          </label>
          <select
            id="paroisse-don"
            value={choisie ?? ''}
            onChange={(e) => setParoisseId(e.target.value)}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mesParoisses.map((m) => (
              <option key={m.paroisse.id} value={m.paroisse.id}>
                {m.paroisse.name}
                {m.principale ? ' (principale)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {page.isLoading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
      {(page.isError || (page.data && !page.data.enabled)) && (
        <p className="text-sm text-muted-foreground">
          Le don en ligne n’est pas encore ouvert pour cette paroisse.
        </p>
      )}
      {page.data?.enabled && (
        <FormulaireDon key={page.data.parish.id} page={page.data} />
      )}
    </div>
  );
}
