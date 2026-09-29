'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { parishLabel } from '@/utils/parish-name';

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
    <article className="flex break-inside-avoid gap-4 border-t border-line px-5 py-5 first:border-t-0 sm:px-6">
      <span aria-hidden="true" className="tnum inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tint-100 text-13 font-semibold text-tint-800">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-18 font-semibold text-ink">{frenchTypo(item.title)}</h3>
        {(item.scope.place_name || item.status === 'scheduled') && (
          <p className="m-0 mt-0.5 text-13 text-ink-3">
            {item.scope.place_name}
            {item.scope.place_name && item.status === 'scheduled' && ' · '}
            {item.status === 'scheduled' && <span className="print:hidden">programmée, pas encore publiée</span>}
          </p>
        )}
        {/* HTML assaini par DOMPurify (liste blanche de l'éditeur). */}
        <div
          className="mt-2 max-w-reading text-16 leading-relaxed text-ink [&_blockquote]:italic [&_h2]:text-18 [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
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
    <div>
      <TopbarContent start={<Breadcrumbs separator="slash" items={[{ label: 'Annonces', href: paths.espace.annonces.list.getHref(nodeId) }, { label: 'Feuille d’annonces' }]} />} />
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 print:block">
        <div className="min-w-0">
          <h1 id="feuille-titre" className="m-0 text-32 font-semibold text-ink">
            {sheet.data ? `Annonces du ${sundayLabel(sheet.data.sunday).replace(/^D/, 'd')}` : 'Feuille d’annonces'}
          </h1>
          <p className="m-0 mt-1 text-16 text-ink-2">
            {sheet.data ? `${parishLabel(sheet.data.node_name)} · à lire à la fin des messes` : 'À lire à la fin des messes'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <div className="flex w-64 flex-col gap-2">
            <label htmlFor={selectId} className="text-14 font-medium text-ink">
              Dimanche
            </label>
            <Select
              id={selectId}
              controlSize="sm"
              value={current ?? ''}
              onChange={(e) => router.replace(paths.espace.annonces.feuille.getHref(nodeId, e.target.value))}
              className="text-15"
            >
              {choices.map((d) => (
                <option key={d} value={d}>
                  {sundayLabel(d)}
                </option>
              ))}
            </Select>
          </div>
          <Button className="min-h-11 px-5" onClick={() => window.print()} disabled={!sheet.data || sheet.data.items.length === 0}>
            <Icon name="imprimer" size={18} /> Imprimer
          </Button>
        </div>
      </header>

      {sheet.isPending ? (
        <div className="py-6">
          <LoadingBlock label="Chargement de la feuille d’annonces…" lines={5} />
        </div>
      ) : sheet.isError ? (
        <EmptyState icon={isForbidden(sheet.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(sheet.error) ? 'Accès refusé' : 'Feuille indisponible'} className="mt-6">
          {apiErrorMessage(sheet.error)}
        </EmptyState>
      ) : (
        <section aria-labelledby="feuille-titre" className="mt-8 flex flex-col gap-6 print:mt-4">
          {sheet.data.items.length === 0 ? (
            <EmptyState icon="annonce" title="Aucune annonce pour ce dimanche" className="rounded-16 border border-line">
              Cochez « Annonce du dimanche » dans l’éditeur pour qu’une annonce figure sur la feuille.
            </EmptyState>
          ) : (
            groupByNode(sheet.data.items).map((group, g) => (
              <div key={`${group.node}-${g}`} className="overflow-hidden rounded-16 border border-line bg-paper shadow-card print:rounded-none print:border-0 print:shadow-none">
                {g > 0 && (
                  <h2 className="m-0 border-b border-line bg-surface px-5 py-3 text-16 font-semibold text-ink sm:px-6">De la part de : {group.node}</h2>
                )}
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
