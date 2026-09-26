'use client';

import { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Place } from '@/hooks/use-backoffice-places';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useNewsCategories } from '../api/get-news-categories';
import type { StaffArticle } from '../api/staff-article';
import { sanitizeArticleHtml } from '../utils/sanitize-html';
import { nextSundays, sundayLabel } from '../utils/sundays';

import type { EditorValues } from './editor-schema';

const PanelHeading = ({ number, children }: { number: string; children: React.ReactNode }) => (
  <p className="tnum m-0 border-t border-line-strong pt-2 text-meta text-ink-2">
    <span className="text-primary">{number}</span> — {children}
  </p>
);

const Segmented = ({ form }: { form: UseFormReturn<EditorValues> }) => (
  <fieldset className="m-0 border-0 p-0">
    <legend className="mb-2 text-sm font-semibold text-ink">Type</legend>
    <div className="grid grid-cols-2 rounded border border-ink">
      {(
        [
          ['announcement', 'Annonce'],
          ['article', 'Article'],
        ] as const
      ).map(([value, label]) => (
        <label key={value} className="cursor-pointer">
          <input type="radio" value={value} {...form.register('content_type')} className="peer sr-only" />
          <span className="flex h-11 items-center justify-center text-base text-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
            {label}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

/** Aperçu « Ma paroisse » sur téléphone, et aperçu complet du corps assaini. */
const MobilePreview = ({ values }: { values: Pick<EditorValues, 'title' | 'excerpt' | 'content' | 'is_sunday_notice' | 'sunday_date'> }) => {
  const [open, setOpen] = useState(false);
  const kicker = values.is_sunday_notice && values.sunday_date ? `Dim. ${dayjs(values.sunday_date).format('DD.MM')}` : 'Annonce';
  return (
    <>
      <div className="flex items-baseline justify-between">
        <PanelHeading number="06">Aperçu mobile</PanelHeading>
      </div>
      <div className="mx-auto w-full max-w-[280px] rounded border border-line-strong bg-paper p-4">
        <p className="tnum m-0 text-meta text-primary">{kicker}</p>
        <p className="m-0 mt-2 font-serif text-h4 text-ink">{values.title ? frenchTypo(values.title) : 'Titre de l’annonce'}</p>
        {values.excerpt && <p className="m-0 mt-2 line-clamp-3 text-sm text-ink-2">{frenchTypo(values.excerpt)}</p>}
      </div>
      <p className="m-0 text-center text-xs text-ink-3">Vue « Ma paroisse » sur un téléphone.</p>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Aperçu complet
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={values.title || 'Aperçu'} description={values.excerpt || undefined} size="lg">
        {/* HTML assaini par DOMPurify (sanitizeArticleHtml) : aucune balise ni attribut hors liste blanche. */}
        <div
          className="max-w-reading text-body text-ink [&_a]:text-primary [&_blockquote]:font-serif [&_blockquote]:italic [&_h2]:font-serif [&_h2]:text-h3 [&_h3]:font-serif [&_h3]:text-h4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(values.content) }}
        />
      </Modal>
    </>
  );
};

type PublicationPanelProps = {
  form: UseFormReturn<EditorValues>;
  article: StaffArticle | null;
  places: Place[];
  onDelete: () => void;
};

/** Panneau de droite de l'éditeur : type, dimanche, catégorie, portée, programmation, aperçu. */
export const PublicationPanel = ({ form, article, places, onDelete }: PublicationPanelProps) => {
  const { register, control, watch, formState } = form;
  const categories = useNewsCategories();
  const values = watch();
  const sundays = nextSundays(dayjs());
  const sundayOptions = values.sunday_date && !sundays.includes(values.sunday_date) ? [values.sunday_date, ...sundays] : sundays;
  const status = article?.status ?? 'draft';
  const canDelete = article !== null && (status === 'draft' || status === 'unpublished');
  const canSchedule = status !== 'published';

  return (
    <aside aria-label="Publication" className="flex flex-col gap-5 lg:col-span-4">
      <PanelHeading number="04">Publication</PanelHeading>
      <Segmented form={form} />
      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="is_sunday_notice"
          render={({ field }) => (
            <Switch id="ed-dim" checked={field.value} onCheckedChange={field.onChange} label="Annonce du dimanche" />
          )}
        />
        <p className="m-0 text-sm text-ink-3">Placée en tête de « Ma paroisse » et dans la feuille lue à la fin des messes.</p>
      </div>
      {values.is_sunday_notice && (
        <Field id="ed-date-dim" label="Dimanche concerné" required error={formState.errors.sunday_date?.message}>
          <Select {...register('sunday_date')}>
            <option value="">Choisir un dimanche</option>
            {sundayOptions.map((d) => (
              <option key={d} value={d}>
                {sundayLabel(d)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field id="ed-categorie" label="Catégorie" required error={formState.errors.category_id?.message}>
        <Select {...register('category_id')} disabled={categories.isPending}>
          <option value="">{categories.isError ? 'Catégories indisponibles' : 'Choisir une catégorie'}</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ed-portee" label="Portée" hint="Toute la paroisse, ou un seul lieu de culte." error={formState.errors.place_id?.message}>
        <Select {...register('place_id')}>
          <option value="">{article?.scope.node_name ?? 'Toute la paroisse'}</option>
          {places.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      {canSchedule && (
        <>
          <PanelHeading number="05">Programmation</PanelHeading>
          <fieldset className="m-0 flex gap-6 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-ink">Moment de publication</legend>
            <label className="flex h-11 cursor-pointer items-center gap-2 text-base text-ink">
              <input type="radio" value="now" {...register('when')} className="size-5" /> Maintenant
            </label>
            <label className="flex h-11 cursor-pointer items-center gap-2 text-base text-ink">
              <input type="radio" value="schedule" {...register('when')} className="size-5" /> Programmer
            </label>
          </fieldset>
          {values.when === 'schedule' && (
            <div className={cn('grid grid-cols-[minmax(0,1fr)_120px] gap-3')}>
              <Field id="ed-jour" label="Date" error={formState.errors.publish_date?.message}>
                <Input type="date" {...register('publish_date')} />
              </Field>
              <Field id="ed-heure" label="Heure">
                <Input type="time" {...register('publish_time')} />
              </Field>
            </div>
          )}
          <Controller
            control={control}
            name="notify_followers"
            render={({ field }) => (
              <Switch
                id="ed-notifier"
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Notifier les fidèles rattachés"
                description="Une seule notification, à l’heure de publication. Chacun garde ses préférences et sa plage de silence."
              />
            )}
          />
        </>
      )}

      <MobilePreview values={values} />

      {canDelete && (
        <div className="border-t border-line pt-4">
          <Button variant="danger" size="sm" onClick={onDelete}>
            Supprimer le brouillon
          </Button>
        </div>
      )}
    </aside>
  );
};
