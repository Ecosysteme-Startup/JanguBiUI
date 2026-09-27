'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { apiErrorCode, apiErrorMessage } from '@/utils/api-errors';

import { useCreateConversation } from '../api/create-conversation';
import { type ReachablePriest, usePriests } from '../api/get-priests';

import { PriestCard } from './priest-card';

const REFUSAL_TITLES: Record<string, string> = {
  minor: 'La messagerie est réservée aux personnes majeures',
  birth_date_required: 'Votre date de naissance est nécessaire',
  not_accepting: 'Ce prêtre ne prend pas de nouveaux échanges',
  not_reachable: 'Ce prêtre n’est pas joignable par la messagerie',
};

/** Refus expliqué à l'ouverture d'un échange (RG-13 : réservé aux majeurs). */
const Refusal = ({ error }: { error: unknown }) => {
  const code = apiErrorCode(error) ?? '';
  return (
    <div aria-live="assertive">
      <Notice
        tone={code in REFUSAL_TITLES ? 'warn' : 'err'}
        title={
          REFUSAL_TITLES[code] ?? 'La conversation n’a pas pu être ouverte'
        }
      >
        {apiErrorMessage(error)}
        {code === 'birth_date_required' && (
          <>
            {' '}
            <NextLink href={paths.app.profil.getHref()}>
              Compléter mon profil
            </NextLink>
          </>
        )}
      </Notice>
    </div>
  );
};

/** Groupe par nœud : la paroisse suivie d'abord, puis les aumôneries rattachées. */
const groupByNode = (priests: ReachablePriest[]) => {
  const groups = new Map<
    string,
    { name: string; type: string; priests: ReachablePriest[] }
  >();
  priests.forEach((priest) => {
    const node = priest.nodes[0] ?? { id: 'autre', name: 'Autres', type: '' };
    const group = groups.get(node.id) ?? {
      name: node.name,
      type: node.type,
      priests: [],
    };
    groups.set(node.id, { ...group, priests: [...group.priests, priest] });
  });
  return [...groups.values()].sort(
    (a, b) => Number(b.type === 'paroisse') - Number(a.type === 'paroisse'),
  );
};

/**
 * Prêtres joignables (FID-Pretres) : grille de cartes, la paroisse suivie d'abord, puis les
 * aumôneries rattachées. `conversationHrefOf` : lien vers l'échange déjà ouvert avec un prêtre.
 */
export const PriestList = ({
  conversationHrefOf,
}: {
  conversationHrefOf?: (priestUserId: string) => string | undefined;
}) => {
  const router = useRouter();
  const priests = usePriests();
  const create = useCreateConversation({
    onSuccess: (id) => router.push(paths.app.pretres.conversation.getHref(id)),
  });

  if (priests.isPending) return <LoadingBlock label="Chargement des prêtres joignables…" />;
  if (priests.isError) {
    return (
      <EmptyState tone="err" icon="alerte" title="La liste des prêtres n’a pas pu être chargée">
        Vérifiez votre connexion puis rechargez la page.
      </EmptyState>
    );
  }
  if (priests.data.length === 0) {
    return (
      <EmptyState icon="message" title="Aucun prêtre joignable pour l’instant">
        Les prêtres de votre paroisse n’ont pas encore ouvert la messagerie. Vous pouvez les rencontrer à l’accueil paroissial.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {create.isError && <Refusal error={create.error} />}
      {groupByNode(priests.data).map((group, index) => (
        <section key={group.name} aria-label={index > 0 ? `Rattaché · ${group.name}` : undefined} className="flex flex-col gap-3">
          {index > 0 && <h2 className="m-0 text-13 font-medium text-ink-3">Rattaché · {group.name}</h2>}
          <ul aria-label={`Prêtres joignables · ${group.name}`} className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            {group.priests.map((priest) => (
              <PriestCard
                key={priest.user_id}
                priest={priest}
                conversationHref={conversationHrefOf?.(priest.user_id)}
                pending={create.isPending}
                onWrite={() => create.mutate(priest.user_id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
