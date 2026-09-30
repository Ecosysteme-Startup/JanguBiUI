'use client';

import NextLink from 'next/link';

import { Badge } from '@/components/ui/badge';
import { cardClasses } from '@/components/ui/card';
import { SkeletonLine } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import { HOME_INTENTIONS, type HomeIntention, useMyIntentions } from '../api/get-my-intentions';
import { INTENTION_STATUS, intentionFollowUp } from '../utils/intentions';

import { HomeSection } from './home-section';

const rowClass = 'flex items-start gap-4 px-6 py-4';

const IntentionRow = ({ item }: { item: HomeIntention }) => {
  const status = INTENTION_STATUS[item.status];
  return (
    <li className="border-b border-line last:border-b-0">
      <NextLink href={paths.app.intentions.getHref()} className={cn(rowClass, 'text-ink transition-colors hover:bg-surface hover:text-ink hover:no-underline')}>
        <span className="min-w-0 flex-1">
          <span className="block text-13 text-ink-3">{item.parish.name}</span>
          <span className="mt-1 line-clamp-2 text-16 font-semibold">{frenchTypo(item.intention)}</span>
          <span className="mt-0.5 block text-15 text-ink-2 first-letter:uppercase">{frenchTypo(intentionFollowUp(item))}</span>
        </span>
        <Badge tone={status?.tone ?? 'neutral'} icon={status?.icon} className="mt-0.5 shrink-0">
          {status?.label ?? item.status}
        </Badge>
      </NextLink>
    </li>
  );
};

/**
 * « Mes intentions de messe » (accueil fidèle) : les trois dernières demandes et leur suivi.
 * Aucune mention d'offrande, de don ni de paiement ici (l'offrande se remet à la paroisse).
 */
export const MyIntentions = ({ className }: { className?: string }) => {
  const { data, isPending, isError } = useMyIntentions();
  const items = data?.results.slice(0, HOME_INTENTIONS) ?? [];

  return (
    <HomeSection
      id="acc-intentions"
      title="Mes intentions de messe"
      className={className}
      action={<NextLink href={paths.app.intentions.getHref()}>Toutes mes intentions</NextLink>}
    >
      {isPending ? (
        <div role="status" data-testid="intentions-squelette" className={cardClasses({ padding: 'none' })}>
          <span className="sr-only">Chargement de vos intentions…</span>
          {[0, 1].map((i) => (
            <div key={i} aria-hidden="true" className={cn(rowClass, 'block border-b border-line last:border-b-0')}>
              <SkeletonLine className="text-13" width="w-32" />
              <SkeletonLine className="mt-1 text-16" width="w-3/4" />
              <SkeletonLine className="mt-0.5 text-15" width="w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="m-0 text-15 text-ink-2">Vos intentions n’ont pas pu être chargées.</p>
      ) : items.length === 0 ? (
        <div className={cardClasses({ padding: 'lg' })}>
          <p className="m-0 text-18 font-semibold text-ink">Aucune intention de messe pour le moment.</p>
          <p className="m-0 mt-1 text-15 text-ink-2">{frenchTypo('Demandez qu’une messe soit célébrée à une intention, et suivez sa planification.')}</p>
          <NextLink href={paths.app.intentions.getHref()} className="mt-3 inline-block text-15 font-semibold">
            Demander une intention
          </NextLink>
        </div>
      ) : (
        <ul className={cn(cardClasses({ padding: 'none' }), 'm-0 list-none overflow-hidden p-0')}>
          {items.map((item) => (
            <IntentionRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </HomeSection>
  );
};
