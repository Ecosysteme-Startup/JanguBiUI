'use client';

import NextLink from 'next/link';

import { StatusDot } from '@/components/signature/status-dot';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { dayjs, hour } from '@/utils/dates';

import { useProcessorRequest } from '../api/get-processor-request';
import { type ProcessorRequest, REASON_LABELS } from '../types/processing';

import { DecisionPanel } from './decision-panel';
import { InternalNotes } from './internal-notes';
import { RegisterSection } from './register-section';
import { SectionTitle } from './section-title';
import { StatusHistory } from './status-history';

const documentLabel = (r: ProcessorRequest) => (r.document_type === 'other' && r.document_type_free ? r.document_type_free : r.document_type_label);
const reasonLabel = (r: ProcessorRequest) => (r.reason === 'other' && r.reason_free ? r.reason_free : (REASON_LABELS[r.reason] ?? r.reason));

/** PAR-Demande-Detail : informations du fidèle, registre, décision, journal, notes internes. */
export const RequestProcessing = ({ nodeId, id }: { nodeId: string; id: string }) => {
  const { data: request, isPending, isError, error } = useProcessorRequest(nodeId, id);

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

  return (
    <>
      <NextLink href={paths.espace.demandes.list.getHref(nodeId)} className="inline-flex h-8 items-center gap-2 text-sm font-medium">
        <Icon name="fleche-gauche" size={18} />
        Retour · Demandes d’actes
      </NextLink>
      <header className="mt-6">
        <p className="tnum m-0 text-meta text-ink-2">
          <span className="text-primary">{request.reference}</span> — {documentLabel(request)} · pour {reasonLabel(request).toLowerCase()}
        </p>
        <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">
          {request.requester_first_names} {request.requester_last_name}
        </h1>
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
          <span aria-live="polite">
            <StatusDot status={request.status} />
          </span>
          <span className="tnum">
            Reçue le {dayjs(request.created_at).format('dddd D MMMM')} à {hour(request.created_at)}
          </span>
          <span>{request.assigned_to_id ? 'Assignée' : 'À assigner'}</span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
          <RequesterInfo request={request} />
          <RegisterSection nodeId={nodeId} request={request} />
        </div>
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-5">
          <DecisionPanel nodeId={nodeId} request={request} />
          <StatusHistory history={request.history} />
          <InternalNotes nodeId={nodeId} requestId={request.id} />
        </div>
      </div>
    </>
  );
};

const detailLabels: Record<string, string> = {
  spouse_full_name_groom: 'Époux',
  spouse_full_name_bride: 'Épouse',
  celebration_type: 'Célébration',
};

const RequesterInfo = ({ request }: { request: ProcessorRequest }) => {
  const details = Object.entries(request.document_details ?? {}).filter(([, v]) => typeof v === 'string' && v.trim());
  const rows: [string, string][] = [
    ['Naissance', `${dayjs(request.date_of_birth).format('D MMMM YYYY')}, ${request.place_of_birth}`],
    ['Parents', `${request.father_last_name} et ${request.mother_last_name}`],
    ['Sacrement déclaré', `${request.sacrament_approximate_date}, ${request.sacrament_location}`],
    ['Motif', reasonLabel(request)],
    [
      'Retrait souhaité',
      request.pickup_mode === 'transfer_to_followed_parish' ? 'Transmis à la paroisse suivie par le fidèle' : 'Au secrétariat de la paroisse',
    ],
    ['Téléphone', request.contact_phone],
    ['Adresse électronique', request.contact_email],
    ...details.map(([k, v]) => [detailLabels[k] ?? k, String(v)] as [string, string]),
  ];
  return (
    <section aria-labelledby="d-infos">
      <SectionTitle id="d-infos" n="01" title="Informations fournies par le fidèle" />
      <dl className="m-0">
        {rows.map(([term, value]) => (
          <div key={term} className="grid gap-1 border-b border-line py-2.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
            <dt className="tnum text-meta text-ink-3">{term}</dt>
            <dd className="m-0 text-base text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {request.additional_info && (
        <div className="mt-4">
          <p className="tnum m-0 text-meta text-ink-3">Précisions et compléments du fidèle</p>
          <p className="m-0 mt-1.5 whitespace-pre-line text-base text-ink">{request.additional_info}</p>
        </div>
      )}
    </section>
  );
};
