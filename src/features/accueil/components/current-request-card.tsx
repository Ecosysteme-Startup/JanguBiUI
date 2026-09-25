'use client';

import NextLink from 'next/link';

import { StatusDot, REQUEST_STATUS, type RequestStatus } from '@/components/signature/status-dot';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dotDate } from '@/utils/dates';

import { type CurrentRequest, useCurrentRequest } from '../api/get-current-request';

const STEPS = ['Soumise', 'En vérification', 'Prête à retirer', 'Retirée'];
const STEP_OF: Record<string, number> = { submitted: 1, under_verification: 2, info_requested: 2, ready_for_pickup: 3, collected: 4 };

const isRequestStatus = (s: string): s is RequestStatus => s in REQUEST_STATUS;

const RequestCard = ({ request }: { request: CurrentRequest }) => {
  const step = STEP_OF[request.status] ?? 1;
  return (
    <NextLink
      href={paths.app.demandes.detail.getHref(request.id)}
      className="mt-4 block rounded border border-line bg-surface p-6 text-ink hover:border-line-strong"
    >
      <span className="tnum flex items-baseline justify-between gap-4">
        <span className="text-xs">{request.reference}</span>
        <span className="text-meta text-ink-3">Soumise le {dotDate(request.created_at)}</span>
      </span>
      <span className="mt-3 block font-serif text-h3">{request.document_type_free || request.document_type_label}</span>
      {request.target_node && (
        <span className="mt-2 block text-base text-ink-2">
          Demandé à <strong className="font-semibold text-ink">{request.target_node.name}</strong>, paroisse du sacrement.
        </span>
      )}
      <span className="mt-4 flex items-center justify-between">
        {isRequestStatus(request.status) ? <StatusDot status={request.status} /> : <span className="text-sm">{request.status_label}</span>}
        <span className="tnum text-meta text-ink-3">
          Étape {step} / {STEPS.length}
        </span>
      </span>
      <span aria-label="Avancement de la demande" className="mt-3 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={cn(
              'border-t-2 pt-2 text-sm leading-tight',
              i + 1 < step && 'border-primary text-ink',
              i + 1 === step && 'border-ink font-semibold text-ink',
              i + 1 > step && 'border-line text-ink-3',
            )}
          >
            {label}
          </span>
        ))}
      </span>
      <span className="mt-4 flex justify-end border-t border-line pt-4 text-sm font-medium text-primary">Suivre →</span>
    </NextLink>
  );
};

/** « Ma demande en cours » (FID-Accueil 02, MOB-Accueil 03). */
export const CurrentRequestCard = ({ number, className }: { number: string; className?: string }) => {
  const { data: request, isPending, isError } = useCurrentRequest();
  return (
    <section aria-labelledby="acc-demande" className={className}>
      <SectionHeading
        id="acc-demande"
        number={number}
        title="Ma demande en cours"
        aside={<NextLink href={paths.app.demandes.list.getHref()}>Toutes mes demandes</NextLink>}
      />
      {isPending ? (
        <LoadingBlock label="Chargement de votre demande…" />
      ) : isError ? (
        <p className="m-0 text-base text-ink-2">Vos demandes n’ont pas pu être chargées.</p>
      ) : request ? (
        <RequestCard request={request} />
      ) : (
        <div className="mt-4 border border-line p-6">
          <p className="m-0 font-serif text-h4 text-ink">Aucune demande en cours.</p>
          <p className="m-0 mt-2 text-base text-ink-2">
            Un extrait d’acte se demande à la paroisse du sacrement ; l’original se retire au secrétariat.
          </p>
          <NextLink href={paths.app.demandes.nouvelle.getHref()} className="mt-4 inline-block font-medium">
            Demander un extrait d’acte
          </NextLink>
        </div>
      )}
    </section>
  );
};
