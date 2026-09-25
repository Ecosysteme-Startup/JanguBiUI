'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { apiErrorCode, apiErrorMessage } from '@/utils/api-errors';
import { availabilityStatus, isAbsent } from '@/utils/availability-label';
import { cn } from '@/utils/cn';

import { useCreateConversation } from '../api/create-conversation';
import { type ReachablePriest, usePriests } from '../api/get-priests';

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
    <div aria-live="assertive" className="mt-4">
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

const PriestRow = ({
  priest,
  onWrite,
  pending,
}: {
  priest: ReachablePriest;
  onWrite: () => void;
  pending: boolean;
}) => {
  const absent = isAbsent(priest.availability);
  const status = availabilityStatus(priest.availability);
  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 border-b border-line py-4 sm:grid-cols-[56px_minmax(0,1fr)_auto]">
      <Avatar
        name={priest.full_name}
        size={52}
        className={cn(absent && 'border-ink-3 bg-surface-2 text-ink-2')}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'm-0 text-lead font-semibold',
            absent ? 'text-ink-2' : 'text-ink',
          )}
        >
          {priest.full_name}
        </p>
        <p className="m-0 mt-1 text-sm text-ink-2">
          <span
            className={
              status.tone === 'ok' ? 'text-ok' : 'font-semibold text-warn'
            }
          >
            {status.label}
          </span>
          {status.detail ? ` · ${status.detail}` : ''}
        </p>
      </div>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onWrite}
          disabled={pending}
          aria-label={`Écrire à ${priest.full_name}`}
        >
          <Icon name="message" size={16} />
          Écrire
        </Button>
        {absent ? (
          <button
            type="button"
            disabled
            aria-label={`Rendez-vous indisponible : ${priest.full_name} est absent`}
            className="inline-flex size-11 cursor-not-allowed items-center justify-center rounded border border-line bg-surface-2 text-ink-3"
          >
            <Icon name="confession" size={18} />
          </button>
        ) : (
          <NextLink
            href={paths.app.confession.getHref()}
            aria-label={`Rendez-vous de confession avec ${priest.full_name}`}
            className="inline-flex size-11 items-center justify-center rounded border border-line text-ink hover:border-ink"
          >
            <Icon name="confession" size={18} />
          </NextLink>
        )}
      </div>
    </li>
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

/** Prêtres joignables (FID-Pretres, section 01). */
export const PriestList = ({
  parishName,
  number = '01',
}: {
  parishName?: string | null;
  number?: string;
}) => {
  const router = useRouter();
  const priests = usePriests();
  const create = useCreateConversation({
    onSuccess: (id) => router.push(paths.app.pretres.conversation.getHref(id)),
  });

  return (
    <section aria-labelledby="pretres-joignables">
      <SectionHeading
        id="pretres-joignables"
        number={number}
        title={`Prêtres joignables${parishName ? ` · ${parishName}` : ''}`}
        aside={
          priests.data
            ? `${priests.data.length} prêtre${priests.data.length > 1 ? 's' : ''}`
            : undefined
        }
      />
      {create.isError && <Refusal error={create.error} />}
      {priests.isPending ? (
        <LoadingBlock label="Chargement des prêtres joignables…" />
      ) : priests.isError ? (
        <EmptyState
          tone="err"
          icon="alerte"
          title="La liste des prêtres n’a pas pu être chargée"
        >
          Vérifiez votre connexion puis rechargez la page.
        </EmptyState>
      ) : priests.data.length === 0 ? (
        <EmptyState
          icon="message"
          title="Aucun prêtre joignable pour l’instant"
        >
          {parishName
            ? 'Les prêtres de votre paroisse n’ont pas encore ouvert la messagerie. Vous pouvez les rencontrer à l’accueil paroissial.'
            : 'Choisissez d’abord la paroisse que vous suivez dans votre profil.'}
        </EmptyState>
      ) : (
        groupByNode(priests.data).map((group, index) => (
          <div key={group.name}>
            {index > 0 && (
              <p className="tnum m-0 mt-4 text-meta text-ink-3">
                Rattaché · {group.name}
              </p>
            )}
            <ul
              aria-label={`Prêtres joignables · ${group.name}`}
              className="m-0 list-none p-0"
            >
              {group.priests.map((priest) => (
                <PriestRow
                  key={priest.user_id}
                  priest={priest}
                  pending={create.isPending}
                  onWrite={() => create.mutate(priest.user_id)}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
};
