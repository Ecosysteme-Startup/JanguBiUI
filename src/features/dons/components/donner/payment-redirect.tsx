'use client';

import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { fcfa } from '../../utils/format';

import {
  forgetCheckout,
  isSafeCheckoutUrl,
  readCheckout,
  type StoredCheckout,
} from './checkout-storage';
import type { DonationFormVariant } from './donation-form';

/** Délai laissé pour lire l'écran avant d'ouvrir la page de l'agrégateur. */
export const REDIRECT_DELAY_MS = 1500;

const STEPS = [
  'Vous choisissez Wave, Orange Money, Free Money ou la carte.',
  'Vous validez le paiement chez l’opérateur.',
  'Vous revenez automatiquement sur Jàngu Bi.',
];

const NBSP = ' ';

/** Barre indéterminée sobre ; immobile si l'utilisateur réduit les animations. */
const IndeterminateBar = () => {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduced || typeof el.animate !== 'function') return;
    const animation = el.animate([{ left: '-36%' }, { left: '100%' }], {
      duration: 1400,
      iterations: Infinity,
      easing: 'ease-in-out',
    });
    return () => animation.cancel();
  }, []);
  return (
    <div
      role="progressbar"
      aria-label="Ouverture de la page de paiement"
      aria-busy="true"
      className="relative h-1.5 overflow-hidden rounded-3 bg-surface-2"
    >
      <div
        ref={bar}
        className="absolute left-[32%] top-0 h-1.5 w-[36%] rounded-3 bg-primary-fill"
      />
    </div>
  );
};

const hrefs = (
  variant: DonationFormVariant,
  donationId: string,
  stored: StoredCheckout | null,
) =>
  variant === 'fidele'
    ? {
        cancel: paths.app.dons.root.getHref(stored?.fund_id),
        status: paths.app.dons.confirmation.getHref(donationId),
      }
    : {
        cancel: stored?.parish_code
          ? paths.dons.paroisse.getHref(stored.parish_code, stored.fund_id)
          : paths.paroisses.list.getHref(),
        status: paths.dons.retour.getHref(donationId),
      };

const Row = ({
  label,
  children,
  first,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) => (
  <div
    className={cn(
      'flex justify-between gap-4 py-2',
      !first && 'border-t border-line',
    )}
  >
    <dt className="text-ink-2">{label}</dt>
    <dd className="m-0 text-right font-semibold text-ink">{children}</dd>
  </div>
);

/**
 * Redirection vers la page de paiement (WEB-FID-Don-Redirection) : récapitulatif, trois étapes,
 * barre indéterminée, puis ouverture de la page de l'agrégateur. Partagé avec le parcours sans compte.
 */
export const PaymentRedirect = ({
  donationId,
  variant,
  delayMs = REDIRECT_DELAY_MS,
  onRedirect,
}: {
  donationId: string;
  variant: DonationFormVariant;
  delayMs?: number;
  /** Ouverture de la page de l'agrégateur (défaut : `window.location.assign`). */
  onRedirect?: (url: string) => void;
}) => {
  // `undefined` : pas encore lu (rendu serveur) ; `null` : rien pour ce don dans cet onglet.
  const [stored, setStored] = useState<StoredCheckout | null | undefined>(
    undefined,
  );
  const [cancelled, setCancelled] = useState(false);
  const redirect = useRef(onRedirect);
  redirect.current = onRedirect;

  useEffect(() => {
    setStored(readCheckout(donationId));
  }, [donationId]);

  const url =
    stored && isSafeCheckoutUrl(stored.checkout_url)
      ? stored.checkout_url
      : null;

  useEffect(() => {
    if (!url || cancelled) return;
    const timer = window.setTimeout(
      () =>
        (redirect.current ?? ((u: string) => window.location.assign(u)))(url),
      delayMs,
    );
    return () => window.clearTimeout(timer);
  }, [url, cancelled, delayMs]);

  const links = hrefs(variant, donationId, stored ?? null);
  const topbar = variant === 'fidele' && (
    <TopbarContent
      start={
        <Breadcrumbs
          items={[
            { label: 'Dons', href: paths.app.dons.historique.getHref() },
            { label: 'Faire un don', href: paths.app.dons.root.getHref() },
            { label: 'Paiement' },
          ]}
        />
      }
    />
  );

  if (stored === undefined) return <>{topbar}</>;

  if (!stored || !url) {
    return (
      <>
        {topbar}
        <section className="mx-auto w-full max-w-[560px] rounded-16 border border-line bg-paper shadow-card">
          <EmptyState
            icon="cadenas"
            title="La page de paiement n’est plus disponible dans cet onglet."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <NextLink
                  href={links.status}
                  className={buttonVariants({ variant: 'primary' })}
                >
                  Voir l’état du don
                </NextLink>
                <NextLink
                  href={links.cancel}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Faire un nouveau don
                </NextLink>
              </div>
            }
          >
            Si vous avez déjà payé, l’état de votre don s’affiche sur la page de
            suivi. Ne refaites pas le paiement.
          </EmptyState>
        </section>
      </>
    );
  }

  const feesCovered = stored.charged_amount > stored.amount;
  return (
    <>
      {topbar}
      <div className="flex justify-center">
        <section
          aria-labelledby="redir-titre"
          className="w-full max-w-[560px] rounded-16 border border-line bg-paper p-6 shadow-card sm:p-8"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-14 bg-tint-50 text-primary">
            <Icon name="cadenas" size={24} />
          </span>
          <h1
            id="redir-titre"
            className="m-0 mt-5 text-24 font-semibold text-ink"
          >
            Vous allez être redirigé vers la page de paiement sécurisée
          </h1>
          <p className="m-0 mt-2 text-15 text-ink-2">
            Le paiement se fait chez un prestataire agréé BCEAO.
          </p>

          <dl className="m-0 mt-6 rounded-12 border border-line bg-surface px-5 py-1.5 text-15 tabular-nums">
            <Row label="Fonds" first>
              {stored.fund_title}
            </Row>
            <Row label="Don">{fcfa(stored.amount)}</Row>
            <Row label="Frais estimés">
              {fcfa(stored.fee_amount)},{' '}
              {feesCovered ? 'ajoutés au paiement' : 'déduits du don'}
            </Row>
            <Row label="Référence du don">{stored.reference}</Row>
          </dl>

          <h2 className="m-0 mt-6 text-16 font-semibold text-ink">
            Comment cela se passe
          </h2>
          <ol className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-tint-50 text-13 font-semibold text-tint-800">
                  {i + 1}
                </span>
                <span className="text-15 leading-6 text-ink">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7">
            <IndeterminateBar />
            <p role="status" className="m-0 mt-2.5 text-14 text-ink-2">
              {cancelled
                ? 'Ouverture annulée.'
                : 'Ouverture de la page de paiement…'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <NextLink
              href={links.cancel}
              onClick={() => {
                setCancelled(true);
                forgetCheckout(donationId);
              }}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-h-11 px-[18px]',
              )}
            >
              Annuler
            </NextLink>
            <span className="text-14 text-ink-3">
              La page ne s’ouvre pas{NBSP}?{' '}
              <a href={url} className="font-semibold">
                Continuer
              </a>
            </span>
          </div>
        </section>
      </div>
      <p className="m-0 mx-auto mt-5 flex w-full max-w-[560px] items-start gap-2 text-13 text-ink-3">
        <Icon name="cadenas" size={14} className="mt-0.5 shrink-0" />
        <span>
          Jàngu Bi ne voit ni votre carte ni votre code{NBSP}: il reçoit
          seulement la confirmation.
        </span>
      </p>
    </>
  );
};
