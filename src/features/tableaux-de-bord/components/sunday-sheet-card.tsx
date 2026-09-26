import NextLink from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import type { SundaySheetGlance } from '../api/get-sunday-sheet';

const SHOWN = 3;

/** « Annonce du dimanche » (maquette PAR-Tableau-de-bord) : la feuille du prochain dimanche. */
export const SundaySheetCard = ({ nodeId, sheet }: { nodeId: string; sheet: SundaySheetGlance }) => {
  const scheduled = sheet.items.filter((i) => i.status === 'scheduled').length;
  const title = dayjs(sheet.sunday).format('dddd D MMMM');
  return (
    <section aria-labelledby="tb-annonce" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-13 text-ink-3">Annonce du dimanche</span>
        {sheet.items.length > 0 && <Badge tone="neutral">{scheduled > 0 ? `${scheduled} programmée${scheduled > 1 ? 's' : ''}` : 'Publiée'}</Badge>}
      </div>
      <h2 id="tb-annonce" className="m-0 mt-2 text-18 font-semibold text-ink">
        {title.charAt(0).toUpperCase()}
        {title.slice(1)}
      </h2>
      <p className="m-0 mt-0.5 text-14 text-ink-2">{sheet.items.length ? plural(sheet.items.length, 'annonce', 'annonces') : 'Aucune annonce pour l’instant'}</p>
      {sheet.items.length > 0 && (
        <ul className="m-0 mt-3 list-none p-0">
          {sheet.items.slice(0, SHOWN).map((item) => (
            <li key={item.id} className="flex gap-2.5 border-t border-line py-2 text-14 text-ink">
              <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ink-4" />
              {item.title}
            </li>
          ))}
          {sheet.items.length > SHOWN && (
            <li className="border-t border-line pt-2 text-13 text-ink-3">
              Et {plural(sheet.items.length - SHOWN, 'autre annonce', 'autres annonces')}
            </li>
          )}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <Button asChild variant="outline" className="flex-1 text-14">
          <NextLink href={paths.espace.annonces.nouvelle.getHref(nodeId)}>Nouvelle annonce</NextLink>
        </Button>
        <Button asChild variant="outline" className="px-3.5 text-14">
          <NextLink href={paths.espace.annonces.feuille.getHref(nodeId, sheet.sunday)} aria-label="Aperçu de la feuille d’annonces">
            Aperçu
          </NextLink>
        </Button>
      </div>
    </section>
  );
};
