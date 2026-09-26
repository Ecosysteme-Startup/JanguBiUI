'use client';

import NextLink from 'next/link';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { dayjs, fromNow, hour } from '@/utils/dates';

import { useProcessorRequest } from '../api/get-processor-request';
import { type ProcessorRequest, reasonText } from '../types/processing';
import { complementReceived } from '../utils/history';

import { AssignmentControl } from './assignment-control';
import { AttachmentsList } from './attachments-list';
import { DecisionPanel } from './decision-panel';
import { InternalNotes } from './internal-notes';
import { QueueNeighbours } from './queue-neighbours';
import { RegisterSection } from './register-section';
import { RequestStatusBadge } from './request-status-badge';
import { StatusHistory } from './status-history';

const documentLabel = (r: ProcessorRequest) => (r.document_type === 'other' && r.document_type_free ? r.document_type_free : r.document_type_label);

/** « aujourd'hui à 8 h 52 », « le 23 sept. à 11 h 20 ». */
export const whenLabel = (iso: string, now = dayjs()) =>
  dayjs(iso).isSame(now, 'day') ? `à ${hour(iso)}` : `le ${dayjs(iso).format('D MMM')} à ${hour(iso)}`;

/** PAR-Demande-Detail : demandeur, registre, notes internes ; statut, attribution et historique à droite. */
export const RequestProcessing = ({ nodeId, id }: { nodeId: string; id: string }) => {
  const { data: request, isPending, isError, error, refetch } = useProcessorRequest(nodeId, id);

  if (isPending) return <LoadingBlock label="Chargement de la demande…" lines={8} />;
  if (isError)
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title={error instanceof ApiError && error.status === 404 ? 'Cette demande n’est pas dans votre file.' : 'La demande n’a pas pu être chargée.'}
        action={<NextLink href={paths.espace.demandes.list.getHref(nodeId)}>Retour à la file</NextLink>}
      />
    );

  const received = complementReceived(request);

  return (
    <>
      <TopbarContent
        start={
          <Breadcrumbs
            separator="slash"
            items={[{ label: 'Demandes d’actes', href: paths.espace.demandes.list.getHref(nodeId) }, { label: request.reference }]}
          />
        }
      />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tnum text-14 text-ink-3">{request.reference}</span>
            <span aria-live="polite">
              <RequestStatusBadge status={request.status} />
            </span>
            {received && (
              <Badge tone="ok" icon="trombone">
                Complément reçu {whenLabel(received.created_at)}
              </Badge>
            )}
          </div>
          <h1 className="m-0 mt-2 text-32 font-semibold text-ink">{documentLabel(request)}</h1>
          <p className="tnum m-0 mt-1 text-16 text-ink-2">
            Reçue le {dayjs(request.created_at).format('dddd D MMMM')} à {hour(request.created_at)} · {fromNow(request.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-7">
          <QueueNeighbours nodeId={nodeId} id={request.id} />
          <Button variant="outline" className="text-14" onClick={() => window.print()}>
            <Icon name="imprimer" size={18} className="text-ink-2" />
            Imprimer la fiche
          </Button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_344px]">
        <div className="flex min-w-0 flex-col gap-6">
          <RequesterCard request={request} onLinksExpired={refetch} />
          <RegisterSection nodeId={nodeId} request={request} />
          <InternalNotes nodeId={nodeId} requestId={request.id} />
        </div>
        <aside aria-label="Actions sur la demande" className="flex min-w-0 flex-col gap-6">
          <DecisionPanel nodeId={nodeId} request={request} />
          <AssignmentControl key={request.assigned_to_id ?? 'aucun'} nodeId={nodeId} request={request} />
          <StatusHistory history={request.history} />
        </aside>
      </div>
    </>
  );
};

const detailLabels: Record<string, string> = {
  spouse_full_name_groom: 'Époux',
  spouse_full_name_bride: 'Épouse',
  celebration_type: 'Célébration',
};

const RequesterCard = ({ request, onLinksExpired }: { request: ProcessorRequest; onLinksExpired: () => Promise<unknown> }) => {
  const name = `${request.requester_first_names} ${request.requester_last_name}`;
  const details = Object.entries(request.document_details ?? {}).filter(([, v]) => typeof v === 'string' && v.trim());
  const rows: [string, string][] = [
    ['Motif', reasonText(request)],
    ['Sacrement déclaré', [request.sacrament_approximate_date, request.sacrament_location].filter(Boolean).join(', ')],
    ['Naissance', `${dayjs(request.date_of_birth).format('D MMMM YYYY')}, ${request.place_of_birth}`],
    ['Parents', `${request.father_last_name} et ${request.mother_last_name}`],
    [
      'Retrait',
      request.pickup_mode === 'transfer_to_followed_parish'
        ? 'Transmis à la paroisse suivie par le fidèle'
        : 'Au secrétariat de la paroisse, sur présentation d’une pièce d’identité',
    ],
    ['Téléphone', request.contact_phone],
    ...details.map(([k, v]) => [detailLabels[k] ?? k, String(v)] as [string, string]),
  ];
  return (
    <section aria-labelledby="d-infos" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={44} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 id="d-infos" className="m-0 text-17 font-semibold text-ink">
            <span className="sr-only">Informations fournies par le fidèle : </span>
            {name}
          </h2>
          <span className="truncate text-13 text-ink-3">Fidèle · {request.contact_email}</span>
        </div>
      </div>
      <dl className="m-0 mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div key={term} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-13 text-ink-3">{term}</dt>
            <dd className="m-0 break-words text-15 text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {request.additional_info && (
        <div className="mt-4 flex flex-col gap-0.5">
          <p className="m-0 text-13 text-ink-3">Précisions et compléments du fidèle</p>
          <p className="m-0 whitespace-pre-line text-15 text-ink">{request.additional_info}</p>
        </div>
      )}
      <AttachmentsList attachments={request.attachments} onExpired={onLinksExpired} />
    </section>
  );
};
