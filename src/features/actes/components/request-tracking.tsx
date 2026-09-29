'use client';

import NextLink from 'next/link';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { StatusDot } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { atParish, ofParish } from '@/utils/parish-name';

import { useRequest } from '../api/get-request';
import { type DocumentRequest, documentLabel, reasonLabel } from '../types/request';
import { buildTimeline, messagesOf, pendingInfoRequest, progressOf } from '../utils/timeline';

import { CancelRequest } from './cancel-request';
import { SupplementForm } from './supplement-form';
import { TrackingHistory } from './tracking-history';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Crumbs = ({ reference }: { reference?: string }) => (
  <TopbarContent
    start={<Breadcrumbs items={[{ label: 'Mes demandes', href: paths.app.demandes.list.getHref() }, ...(reference ? [{ label: reference }] : [])]} />}
  />
);

/** Phrase d'état du bandeau (du point de vue du fidèle) : où en est la demande, et la suite. */
const StatusSentence = ({ request, parish }: { request: DocumentRequest; parish: string }) => {
  switch (request.status) {
    case 'submitted':
      return (
        <>
          Votre demande a été transmise {atParish(parish)}. Prochaine étape : <strong className="font-semibold">vérification au registre</strong>.
        </>
      );
    case 'under_verification':
      return (
        <>
          Le secrétariat recherche votre acte au registre. Prochaine étape : <strong className="font-semibold">prête à retirer</strong>, dès la signature du curé.
        </>
      );
    case 'info_requested':
      return <>La paroisse attend un complément de votre part pour poursuivre la recherche.</>;
    case 'ready_for_pickup':
      return (
        <>
          Votre original est prêt : <strong className="font-semibold">à retirer au secrétariat</strong>, sur présentation d’une pièce d’identité.
        </>
      );
    case 'collected':
      return <>L’original vous a été remis.</>;
    case 'rejected':
      return <>Cette demande n’a pas abouti : le motif figure ci-dessous.</>;
    case 'cancelled':
      return <>Vous avez annulé cette demande.</>;
  }
};

/** FID-Demande-Suivi / MOB-Demande-Suivi. */
export const RequestTracking = ({ id }: { id: string }) => {
  const { data: request, isPending, isError, error } = useRequest(id);

  if (isPending)
    return (
      <>
        <Crumbs />
        <LoadingBlock label="Chargement de la demande…" lines={6} />
      </>
    );
  if (isError)
    return (
      <>
        <Crumbs />
        <EmptyState
          tone="err"
          icon="alerte"
          title={error instanceof ApiError && error.status === 404 ? 'Demande introuvable.' : 'La demande n’a pas pu être chargée.'}
          action={<NextLink href={paths.app.demandes.list.getHref()}>Retour à mes demandes</NextLink>}
        />
      </>
    );

  return <Tracking request={request} />;
};

