'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { hour, longDate } from '@/utils/dates';
import { ofParish, parishLabel } from '@/utils/parish-name';

import { useDownloadReceipt } from '../../api/download-receipt';
import {
  donationStatusQueryOptions,
  isWaiting,
} from '../../api/get-donation-status';
import type { DonationState } from '../../types/schemas';
import { fcfa } from '../../utils/format';

import { readCheckout, type StoredCheckout } from './checkout-storage';
import type { DonationFormVariant } from './donation-form';

const NBSP = ' ';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Phase = 'confirme' | 'attente' | 'annule' | 'echoue' | 'rembourse';

const phaseOf = (state: DonationState, cancelled: boolean): Phase => {
  // Le serveur fait foi : un don confirmé l'est, même si le retour de l'agrégateur dit « annulé ».
  if (state.status === 'confirme') return 'confirme';
  if (state.status === 'rembourse') return 'rembourse';
  if (cancelled) return 'annule';
  if (isWaiting(state)) return 'attente';
  return 'echoue';
};

const CRUMB: Record<Phase, string> = {
  confirme: 'Don confirmé',
  attente: 'Paiement en attente',
  annule: 'Paiement annulé',
  echoue: 'Paiement non abouti',
  rembourse: 'Don remboursé',
};

const Topbar = ({ label }: { label: string }) => (
  <TopbarContent
    start={
      <Breadcrumbs
        items={[
          { label: 'Dons', href: paths.app.dons.historique.getHref() },
          { label },
        ]}
      />
    }
    end={
      <NextLink
        href={paths.app.dons.historique.getHref()}
        className="inline-flex h-10 items-center rounded-12 px-3 text-15 font-semibold no-underline hover:bg-surface-2"
      >
        Mes dons
      </NextLink>
    }
  />
);

const Item = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) => (
  <div className="border-t border-line py-3.5">
    <dt className="text-13 text-ink-3">{label}</dt>
    <dd className="m-0 mt-0.5 text-16 font-semibold tabular-nums text-ink">
      {value}
    </dd>
    {sub && <dd className="m-0 text-14 text-ink-2">{sub}</dd>}
  </div>
);

const Card = ({
  children,
  labelledBy,
}: {
  children: React.ReactNode;
  labelledBy: string;
}) => (
  <section
    aria-labelledby={labelledBy}
    className="rounded-16 border border-line bg-paper p-6 shadow-card sm:p-8"
  >
    {children}
  </section>
);

const Badge = ({
  icon,
  tone,
}: {
  icon: IconName;
  tone: 'ok' | 'err' | 'neutral';
}) => (
  <span
    className={cn(
      'inline-flex size-14 items-center justify-center rounded-full',
      tone === 'ok'
        ? 'bg-ok-bg text-ok'
        : tone === 'err'
          ? 'bg-err-bg text-err'
          : 'bg-surface-2 text-ink-2',
    )}
  >
    <Icon name={icon} size={30} />
  </span>
);

/** Montant affecté : connu si les frais sont couverts, sinon par la réponse du checkout (même onglet). */
const allocatedLine = (state: DonationState, stored: StoredCheckout | null) => {
  if (state.fees_covered)
    return `${fcfa(state.charged_amount)} payés, frais compris`;
  if (stored && stored.amount === state.amount)
    return `dont ${fcfa(stored.net_amount)} affectés au fonds`;
  return undefined;
};

const Confirmed = ({
  state,
  stored,
  signedIn,
  homeHref,
}: {
  state: DonationState;
  stored: StoredCheckout | null;
  signedIn: boolean;
  homeHref: string;
}) => {
  const receipt = useDownloadReceipt();
  return (
    <Card labelledBy="don-titre">
      <Badge icon="succes" tone="ok" />
      <h1 id="don-titre" className="m-0 mt-5 text-28 font-semibold text-ink">
        Merci, votre don est confirmé.
      </h1>
      <p className="m-0 mt-2 text-16 text-ink-2">
        Votre don a bien été reçu par la {lowerFirst(parishLabel(state.parish))}
        .
        {signedIn ? ' Un reçu est disponible ci-dessous et dans Mes dons.' : ''}
      </p>
      <dl className="m-0 mt-6 grid gap-x-8 sm:grid-cols-2">
        <Item label="Référence du don" value={state.reference} />
        <Item label="Numéro de reçu" value={state.receipt_number ?? '—'} />
        <Item
          label="Fonds"
          value={state.fund.title}
          sub={parishLabel(state.parish)}
        />
        <Item
          label="Montant"
          value={fcfa(state.amount)}
          sub={allocatedLine(state, stored)}
        />
        {state.confirmed_at && (
          <Item
            label="Date"
            value={longDate(state.confirmed_at)}
            sub={`à ${hour(state.confirmed_at).replace(/ /g, NBSP)}`}
          />
        )}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {signedIn && state.receipt_number && (
          <Button
            variant="secondary"
            size="lg"
            loading={receipt.isPending}
            onClick={() =>
              receipt.mutate(
                { donationId: state.id, receiptNumber: state.receipt_number },
                {
                  onError: (e) =>
                    toast.err(
                      e instanceof Error
                        ? e.message
                        : 'Le reçu n’a pas pu être téléchargé.',
                    ),
                },
              )
            }
          >
            {!receipt.isPending && <Icon name="import" size={18} />}
            Télécharger le reçu
          </Button>
        )}
        <NextLink href={homeHref} className={buttonVariants({ size: 'lg' })}>
          Retour à l’accueil
        </NextLink>
      </div>
      <p className="m-0 mt-3.5 flex items-start gap-2 text-13 text-ink-3">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        <span>Reçu simple{NBSP}: ce n’est pas un reçu fiscal.</span>
      </p>
    </Card>
  );
};

