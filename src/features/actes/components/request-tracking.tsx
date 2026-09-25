'use client';

import NextLink from 'next/link';

import { RequestTimeline } from '@/components/signature/request-timeline';
import { StatusDot } from '@/components/signature/status-dot';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useRequest } from '../api/get-request';
import { type DocumentRequest, documentLabel, reasonLabel } from '../types/request';
import { buildTimeline, messagesOf, pendingInfoRequest } from '../utils/timeline';

import { CancelRequest } from './cancel-request';
import { SupplementForm } from './supplement-form';

const Heading = ({ id, n, title, aside }: { id: string; n: string; title: string; aside?: React.ReactNode }) => (
  <div className="tnum mb-4 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
    <h2 id={id} className="m-0 text-meta font-normal">
      <span className="text-primary">{n}</span> — {title}
    </h2>
    {aside && <span className="text-ink-3">{aside}</span>}
  </div>
);

/** FID-Demande-Suivi / MOB-Demande-Suivi. */
export const RequestTracking = ({ id }: { id: string }) => {
  const { data: request, isPending, isError, error } = useRequest(id);

  if (isPending) return <LoadingBlock label="Chargement de la demande…" lines={6} />;
  if (isError)
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title={error instanceof ApiError && error.status === 404 ? 'Demande introuvable.' : 'La demande n’a pas pu être chargée.'}
        action={<NextLink href={paths.app.demandes.list.getHref()}>Retour à mes demandes</NextLink>}
      />
    );

  return <Tracking request={request} />;
};

const Tracking = ({ request }: { request: DocumentRequest }) => {
  const steps = buildTimeline(request);
  const current = steps.findIndex((s) => s.state === 'current');
  const messages = messagesOf(request);
  const parish = request.target_node?.name ?? 'la paroisse du sacrement';
  const info = request.status === 'info_requested' ? pendingInfoRequest(request) : undefined;
  const label = documentLabel(request);

  return (
    <>
      <NextLink href={paths.app.demandes.list.getHref()} className="inline-flex h-8 items-center gap-2 text-sm font-medium">
        <Icon name="fleche-gauche" size={18} />
        Retour · Mes demandes
      </NextLink>

      <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">03</span> — Mes demandes · <span className="text-ink">{request.reference}</span>
          </p>
          <h1 className="m-0 mt-3 font-serif text-h2 font-normal text-ink lg:text-[50px] lg:leading-none">{label}</h1>
          <p className="m-0 mt-3 text-base text-ink-2">
            {parish} · pour {reasonLabel(request)}
          </p>
        </div>
        <dl className="m-0 flex gap-8">
          <div>
            <dt className="tnum text-meta text-ink-3">Statut</dt>
            <dd className="m-0 mt-1.5" aria-live="polite">
              <StatusDot status={request.status} className="text-base" />
            </dd>
          </div>
          <div>
            <dt className="tnum text-meta text-ink-3">Demandée le</dt>
            <dd className="tnum m-0 mt-1.5 text-base text-ink">{dayjs(request.created_at).format('D MMMM YYYY')}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
          {info && <SupplementForm request={request} message={info.comment} />}

          <section aria-labelledby="sv-avancement">
            <Heading
              id="sv-avancement"
              n="01"
              title="Avancement"
              aside={current >= 0 ? `Étape ${current + 1} sur ${steps.length}` : 'Délai indicatif : 3 à 7 jours'}
            />
            <RequestTimeline steps={steps} label="Avancement de la demande" />
          </section>

          {request.status === 'rejected' && (
            <Notice tone="err" title="La paroisse n’a pas pu donner suite.">
              {frenchTypo(request.rejection_reason || 'Le motif vous a été transmis par notification.')}
            </Notice>
          )}

          <section aria-labelledby="sv-messages">
            <Heading id="sv-messages" n="02" title="Messages de la paroisse" />
            {messages.length === 0 ? (
              <p className="m-0 text-base text-ink-2">Aucun message pour l’instant. S’il manque une précision, le secrétariat vous écrira ici.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col p-0">
                {messages.map((m) => (
                  <li key={m.key} className="border-b border-line py-4 first:pt-0">
                    <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-ink-2">
                      <strong className="font-semibold text-ink">{m.from === 'fidele' ? 'Vous' : `Secrétariat de ${parish}`}</strong>
                      <span aria-hidden="true">·</span>
                      <span className="tnum">{m.when}</span>
                      {m.status === 'info_requested' && <StatusDot status="info_requested" className="ml-2" />}
                    </p>
                    <p className="m-0 mt-2 max-w-reading text-base text-ink">{frenchTypo(m.text)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-10 lg:col-span-5">
          <Recap request={request} label={label} />
          <Pickup request={request} parish={parish} />
          {request.can_cancel && <CancelRequest request={request} parish={parish} />}
        </div>
      </div>
    </>
  );
};

const Recap = ({ request, label }: { request: DocumentRequest; label: string }) => (
  <section aria-labelledby="sv-recap">
    <Heading id="sv-recap" n="03" title="Récapitulatif" />
    <dl className="m-0">
      {[
        ['Acte', label],
        ['Motif', reasonLabel(request)],
        ['Paroisse du sacrement', request.target_node?.name ?? '—'],
        ['Date du sacrement', request.sacrament_approximate_date],
        ['Au nom de', `${request.requester_first_names} ${request.requester_last_name}`],
      ].map(([term, value]) => (
        <div key={term} className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 border-b border-line py-2.5">
          <dt className="tnum text-meta text-ink-3">{term}</dt>
          <dd className="m-0 text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const Pickup = ({ request, parish }: { request: DocumentRequest; parish: string }) => {
  const pickup = request.pickup;
  return (
    <section aria-labelledby="sv-retrait">
      <Heading id="sv-retrait" n="04" title="Retrait de l’original" />
      {pickup ? (
        <div className={cn('rounded border border-primary bg-tint-50 p-5')}>
          <p className="m-0 font-serif text-h4 text-ink">{pickup.place_name ?? `Secrétariat de ${parish}`}</p>
          {pickup.place_address && <p className="m-0 mt-1 text-sm text-ink-2">{pickup.place_address}</p>}
          {pickup.hours && (
            <p className="m-0 mt-3 flex items-center gap-2 text-sm text-ink">
              <Icon name="horloge" size={16} className="text-primary" />
              {pickup.hours}
            </p>
          )}
          {pickup.message && <p className="m-0 mt-3 text-sm text-ink">{frenchTypo(pickup.message)}</p>}
          <p className="m-0 mt-3 text-sm text-ink-2">Munissez-vous d’une pièce d’identité.</p>
        </div>
      ) : (
        <p className="m-0 text-base text-ink-2">
          {request.status === 'collected'
            ? 'L’original vous a été remis.'
            : `Le lieu et les horaires de retrait s’afficheront ici dès que l’acte sera prêt, au secrétariat de ${parish}.`}
        </p>
      )}
      <p className="m-0 mt-4 flex items-start gap-2 text-sm text-ink-2">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-primary" />
        {pickup?.original_notice ||
          'L’acte vous sera remis en original, signé par le curé et revêtu du sceau de la paroisse. Aucun acte n’est délivré par voie numérique.'}
      </p>
    </section>
  );
};
