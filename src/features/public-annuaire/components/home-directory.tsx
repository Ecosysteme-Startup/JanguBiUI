'use client';

import NextLink from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import { type DirectoryNode, EXCERPT_PARAMS, useDioceses, useDirectory } from '../api/get-directory';
import { useNodeWeek } from '../api/get-node-week';
import { useNow } from '../hooks/use-parish-now';
import { nextMassPhrase, upcomingMasses } from '../utils/schedule';

import { ChurchDrawing, type ChurchDrawingVariant } from './church-drawing';

const DRAWINGS: ChurchDrawingVariant[] = ['arche', 'cathedrale', 'clocher'];

/** « Point E, Dakar · doyenné Plateau-Médina ». */
export const parishSubtitle = (parish: DirectoryNode) =>
  [[parish.address, parish.city].filter(Boolean).join(', '), parish.deanery_name ? `doyenné ${parish.deanery_name.replace(/^Doyenné\s+/i, '')}` : null]
    .filter(Boolean)
    .join(' · ');

/** « Prochaine messe aujourd'hui à 18 h 30 » d'une paroisse ouverte (horaires publiés). */
const NextMassLine = ({ parish }: { parish: DirectoryNode }) => {
  const now = useNow();
  const { data } = useNodeWeek(parish.id);
  const next = data && now ? upcomingMasses(data.occurrences, now.today, now.time)[0] : undefined;
  if (!next || !now) return null;
  return (
    <span className="tnum mt-3 inline-flex items-center gap-2 text-14 text-ink">
      <Icon name="horloge" size={16} className="shrink-0 text-primary" />
      {frenchTypo(`Prochaine messe ${nextMassPhrase(next, now.today)}`)}
    </span>
  );
};

const ParishCard = ({ parish, drawing }: { parish: DirectoryNode; drawing: ChurchDrawingVariant }) => (
  <NextLink
    href={paths.paroisses.detail.getHref(parish.code)}
    className={cn(cardClasses({ interactive: true, padding: 'none' }), 'flex w-full flex-col overflow-hidden')}
  >
    <ChurchDrawing variant={drawing} slot={`annuaire-${parish.code.toLowerCase()}`} className="h-44" />
    <span className="flex flex-col gap-1 px-5 pb-6 pt-5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-18 font-semibold text-ink">{parish.name.replace(/^Paroisse\s+/i, '')}</span>
        {parish.is_active_on_platform && <Badge tone="ok">Sur Jàngu Bi</Badge>}
      </span>
      {parishSubtitle(parish) && <span className="text-14 text-ink-2">{parishSubtitle(parish)}</span>}
      {parish.is_active_on_platform ? (
        <NextMassLine parish={parish} />
      ) : (
        <span className="mt-3 inline-flex items-center gap-2 text-14 text-ink-3">
          <Icon name="info" size={16} className="shrink-0" />
          Pas encore sur Jàngu Bi
        </span>
      )}
    </span>
  </NextLink>
);

/**
 * « Trouver votre paroisse » (WEB-Accueil) : recherche vers l'annuaire (nom, diocèse), trois
 * fiches (paroisses ouvertes d'abord) et le nombre de paroisses de l'annuaire.
 */
export const HomeDirectory = () => {
  const list = useDirectory(EXCERPT_PARAMS);
  const dioceses = useDioceses();
  const parishes = [...(list.data?.results ?? [])]
    .sort((a, b) => Number(b.is_active_on_platform) - Number(a.is_active_on_platform))
    .slice(0, 3);

  return (
    <section aria-labelledby="annuaire-titre" className="jb-container pt-16 md:pt-24">
      <h2 id="annuaire-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
        Trouver votre paroisse
      </h2>
      <p className="m-0 mt-2 text-18 text-ink-2">Horaires des messes, annonces et contacts, publiés par la paroisse elle-même.</p>

      <form role="search" aria-label="Rechercher une paroisse" action={paths.paroisses.list.getHref()} className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px_auto]">
        <Input name="q" type="search" icon="recherche" aria-label="Nom de la paroisse, quartier ou ville" placeholder="Nom de la paroisse, quartier ou ville" autoComplete="off" />
        <Select name="diocese" aria-label="Diocèse" defaultValue="">
          <option value="">Tous les diocèses</option>
          {dioceses.data?.results.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <button type="submit" className={cn(buttonVariants({ variant: 'secondary', size: 'xl' }), 'border-line')}>
          Rechercher
        </button>
      </form>

      {parishes.length > 0 && (
        <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {parishes.map((parish, index) => (
            <li key={parish.id} className="flex">
              <ParishCard parish={parish} drawing={DRAWINGS[index % DRAWINGS.length] ?? 'arche'} />
            </li>
          ))}
        </ul>
      )}
      {list.isError && <p className="m-0 mt-8 text-16 text-ink-2">L&apos;annuaire n&apos;a pas pu être chargé.</p>}
      {list.data && (
        <p className="m-0 mt-6 text-15 text-ink-2">
          {list.data.count > 1 ? `${list.data.count} paroisses figurent dans l’annuaire.` : `${list.data.count} paroisse figure dans l’annuaire.`}{' '}
          <NextLink href={paths.paroisses.list.getHref()} className="font-semibold">
            Voir l&apos;annuaire complet
          </NextLink>
        </p>
      )}
    </section>
  );
};
