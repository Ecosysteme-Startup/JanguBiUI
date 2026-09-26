'use client';

import { displayName, useMe } from '@/hooks/use-me';
import { frenchTypo } from '@/utils/french-typo';
import { parishLabel } from '@/utils/parish-name';

import { useCurrentRequest } from '../api/get-current-request';

/** En-tête personnel de l'accueil : salutation en wolof, prénom, et l'essentiel du moment. */
export const HomeGreeting = () => {
  const { data: me } = useMe();
  const { data: request } = useCurrentRequest();
  const name = displayName(me);
  const paroisse = me?.paroisse_suivie?.name;
  const summary = request
    ? `Votre demande « ${request.document_type_label} » est au statut « ${request.status_label.toLowerCase()} »${
        request.target_node ? ` à ${request.target_node.name}` : ''
      }.`
    : null;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div>
        <p className="tnum m-0 hidden text-meta text-ink-2 lg:block">Mon espace{paroisse ? ` · ${parishLabel(paroisse)}` : ''}</p>
        <h1 className="m-0 font-serif text-h3 font-normal text-ink lg:mt-3 lg:text-[3.125rem] lg:leading-none">
          Jàmm ak jàmm{name.first ? ', ' : ''}
          {name.first && <em className="text-primary">{name.first}</em>}.
        </h1>
      </div>
      {summary && <p className="m-0 hidden max-w-[392px] text-base text-ink-2 lg:block lg:text-right">{frenchTypo(summary)}</p>}
    </header>
  );
};
