'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { parishLabel } from '@/utils/parish-name';

import { usePublicFund } from '../../api/get-public-fund';
import { usePublicParish } from '../../api/get-public-parish';
import type { FundNews, PublicFundDetail } from '../../types/schemas';
import { fcfa, fundKindLabel, progressPercent } from '../../utils/format';
import { AuthorizationNote } from '../shared/authorization-note';
import { FundProgress } from '../shared/fund-progress';

import { FrenchDate } from './french-date';
import { parseFundUsage } from './fund-usage';

const NBSP = '\u00a0';

/** Initiales sans le titre (« Abbé Augustin Ndiaye » → AN). */
const withoutTitle = (name: string) =>
  name.replace(
    /^(abbé|père|mgr|monseigneur|mme|m\.|sœur|frère|diacre)\s+/i,
    '',
  );

/** Emplacement photo (rayon 16, 280 px) : la photo du projet, sinon le dessin au trait de la chapelle. */
const CampaignPhoto = ({ fund }: { fund: PublicFundDetail }) =>
  fund.image_url ? (
    // URL du stockage (MinIO/S3) : pas d'optimisation next/image.
    <img
      src={fund.image_url}
      alt={fund.title}
      className="block h-60 w-full rounded-16 object-cover sm:h-[280px]"
    />
  ) : (
    <div
      data-photo-slot={`campagne-${fund.id}`}
      className="h-60 overflow-hidden rounded-16 bg-tint-50 sm:h-[280px]"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 340 150"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path d="M0 184v-30h340v30z" fill="var(--jb-tint-100)" />
        <path d="M110 184v-96l60-50 60 50v96z" fill="var(--jb-tint-100)" />
        <path d="M150 184v-52a20 20 0 0 1 40 0v52" fill="var(--jb-tint-50)" />
        <path
          d="M170 8v24M160 18h20"
          stroke="var(--jb-tint-300)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

/** « du 1er juin au 31 décembre 2026 ». */
const Period = ({
  startsOn,
  endsOn,
}: {
  startsOn?: string | null;
  endsOn?: string | null;
}) => {
  if (startsOn && endsOn) {
    const sameYear = dayjs(startsOn).year() === dayjs(endsOn).year();
    return (
      <>
        du{' '}
        <FrenchDate
          value={startsOn}
          format={sameYear ? 'D MMMM' : 'D MMMM YYYY'}
        />{' '}
        au <FrenchDate value={endsOn} />
      </>
    );
  }
  if (endsOn)
    return (
      <>
        jusqu’au <FrenchDate value={endsOn} />
      </>
    );
  if (startsOn)
    return (
      <>
        depuis le <FrenchDate value={startsOn} />
      </>
    );
  return null;
};

const ProgressCard = ({ fund }: { fund: PublicFundDetail }) => {
  const goal = fund.goal_amount ?? null;
  return (
    <div className="tnum mt-6 rounded-16 border border-line bg-surface px-6 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="m-0 text-16 text-ink-2">
          <span className="text-20 font-semibold text-ink">
            {fcfa(fund.raised)}
          </span>{' '}
          {goal ? `réunis sur ${fcfa(goal)}` : 'réunis'}
        </p>
        {goal ? (
          <span className="text-16 font-semibold text-tint-800">
            {progressPercent(fund.raised, goal)}
            {NBSP}%
          </span>
        ) : null}
      </div>
      {goal ? (
        <FundProgress raised={fund.raised} goal={goal} className="mt-3" />
      ) : null}
    </div>
  );
};

const FundUsageSection = ({
  description,
}: {
  description: string | undefined;
}) => {
  const usage = parseFundUsage(description);
  if (usage.prose.length === 0 && usage.budget.length === 0) return null;
  const hasBudget = usage.budget.length > 0;
  return (
    <>
      {hasBudget && usage.prose.length > 0 && (
        <section aria-labelledby="projet-titre" className="mt-10">
          <h2 id="projet-titre" className="m-0 text-20 font-semibold text-ink">
            Le projet
          </h2>
          {usage.prose.map((p) => (
            <p key={p} className="m-0 mt-2 text-16 leading-[26px] text-ink">
              {p}
            </p>
          ))}
        </section>
      )}
      <section aria-labelledby="usage-titre" className="mt-10">
        <h2 id="usage-titre" className="m-0 text-20 font-semibold text-ink">
          Usage des fonds
        </h2>
        {hasBudget ? (
          <ul className="tnum m-0 mt-4 list-none rounded-16 border border-line bg-paper p-0 text-ink shadow-card">
            {usage.budget.map((line, i) => (
              <li
                key={`${line.label}-${i}`}
                className={cn(
                  'flex items-center gap-4 px-5 py-3.5',
                  i > 0 && 'border-t border-line',
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-15 font-semibold leading-[22px]">
                    {line.label}
                  </span>
                  {line.detail && (
                    <span className="text-14 text-ink-2">{line.detail}</span>
                  )}
                </span>
                <span className="whitespace-nowrap text-15 font-semibold">
                  {fcfa(line.amount)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 rounded-b-16 border-t border-line bg-surface px-5 py-3.5 text-15 font-semibold">
              <span>Total</span>
              <span>{fcfa(usage.total ?? 0)}</span>
            </li>
          </ul>
        ) : (
          usage.prose.map((p) => (
            <p key={p} className="m-0 mt-2 text-16 leading-[26px] text-ink">
              {p}
            </p>
          ))
        )}
      </section>
    </>
  );
};

const NewsItem = ({ news }: { news: FundNews }) => (
  <article className="flex gap-3.5 rounded-16 border border-line bg-paper p-5 text-ink shadow-card">
    <Avatar
      name={withoutTitle(news.author_name)}
      size={40}
      className="text-14"
    />
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="m-0 flex flex-wrap items-baseline gap-x-2">
        <span className="text-15 font-semibold">{news.author_name}</span>
        {news.created_at && (
          <time dateTime={news.created_at} className="text-13 text-ink-3">
            <FrenchDate value={news.created_at} format="dddd D MMMM YYYY" />
          </time>
        )}
      </p>
      <p className="m-0 mt-1.5 whitespace-pre-line text-15 leading-6">
        {news.body}
      </p>
    </div>
  </article>
);

const NewsSection = ({ updates }: { updates: FundNews[] }) => {
  const sorted = [...updates].sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  );
  return (
    <section aria-labelledby="nouvelles-titre" className="mt-10">
      <h2 id="nouvelles-titre" className="m-0 text-20 font-semibold text-ink">
        Nouvelles de la campagne
      </h2>
      {sorted.length === 0 ? (
        <p className="m-0 mt-2 text-15 text-ink-3">
          Aucune nouvelle publiée pour le moment.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {sorted.map((n) => (
            <NewsItem key={n.id} news={n} />
          ))}
        </div>
      )}
    </section>
  );
};

/** Colonne droite : « Soutenir ce projet » (bouton, mention d'autorisation) ; collecte close sinon. */
const SupportCard = ({ fund }: { fund: PublicFundDetail }) => {
  const parish = usePublicParish(fund.parish.id);
  const goalReached = Boolean(
    fund.goal_amount && fund.raised >= fund.goal_amount,
  );
  const closed = fund.status === 'clos' || goalReached;
  const notOpen = parish.data?.enabled === false;
  return (
    <section
      aria-labelledby="soutenir-projet"
      className="rounded-16 border border-line bg-paper p-6 text-ink shadow-card"
    >
      <h2
        id="soutenir-projet"
        className="m-0 text-18 font-semibold leading-[26px]"
      >
        Soutenir ce projet
      </h2>
      <p className="m-0 mt-1 text-14 text-ink-2">
        Les dons sont affectés à ce seul projet. La collecte se ferme dès que
        l’objectif est atteint.
      </p>
      {closed ? (
        <Notice
          tone="info"
          role="status"
          className="mt-5"
          title={
            goalReached
              ? 'Objectif atteint : la collecte est close.'
              : 'Cette collecte est close.'
          }
        >
          Les dons ne sont plus reçus pour ce projet.
        </Notice>
      ) : notOpen ? (
        <Notice
          tone="info"
          role="status"
          className="mt-5"
          title="La collecte en ligne n’est pas ouverte pour cette paroisse."
        />
      ) : (
        <NextLink
          href={paths.app.dons.root.getHref(fund.id)}
          className={cn(
            buttonVariants({ size: 'xl', block: true }),
            'mt-5 hover:no-underline',
          )}
        >
          Donner à cette campagne
        </NextLink>
      )}
      <AuthorizationNote
        authorization={parish.data?.authorization}
        compact
        className="m-0 mt-4 gap-2"
      />
    </section>
  );
};

const BriefItem = ({ icon, term, children, first = false }: { icon: IconName; term: string; children: ReactNode; first?: boolean }) => (
  <div className={cn('relative py-2.5 pl-[30px]', !first && 'border-t border-line')}>
    <dt className="text-13 text-ink-3">
      <Icon name={icon} size={18} className="absolute left-0 top-2.5 text-ink-3" />
      {term}
    </dt>
    <dd className="m-0 font-medium">{children}</dd>
  </div>
);

const InBrief = ({ fund }: { fund: PublicFundDetail }) => (
  <section
    aria-labelledby="en-bref"
    className="rounded-16 border border-line bg-surface px-6 py-5 text-ink"
  >
    <h2 id="en-bref" className="m-0 text-16 font-semibold">
      En bref
    </h2>
    <dl className="m-0 mt-2 text-14 [&>div:last-child]:pb-0">
      <BriefItem icon="paroisse" term="Paroisse" first>
        {[fund.parish.name, fund.parish.city].filter(Boolean).join(', ')}
      </BriefItem>
      {fund.ends_on && (
        <BriefItem icon="calendrier" term="Collecte">
          {fund.status === 'clos' ? (
            'Close'
          ) : (
            <>
              Jusqu’au <FrenchDate value={fund.ends_on} />
            </>
          )}
        </BriefItem>
      )}
      {fund.destination === 'curie' && (
        <BriefItem icon="diocese" term="Destination">
          Reversée au diocèse
        </BriefItem>
      )}
    </dl>
  </section>
);

/** WEB-FID-Campagne : photo, titre, avancement, usage des fonds, nouvelles ; colonne « Soutenir ce projet ». */
export const CampaignPage = ({ fundId }: { fundId: string }) => {
  const {
    data: fund,
    isPending,
    isError,
    error,
    refetch,
  } = usePublicFund(fundId);

  const crumbs = (
    <TopbarContent
      start={
        <Breadcrumbs
          items={[
            { label: 'Dons', href: paths.app.dons.historique.getHref() },
            { label: fund?.title ?? 'Campagne' },
          ]}
          className="[&_li:last-child]:max-w-[40ch] [&_li:last-child_span]:truncate"
        />
      }
    />
  );

  if (isPending) {
    return (
      <>
        {crumbs}
        <LoadingBlock label="Chargement de la campagne…" lines={6} />
      </>
    );
  }
  if (isError || !fund) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        {crumbs}
        <EmptyState
          tone={missing ? 'neutral' : 'err'}
          icon={missing ? 'don' : 'alerte'}
          title={
            missing
              ? 'Campagne introuvable.'
              : 'La campagne n’a pas pu être chargée.'
          }
          action={
            missing ? (
              <NextLink
                href={paths.app.dons.root.getHref()}
                className="font-medium"
              >
                Voir les fonds ouverts
              </NextLink>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            )
          }
        />
      </>
    );
  }

  return (
    <>
      {crumbs}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0">
          <CampaignPhoto fund={fund} />
          <div className="mt-6">
            <Badge tone="info">{fundKindLabel(fund.kind)}</Badge>
          </div>
          <h1 className="m-0 mt-3 text-28 font-semibold tracking-[-0.01em] text-ink sm:text-32">
            {fund.title}
          </h1>
          <p className="m-0 mt-2 text-16 text-ink-2">
            {parishLabel(fund.parish.name)}
            {(fund.starts_on || fund.ends_on) && (
              <>
                {' · '}
                <Period startsOn={fund.starts_on} endsOn={fund.ends_on} />
              </>
            )}
          </p>
          <ProgressCard fund={fund} />
          <FundUsageSection description={fund.description} />
          <NewsSection updates={fund.updates} />
        </div>
        <aside
          aria-label="Soutien et informations"
          className="flex flex-col gap-4 xl:sticky xl:top-6"
        >
          <SupportCard fund={fund} />
          <InBrief fund={fund} />
        </aside>
      </div>
    </>
  );
};
