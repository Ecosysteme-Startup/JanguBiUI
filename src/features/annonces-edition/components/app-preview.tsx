'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { ofParish } from '@/utils/parish-name';

import { useNewsCategories } from '../api/get-news-categories';
import { htmlToText, sanitizeArticleHtml } from '../utils/sanitize-html';

import type { EditorValues } from './editor-schema';

const excerptOf = (values: Pick<EditorValues, 'excerpt' | 'content'>) => values.excerpt.trim() || htmlToText(values.content);

/**
 * « Aperçu dans l'application » (PAR-Annonce-Editeur) : la carte telle que la liste « Ma paroisse »
 * l'affiche, puis la notification envoyée aux fidèles, et l'aperçu complet du texte assaini.
 */
export const AppPreview = ({ form, nodeName }: { form: UseFormReturn<EditorValues>; nodeName: string }) => {
  const [open, setOpen] = useState(false);
  const categories = useNewsCategories();
  const values = form.watch();
  const category = (categories.data ?? []).find((c) => String(c.id) === values.category_id)?.name;
  const at = values.when === 'schedule' && values.publish_date ? dayjs(`${values.publish_date}T${values.publish_time || '00:00'}`) : dayjs();
  const kicker = [
    values.is_sunday_notice && values.sunday_date ? `Dim. ${dayjs(values.sunday_date).format('D MMM')}` : at.format('D MMM'),
    category,
  ]
    .filter(Boolean)
    .join(' · ');
  const title = values.title.trim() ? frenchTypo(values.title) : 'Titre de l’annonce';
  const excerpt = frenchTypo(excerptOf(values));

  return (
    <div className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <h2 className="m-0 text-16 font-semibold text-ink">Aperçu dans l’application</h2>
      <div className="mt-4 rounded-16 border border-line bg-surface px-4 py-5">
        <p className="m-0 mb-3 text-13 font-medium text-ink-3">Annonces {ofParish(nodeName)}</p>
        <article className="rounded-16 border border-line bg-paper p-4 shadow-card">
          <p className="tnum m-0 text-13 text-ink-3">{kicker}</p>
          <h3 className="m-0 mt-2 break-words font-serif text-20 font-semibold text-ink">{title}</h3>
          {excerpt && <p className="m-0 mt-1.5 line-clamp-3 text-14 text-ink-2">{excerpt}</p>}
        </article>
        {values.notify_followers && (
          <>
            <p className="m-0 mb-2 mt-5 text-13 font-medium text-ink-3">Notification</p>
            <div className="flex gap-3 rounded-14 border border-line bg-paper px-3.5 py-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-8 bg-primary-fill text-on-primary">
                <Icon name="livre" size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="tnum flex justify-between gap-2 text-13 text-ink-3">
                  <span className="truncate">Jàngu Bi · {nodeName}</span>
                  <span>{at.format('H:mm')}</span>
                </span>
                <span className="mt-0.5 text-14 font-semibold text-ink">{title}</span>
                {excerpt && <span className="line-clamp-2 text-14 text-ink-2">{excerpt}</span>}
              </span>
            </div>
          </>
        )}
      </div>
      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <Icon name="oeil" size={16} /> Aperçu complet
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={values.title || 'Aperçu'} description={values.excerpt || undefined} size="lg">
        {/* HTML assaini par DOMPurify (sanitizeArticleHtml) : aucune balise ni attribut hors liste blanche. */}
        <div
          className="max-w-reading text-16 text-ink [&_a]:text-primary [&_blockquote]:font-serif [&_blockquote]:italic [&_h2]:text-24 [&_h2]:font-semibold [&_h3]:text-20 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(values.content) }}
        />
      </Modal>
    </div>
  );
};