const Tracking = ({ request }: { request: DocumentRequest }) => {
  const steps = buildTimeline(request);
  const progress = progressOf(request);
  const messages = messagesOf(request);
  const parish = request.target_node?.name ?? 'la paroisse du sacrement';
  const info = request.status === 'info_requested' ? pendingInfoRequest(request) : undefined;
  const label = documentLabel(request);
  const since = request.history.at(-1)?.created_at ?? request.updated_at;
  const tone = request.status === 'rejected' ? 'err' : request.status === 'info_requested' ? 'warn' : request.status === 'ready_for_pickup' ? 'ok' : 'info';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.reference);
      toast.ok('Référence copiée.');
    } catch {
      toast.err('La référence n’a pas pu être copiée.');
    }
  };

  return (
    <>
      <Crumbs reference={request.reference} />
      <p className="tnum m-0 flex items-center gap-1 text-14 text-ink-3">
        {request.reference}
        <IconButton icon="copier" size="sm" label="Copier la référence" onClick={copy} className="size-7 text-ink-3" />
      </p>
      <h1 className="m-0 mt-1 text-28 font-semibold text-ink sm:text-32">{label}</h1>
      <p className="m-0 mt-2 text-16 text-ink-2">
        {capitalize(`pour ${reasonLabel(request)}`)} · {parish}
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section
            aria-label="Statut de la demande"
            className={cn(
              'rounded-16 border p-6',
              tone === 'info' && 'border-tint-200 bg-tint-50 text-tint-900',
              tone === 'ok' && 'border-line bg-ok-bg text-ok',
              tone === 'warn' && 'border-line bg-warn-bg text-warn',
              tone === 'err' && 'border-line bg-err-bg text-err',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span aria-live="polite">
                <StatusDot status={request.status} className="bg-paper" />
              </span>
              <span className="tnum text-14">depuis le {dayjs(since).format('D MMM')}</span>
            </div>
            <p className="m-0 mt-3 text-17 leading-[26px]">
              <StatusSentence request={request} parish={parish} />
            </p>
            {request.estimated_ready_on && request.status !== 'ready_for_pickup' && request.status !== 'collected' && (
              <dl className="m-0 mt-3 flex flex-wrap gap-x-6 gap-y-1 text-14">
                <div className="flex gap-1.5">
                  <dt>Mise à disposition estimée</dt>
                  <dd className="m-0 font-semibold">{capitalize(dayjs(request.estimated_ready_on).format('dddd D MMMM'))}</dd>
                </div>
                {request.indicative_days && (
                  <div>
                    <dt className="sr-only">Délai</dt>
                    <dd className="m-0">
                      Délai indicatif : {request.indicative_days} jour{request.indicative_days > 1 ? 's' : ''}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {progress.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
                {progress.map((s) => (
                  <span key={s.key} className={cn('h-1.5 rounded-3', s.state === 'upcoming' ? 'bg-paper' : 'bg-primary-fill')} />
                ))}
              </div>
            )}
          </section>

          {info && <SupplementForm request={request} message={info.comment} />}

          {request.status === 'rejected' && (
            <Notice tone="err" title="La paroisse n’a pas pu donner suite.">
              {frenchTypo(request.rejection_reason || 'Le motif vous a été transmis par notification.')}
            </Notice>
          )}

          <section aria-labelledby="sv-historique">
            <h2 id="sv-historique" className="m-0 mb-4 text-20 font-semibold text-ink">
              Historique
            </h2>
            <TrackingHistory steps={steps} />
          </section>

          <Pickup request={request} parish={parish} />
        </div>

        <aside aria-label="Échanges et récapitulatif" className="flex min-w-0 flex-col gap-4">
          <Messages messages={messages} parish={parish} info={Boolean(info)} />
          <Recap request={request} label={label} />
          {request.can_cancel && <CancelRequest request={request} parish={parish} />}
        </aside>
      </div>
    </>
  );
};

const Messages = ({ messages, parish, info }: { messages: ReturnType<typeof messagesOf>; parish: string; info: boolean }) => (
  <section aria-labelledby="sv-messages">
    <h2 id="sv-messages" className="m-0 mb-4 text-18 font-semibold text-ink">
      Message de la paroisse
    </h2>
    <div className="rounded-16 border border-line bg-paper p-5 shadow-card">
      {messages.length === 0 ? (
        <p className="m-0 text-14 text-ink-2">Aucun message pour l’instant. S’il manque une précision, le secrétariat vous écrira ici.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {messages.map((m) => (
            <li key={m.key} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <p className="m-0 flex items-center gap-3">
                <Avatar name={m.from === 'fidele' ? 'Vous' : 'Secrétariat Paroissial'} size={40} className="text-14" />
                <span className="flex min-w-0 flex-col">
                  <strong className="text-15 font-semibold text-ink">{m.from === 'fidele' ? 'Vous' : 'Secrétariat paroissial'}</strong>
                  <span className="tnum text-13 text-ink-3">
                    {m.from === 'fidele' ? 'Votre complément' : parish} · {m.when}
                  </span>
                </span>
                {m.status === 'info_requested' && <StatusDot status="info_requested" className="ml-auto" />}
              </p>
              <p className="m-0 mt-3 text-15 text-ink">{frenchTypo(m.text)}</p>
            </li>
          ))}
        </ol>
      )}
      {info && (
        <a href="#sv-complement" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 hover:no-underline')}>
          <Icon name="message" size={18} />
          Répondre
        </a>
      )}
    </div>
  </section>
);

const Recap = ({ request, label }: { request: DocumentRequest; label: string }) => {
  const rows: [string, string, string?][] = [
    ['Acte demandé', label, capitalize(`pour ${reasonLabel(request)}`)],
    ['Paroisse du sacrement', request.target_node?.name ?? '—'],
    ['Au nom de', `${request.requester_first_names} ${request.requester_last_name}`, request.sacrament_approximate_date ? `Sacrement vers ${request.sacrament_approximate_date}` : undefined],
    ['Déposée', capitalize(dayjs(request.created_at).format('dddd D MMM [à] H:mm'))],
  ];
  return (
    <section aria-labelledby="sv-recap" className="rounded-16 border border-line bg-surface p-6">
      <h2 id="sv-recap" className="m-0 text-18 font-semibold text-ink">
        Votre demande
      </h2>
      <dl className="m-0 mt-4">
        {rows.map(([term, value, sub]) => (
          <div key={term} className="border-t border-line py-3 last:pb-0">
            <dt className="text-13 text-ink-3">{term}</dt>
            <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">{value}</dd>
            {sub && <dd className="m-0 text-14 text-ink-2">{sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
};

const Pickup = ({ request, parish }: { request: DocumentRequest; parish: string }) => {
  const pickup = request.pickup;
  const where = pickup?.place_name ?? `Secrétariat ${ofParish(parish)}`;
  const address = pickup?.place_address;
  return (
    <section aria-labelledby="sv-retrait">
      <h2 id="sv-retrait" className="m-0 text-20 font-semibold text-ink">
        Où retirer l’original
      </h2>
      <p className="m-0 mt-1 text-15 text-ink-2">
        {pickup?.original_notice ||
          'L’acte vous sera remis en original, signé par le curé et revêtu du sceau de la paroisse. Aucun acte n\'est délivré par voie numérique.'}
      </p>
      <div className="mt-4 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6">
          <div className="flex flex-col gap-3 text-14">
            <p className="m-0 flex gap-3">
              <Icon name="pin" size={20} className="mt-px shrink-0 text-ink-3" />
              <span>
                <span className="block text-15 font-semibold text-ink">{where}</span>
                {address && <span className="block text-ink-2">{address}</span>}
              </span>
            </p>
            {pickup?.hours ? (
              <p className="m-0 flex gap-3 text-ink-2">
                <Icon name="horloge" size={20} className="mt-px shrink-0 text-ink-3" />
                {pickup.hours}
              </p>
            ) : (
              <p className="m-0 pl-8 text-ink-2">
                {request.status === 'collected' ? 'L’original vous a été remis.' : 'Les horaires de retrait s’afficheront ici dès que l’acte sera prêt.'}
              </p>
            )}
            {pickup?.message && <p className="m-0 pl-8 text-ink">{frenchTypo(pickup.message)}</p>}
          </div>
          <div className="rounded-12 bg-surface p-4">
            <p className="m-0 flex items-center gap-2 text-15 font-semibold text-ink">
              <Icon name="utilisateur-ok" size={18} />À présenter
            </p>
            <ul className="m-0 mt-2 list-disc pl-5 text-14 text-ink-2">
              <li>Votre carte d’identité ou votre passeport</li>
              <li>La référence {request.reference}</li>
            </ul>
          </div>
        </div>
        {address && (
          <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4 sm:px-6">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([where, address].join(', '))}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'hover:no-underline')}
            >
              <Icon name="itineraire" size={18} />
              Itinéraire
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
