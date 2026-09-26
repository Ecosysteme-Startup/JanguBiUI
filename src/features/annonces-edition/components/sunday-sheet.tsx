'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type SundaySheetItem, useSundaySheet } from '../api/get-sunday-sheet';
import { sanitizeArticleHtml, textToHtml } from '../utils/sanitize-html';
import { nextSundays, sundayLabel } from '../utils/sundays';

/** Les annonces groupées par nœud émetteur, dans l'ordre du serveur (la paroisse, puis le diocèse…). */
const groupByNode = (items: SundaySheetItem[]) =>
  items.reduce<{ node: string; items: SundaySheetItem[] }[]>((groups, item) => {
    const node = item.scope.node_name ?? 'Jàngu Bi';
    const last = groups[groups.length - 1];
    return last && last.node === node ? [...groups.slice(0, -1), { node, items: [...last.items, item] }] : [...groups, { node, items: [item] }];
  }, []);

const SheetItem = ({ item, index }: { item: SundaySheetItem; index: number }) => {
  const html = item.content_format === 'html' ? sanitizeArticleHtml(item.content) : textToHtml(item.content);
  return (
    <article className="break-inside-avoid border-b border-line py-5">
      <p className="tnum m-0 text-meta text-ink-3">
        <span className="text-primary">{String(index + 1).padStart(2, '0')}</span>
        {item.scope.place_name && <> — {item.scope.place_name}</>}
        {item.status === 'scheduled' && <span className="print:hidden"> · programmée, pas encore publiée</span>}
      </p>
      <h3 className="m-0 mt-1 font-serif text-h4 font-normal text-ink">{frenchTypo(item.title)}</h3>
      {/* HTML assaini par DOMPurify (liste blanche de l'éditeur). */}
      <div
        className="mt-2 max-w-reading text-body text-ink [&_blockquote]:font-serif [&_blockquote]:italic [&_h2]:font-serif [&_h2]:text-h4 [&_h3]:font-serif [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
};

/**
 * Feuille d'annonces d'un dimanche (PAR-Annonces, « Feuille d'annonces ») : document à imprimer,
 * lu à la fin des messes. L'impression passe par le navigateur (CSS print), pas par un PDF serveur.
 */
export const SundaySheetView = ({ nodeId, sunday }: { nodeId: string; sunday?: string }) => {
  const router = useRouter();
  const selectId = useId();
  const sheet = useSundaySheet(nodeId, sunday);
  const current = sheet.data?.sunday ?? sunday;
  const options = nextSundays(dayjs().subtract(21, 'day'), 10);
  const choices = current && !options.includes(current) ? [current, ...options] : options;

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <NextLink href={paths.espace.annonces.list.getHref(nodeId)} className="inline-flex h-11 items-center gap-2 text-sm font-medium">
          <Icon name="fleche-gauche" size={16} /> Retour · Annonces
        </NextLink>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={selectId} className="text-sm font-semibold text-ink">
              Dimanche
            </label>
            <select
              id={selectId}
              value={current ?? ''}
              onChange={(e) => router.replace(paths.espace.annonces.feuille.getHref(nodeId, e.target.value))}
              className="h-11 rounded border border-line-field bg-surface pl-3 pr-8 text-base text-ink"
            >
              {choices.map((d) => (
                <option key={d} value={d}>
                  {sundayLabel(d)}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => window.print()} disabled={!sheet.data || sheet.data.items.length === 0}>
            <Icon name="document" size={16} /> Imprimer
          </Button>
        </div>
      </div>

      {sheet.isPending ? (
        <div className="py-6">
          <LoadingBlock label="Chargement de la feuille d’annonces…" lines={5} />
        </div>
      ) : sheet.isError ? (
        <EmptyState icon={isForbidden(sheet.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(sheet.error) ? 'Accès refusé' : 'Feuille indisponible'} className="mt-6">
          {apiErrorMessage(sheet.error)}
        </EmptyState>
      ) : (
        <section aria-labelledby="feuille-titre" className="mt-8 print:mt-0">
          <p className="tnum m-0 text-meta text-ink-2">Paroisse {sheet.data.node_name}</p>
          <h1 id="feuille-titre" className="m-0 mt-2 font-serif text-title font-normal text-ink">
            Annonces du {sundayLabel(sheet.data.sunday).replace(/^D/, 'd')}
          </h1>
          {sheet.data.items.length === 0 ? (
            <EmptyState icon="annonce" title="Aucune annonce pour ce dimanche" className="mt-6">
              Cochez « Annonce du dimanche » dans l’éditeur pour qu’une annonce figure sur la feuille.
            </EmptyState>
          ) : (
            groupByNode(sheet.data.items).map((group, g) => (
              <div key={`${group.node}-${g}`} className="mt-6">
                {g > 0 && <h2 className="m-0 border-t border-line-strong pt-4 font-serif text-h4 font-normal text-ink-2">De la part de : {group.node}</h2>}
                {group.items.map((item, i) => (
                  <SheetItem key={item.id} item={item} index={i} />
                ))}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
};
