'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { ACTIVE_COUNT_PARAMS, EXCERPT_PARAMS, useDirectory } from '../api/get-directory';
import { sundayMassesLabel } from '../utils/schedule';

import { parishPlace } from './parish-row';
import { ParishStatus } from './parish-status';

const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** « V — Paroisses » de l'accueil : volume de l'annuaire et six fiches, actives d'abord. */
export const DirectoryExcerpt = () => {
  const list = useDirectory(EXCERPT_PARAMS);
  const active = useDirectory(ACTIVE_COUNT_PARAMS);
  const parishes = [...(list.data?.results ?? [])].sort((a, b) => Number(b.is_active_on_platform) - Number(a.is_active_on_platform));

  return (
    <section aria-labelledby="annuaire-titre" className="flex flex-col">
      <SectionHeading
        number="V"
        title="Les paroisses"
        aside={
          <NextLink href={paths.paroisses.list.getHref()} className="text-primary">
            Tout l&apos;annuaire
          </NextLink>
        }
      />
      {list.isPending ? (
        <LoadingBlock label="Chargement de l’annuaire…" />
      ) : list.isError || !list.data ? (
        <p className="m-0 mt-6 text-base text-ink-2">
          L&apos;annuaire n&apos;a pas pu être chargé.{' '}
          <NextLink href={paths.paroisses.list.getHref()} className="text-primary underline">
            Ouvrir l&apos;annuaire
          </NextLink>
        </p>
      ) : (
        <>
          <p className="m-0 mt-8 font-serif text-display leading-none text-primary">{list.data.count}</p>
          <h2 id="annuaire-titre" className="m-0 mt-2 max-w-[24ch] font-serif text-h3 font-normal text-ink md:text-h2">
            {list.data.count > 1 ? 'paroisses' : 'paroisse'} dans l&apos;annuaire
            {active.data && `, dont ${count(active.data.count, 'ouverte', 'ouvertes')} sur Jàngu Bi.`}
          </h2>
          <ul className="m-0 mt-8 list-none border-t border-ink p-0">
            {parishes.map((parish) => (
              <li key={parish.id}>
                <NextLink
                  href={paths.paroisses.detail.getHref(parish.code)}
                  className="grid grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-4 border-b border-line py-3.5 text-ink hover:bg-surface"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-serif text-h4">{parish.name}</span>
                    {parishPlace(parish) && <span className="truncate text-sm text-ink-3">{parishPlace(parish)}</span>}
                    {parish.sunday_masses.length > 0 && (
                      <span className="tnum text-sm text-ink-2">Dimanche : {sundayMassesLabel(parish.sunday_masses)}</span>
                    )}
                  </span>
                  <ParishStatus active={parish.is_active_on_platform} />
                  <Icon name="chevron-droite" size={18} className="text-ink-3" />
                </NextLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
