'use client';

import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { useParishPriests } from '../api/get-parish-priests';

/** Clergé joignable de la paroisse et raccourci vers la demande d'acte. */
export const ClergySection = ({ nodeId, className }: { nodeId: string; className?: string }) => {
  const { data, isPending, isError } = useParishPriests();
  const priests = (data ?? []).filter((p) => p.nodes.some((n) => n.id === nodeId));

  return (
    <section aria-labelledby="mp-clerge" className={className}>
      <SectionHeading id="mp-clerge" number="04" title="Clergé et secrétariat" />
      {isPending ? (
        <LoadingBlock label="Chargement du clergé…" lines={2} />
      ) : isError ? (
        <p className="m-0 text-base text-ink-2">La liste des prêtres n’a pas pu être chargée.</p>
      ) : priests.length === 0 ? (
        <p className="m-0 text-base text-ink-2">Aucun prêtre de la paroisse ne reçoit de messages pour le moment.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {priests.map((p) => (
            <li key={p.user_id} className="flex items-center gap-3 border-b border-line py-3">
              <Avatar name={p.full_name} size={40} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-medium text-ink">{p.full_name}</span>
                <span className="text-sm text-ink-3">
                  {p.availability?.accepts_new_conversations === false ? 'Ne prend pas de nouveaux échanges' : 'Joignable par message'}
                </span>
              </span>
              <NextLink href={paths.app.pretres.list.getHref()} className="hit text-sm font-medium" aria-label={`Écrire à ${p.full_name}`}>
                Écrire
              </NextLink>
            </li>
          ))}
        </ul>
      )}
      <NextLink href={paths.app.demandes.nouvelle.getHref()} className="mt-5 inline-flex items-center gap-2 font-medium">
        Demander un extrait d’acte
      </NextLink>
    </section>
  );
};
