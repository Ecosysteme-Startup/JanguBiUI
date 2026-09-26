'use client';

import NextLink from 'next/link';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { type CurrentRequest, requestReason, useCurrentRequest } from '../api/get-current-request';

import { HomeSection } from './home-section';

const STEPS = ['Soumise', 'Vérification', 'Prête à retirer', 'Retirée'];
const STEP_OF: Record<string, number> = { submitted: 1, under_verification: 2, info_requested: 2, ready_for_pickup: 3, collected: 4 };
const TONE_OF: Record<string, BadgeTone> = { submitted: 'neutral', under_verification: 'info', info_requested: 'warn', ready_for_pickup: 'ok' };

const shortDay = (iso: string) => dayjs(iso).format('D MMM');

const PICKUP_NOTE = 'L’extrait est un original papier, à retirer au secrétariat avec votre pièce d’identité.';

const RequestCard = ({ request }: { request: CurrentRequest }) => {
  const step = STEP_OF[request.status] ?? 1;
  const reason = requestReason(request);
  const place = [request.target_node?.name, reason && `pour ${reason}`].filter(Boolean).join(' · ');
  return (
    <NextLink href={paths.app.demandes.detail.getHref(request.id)} className={cardClasses({ interactive: true, padding: 'lg' })}>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="tnum text-14 text-ink-3">
          {request.reference} · déposée le {shortDay(request.created_at)}
        </span>
        <Badge tone={TONE_OF[request.status] ?? 'neutral'} dot>
          {request.status_label}
        </Badge>
      </span>
      <span className="mt-2 block text-18 font-semibold">{request.document_type_free || request.document_type_label}</span>
      {place && <span className="block text-15 text-ink-2">{place}</span>}
      <span aria-label={`Avancement : étape ${step} sur ${STEPS.length}`} role="img" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((label, i) => (
          <span key={label} aria-hidden="true" className="min-w-0">
            <span className={cn('block h-1.5 rounded-full', i < step ? 'bg-primary-fill' : 'bg-surface-2')} />
            <span className={cn('mt-2 block text-13', i + 1 === step ? 'font-semibold text-ink' : i < step ? 'text-ink-2' : 'text-ink-3')}>
              {label}
              {i === 0 && <span className="font-normal text-ink-3"> {shortDay(request.created_at)}</span>}
            </span>
          </span>
        ))}
      </span>
      <span className="mt-5 flex items-start gap-2.5 border-t border-line pt-4 text-14 text-ink-2">
        <Icon name="info" size={18} className="mt-px shrink-0" />
        <span>{PICKUP_NOTE}</span>
      </span>
    </NextLink>
  );
};

/** Gabarit de la carte de demande (mêmes marges et hauteurs de ligne) : la carte arrive sans décaler la page. */
const RequestCardSkeleton = () => (
  <div role="status" data-testid="demande-squelette" className={cardClasses({ padding: 'lg' })}>
    <span className="sr-only">Chargement de votre demande…</span>
    <span aria-hidden="true" className="flex items-center justify-between gap-4">
      <SkeletonLine className="text-14" width="w-48" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </span>
    <SkeletonLine className="mt-2 text-18" width="w-2/3" />
    <SkeletonLine className="text-15" width="w-1/2" />
    <span aria-hidden="true" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STEPS.map((label) => (
        <span key={label}>
          <span className="block h-1.5 rounded-full bg-surface-2" />
          <SkeletonLine className="mt-2 text-13" width="w-20" />
        </span>
      ))}
    </span>
    <span aria-hidden="true" className="mt-5 block border-t border-line pt-4">
      <SkeletonLine className="text-14" width="w-5/6" />
    </span>
  </div>
);

/** « Ma demande en cours » (FID-Accueil). L'acte est un original à retirer : jamais de PDF. */
export const CurrentRequestCard = ({ className }: { className?: string }) => {
  const { data: request, isPending, isError } = useCurrentRequest();
  return (
    <HomeSection
      id="acc-demande"
      title="Ma demande en cours"
      className={className}
      action={<NextLink href={paths.app.demandes.list.getHref()}>Toutes mes demandes</NextLink>}
    >
      {isPending ? (
        <RequestCardSkeleton />
      ) : isError ? (
        <p className="m-0 text-15 text-ink-2">Vos demandes n’ont pas pu être chargées.</p>
      ) : request ? (
        <RequestCard request={request} />
      ) : (
        <div className={cardClasses({ padding: 'lg' })}>
          <p className="m-0 text-18 font-semibold text-ink">Aucune demande en cours.</p>
          <p className="m-0 mt-1 text-15 text-ink-2">
            Un extrait d’acte se demande à la paroisse du sacrement ; l’original se retire au secrétariat.
          </p>
          <NextLink href={paths.app.demandes.nouvelle.getHref()} className="mt-3 inline-block text-15 font-semibold">
            Demander un extrait d’acte
          </NextLink>
        </div>
      )}
    </HomeSection>
  );
};