/** En attente : ne pas refaire le paiement, la page se met à jour d'elle-même. */
const Pending = ({
  state,
  signedIn,
}: {
  state: DonationState;
  signedIn: boolean;
}) => (
  <div
    role="status"
    className="flex gap-3 rounded-12 bg-warn-bg px-[18px] py-4 text-14 text-warn"
  >
    <Icon name="horloge" size={20} className="mt-px shrink-0" />
    <div className="flex flex-col gap-1">
      <h1 className="m-0 text-15 font-semibold">
        Paiement en attente de confirmation
      </h1>
      <p className="m-0">
        L’opérateur n’a pas encore confirmé votre paiement de{' '}
        {fcfa(state.charged_amount)}. Ne refaites pas le paiement{NBSP}: cette
        page se met à jour d’elle-même dès la confirmation. Le délai habituel
        est de quelques minutes.
      </p>
      {signedIn && (
        <NextLink
          href={paths.app.dons.historique.getHref()}
          className="mt-1 self-start font-semibold text-warn underline underline-offset-2 hover:text-warn"
        >
          Voir mes dons
        </NextLink>
      )}
    </div>
  </div>
);

const NotCompleted = ({
  phase,
  state,
  retryHref,
  signedIn,
}: {
  phase: 'annule' | 'echoue' | 'rembourse';
  state: DonationState;
  retryHref: string;
  signedIn: boolean;
}) => {
  const copy = {
    annule: {
      title: `Paiement annulé${NBSP}: rien n’a été débité.`,
      text: 'Vous pouvez reprendre votre don quand vous le souhaitez.',
    },
    echoue: {
      title:
        state.status === 'expire'
          ? 'La page de paiement a expiré.'
          : 'Le paiement n’a pas abouti.',
      text: `Ce don n’a pas été confirmé par l’opérateur. Vous pouvez recommencer quand vous le souhaitez.`,
    },
    rembourse: {
      title: 'Ce don a été remboursé.',
      text: `Le montant de ${fcfa(state.charged_amount)} vous a été rendu par l’opérateur.`,
    },
  }[phase];
  return (
    <Card labelledBy="don-titre">
      <Badge
        icon={phase === 'echoue' ? 'erreur' : 'info'}
        tone={phase === 'echoue' ? 'err' : 'neutral'}
      />
      <h1 id="don-titre" className="m-0 mt-5 text-28 font-semibold text-ink">
        {copy.title}
      </h1>
      <p className="m-0 mt-2 text-16 text-ink-2">
        {state.fund.title}, {ofParish(parishLabel(state.parish))} · référence{' '}
        <span className="tabular-nums">{state.reference}</span>. {copy.text}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {phase !== 'rembourse' && (
          <NextLink href={retryHref} className={buttonVariants({ size: 'lg' })}>
            Réessayer
          </NextLink>
        )}
        {signedIn && (
          <NextLink
            href={paths.app.dons.historique.getHref()}
            className={buttonVariants({ variant: 'secondary', size: 'lg' })}
          >
            Voir mes dons
          </NextLink>
        )}
      </div>
    </Card>
  );
};

/**
 * Retour de paiement (WEB-FID-Don-Confirmation) : l'état vient **uniquement** du serveur et se
 * rafraîchit seul tant que l'opérateur n'a pas confirmé. `cancelled` : l'agrégateur signale une
 * annulation (`?annule=1`) ; le statut est tout de même lu une fois, sans rafraîchissement.
 */
export const DonationConfirmation = ({
  donationId,
  variant,
  signedIn,
  cancelled = false,
}: {
  donationId: string;
  variant: DonationFormVariant;
  signedIn: boolean;
  cancelled?: boolean;
}) => {
  const base = donationStatusQueryOptions(donationId);
  const status = useQuery(
    cancelled
      ? {
          ...base,
          queryKey: [...base.queryKey, 'annule'],
          refetchInterval: false,
        }
      : base,
  );
  const [stored, setStored] = useState<StoredCheckout | null>(null);
  useEffect(() => {
    setStored(readCheckout(donationId));
  }, [donationId]);

  const fidele = variant === 'fidele';
  const phase = status.data ? phaseOf(status.data, cancelled) : null;
  const topbar = fidele && (
    <Topbar label={phase ? CRUMB[phase] : 'Suivi du don'} />
  );

  let body: React.ReactNode;
  if (status.isPending)
    body = <LoadingBlock label="Vérification du paiement…" lines={5} />;
  else if (status.isError || !status.data || !phase) {
    body = (
      <EmptyState
        tone="err"
        icon="alerte"
        title="L’état du don n’a pas pu être chargé."
        action={
          <Button variant="secondary" onClick={() => status.refetch()}>
            Réessayer
          </Button>
        }
      >
        Ne refaites pas le paiement : réessayez dans un instant.
      </EmptyState>
    );
  } else {
    const state = status.data;
    const retryHref = fidele
      ? paths.app.dons.root.getHref(state.fund.id)
      : stored?.parish_code
        ? paths.dons.paroisse.getHref(stored.parish_code, state.fund.id)
        : paths.paroisses.list.getHref();
    body =
      phase === 'confirme' ? (
        <Confirmed
          state={state}
          stored={stored}
          signedIn={signedIn}
          homeHref={fidele ? paths.app.root.getHref() : paths.home.getHref()}
        />
      ) : phase === 'attente' ? (
        <Pending state={state} signedIn={signedIn} />
      ) : (
        <NotCompleted
          phase={phase}
          state={state}
          retryHref={retryHref}
          signedIn={signedIn}
        />
      );
  }

  return (
    <>
      {topbar}
      <div className="mx-auto w-full max-w-[640px]">{body}</div>
    </>
  );
};
