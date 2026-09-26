'use client';

import { lazy, Suspense } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PLACE_KIND_LABELS, type Place } from '@/hooks/use-backoffice-places';
import { cn } from '@/utils/cn';

import { useNewsCategories } from '../api/get-news-categories';

import { CoverAltFields } from './cover-alt-fields';
import { CoverPicker } from './cover-picker';
import { EXCERPT_MAX, type EditorValues, TITLE_MAX } from './editor-schema';

const RichTextEditor = lazy(() => import('./rich-text-editor'));

/** Compteur à droite du libellé (« 31 / 80 »), 13 px ink3. */
const Counter = ({ value, max }: { value: number; max: number }) => (
  <span className="tnum text-13 font-normal text-ink-3">
    {value} / {max}
  </span>
);

const Required = () => (
  <span aria-hidden="true" className="text-err">
    {' '}
    *
  </span>
);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} role="alert" className="m-0 flex gap-1.5 text-13 text-err">
      <Icon name="erreur" size={14} className="mt-0.5 shrink-0" />
      {message}
    </p>
  ) : null;

/** Catégories en pilules (choix unique) : pilule 36 px, choisie en aplat d'encre avec coche. */
const CategoryChips = ({ form }: { form: UseFormReturn<EditorValues> }) => {
  const categories = useNewsCategories();
  const value = form.watch('category_id');
  const error = form.formState.errors.category_id?.message;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" aria-describedby={error ? 'ed-categorie-erreur' : undefined}>
      <legend className="mb-2 p-0 text-14 font-medium text-ink">
        Catégorie
        <Required />
      </legend>
      {categories.isError ? (
        <p className="m-0 text-14 text-err">Catégories indisponibles.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((c) => {
            const checked = value === String(c.id);
            return (
              <label key={c.id} className="relative cursor-pointer">
                <input type="radio" value={String(c.id)} {...form.register('category_id')} className="peer sr-only" />
                <span
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-14 transition-colors',
                    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
                    checked ? 'border-inverse bg-inverse font-semibold text-on-inverse' : 'border-line bg-paper font-medium text-ink hover:border-line-field hover:bg-surface',
                  )}
                >
                  {checked && <Icon name="check" size={16} strokeWidth={2.25} />}
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <FieldError id="ed-categorie-erreur" message={error} />
    </fieldset>
  );
};

/** Lieu concerné : toute la paroisse ou un lieu de culte, en cartes à cocher (choix unique). */
const PlaceCards = ({ form, places, nodeLabel }: { form: UseFormReturn<EditorValues>; places: Place[]; nodeLabel: string }) => {
  const value = form.watch('place_id');
  const options = [
    { value: '', name: nodeLabel, meta: 'Tous les lieux de culte' },
    ...places.map((p) => ({ value: String(p.id), name: p.name, meta: [PLACE_KIND_LABELS[p.kind], p.city].filter(Boolean).join(' · ') })),
  ];
  return (
    <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
      <legend className="mb-2 p-0 text-14 font-medium text-ink">Lieu concerné</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value || 'tout'}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-12 border px-3.5 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
                checked ? 'border-line-active bg-tint-50' : 'border-line bg-paper hover:border-line-active',
              )}
            >
              <input type="radio" value={o.value} {...form.register('place_id')} className="peer sr-only" />
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                  checked ? 'bg-primary-fill text-on-primary' : 'border-1.5 border-line-field bg-paper',
                )}
              >
                {checked && <span className="size-2 rounded-full bg-on-primary" />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-15 font-medium text-ink">{o.name}</span>
                {o.meta && <span className="text-13 text-ink-3">{o.meta}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id="ed-lieu-erreur" message={form.formState.errors.place_id?.message} />
    </fieldset>
  );
};

type ContentFieldsProps = { form: UseFormReturn<EditorValues>; places: Place[]; nodeLabel: string };

/** Carte « Contenu de l'annonce » de PAR-Annonce-Editeur. */
export const ContentFields = ({ form, places, nodeLabel }: ContentFieldsProps) => {
  const { register, control, watch, setValue, formState } = form;
  const title = watch('title');
  const excerpt = watch('excerpt');
  return (
    <section aria-label="Contenu de l’annonce" className="flex min-w-0 flex-col gap-6 rounded-16 border border-line bg-paper p-5 shadow-card sm:p-6">
      <Field
        id="ed-titre"
        required
        label={
          <>
            Titre
            <Required />
          </>
        }
        labelAside={<Counter value={title.length} max={TITLE_MAX} />}
        error={formState.errors.title?.message}
      >
        <Input {...register('title')} controlSize="sm" className="text-15" />
      </Field>

      <CategoryChips form={form} />

      <div className="flex flex-col gap-2">
        <span className="text-14 font-medium text-ink">Type de contenu</span>
        <Controller
          control={control}
          name="content_type"
          render={({ field }) => (
            <SegmentedControl
              label="Type de contenu"
              value={field.value}
              onChange={field.onChange}
              options={[
                ['announcement', 'Annonce'],
                ['article', 'Article'],
              ]}
              className="self-start"
            />
          )}
        />
      </div>

      <Field
        id="ed-chapo"
        label="Chapô"
        optional
        labelAside={<Counter value={excerpt.length} max={EXCERPT_MAX} />}
        hint="Repris dans la liste des annonces et dans la notification envoyée aux fidèles."
        error={formState.errors.excerpt?.message}
      >
        <Textarea {...register('excerpt')} rows={2} className="text-15" />
      </Field>

      <div className="flex flex-col gap-2">
        <span id="ed-corps-titre" className="text-14 font-medium text-ink">
          Texte
          <Required />
        </span>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <Suspense fallback={<Skeleton className="h-60 w-full" />}>
              <RichTextEditor
                id="ed-corps"
                label="Corps de l’annonce"
                initialHtml={field.value}
                onChange={(html) => setValue('content', html, { shouldValidate: formState.isSubmitted, shouldDirty: true })}
                invalid={Boolean(fieldState.error)}
                describedBy={fieldState.error ? 'ed-corps-erreur' : 'ed-corps-aide'}
              />
            </Suspense>
          )}
        />
        <FieldError id="ed-corps-erreur" message={formState.errors.content?.message} />
        <p id="ed-corps-aide" className="m-0 text-13 text-ink-3">
          Évitez les majuscules et les numéros personnels.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-14 font-medium text-ink">
          Bannière <span className="font-normal text-ink-3">(facultatif)</span>
        </span>
        <Controller
          control={control}
          name="cover_image_id"
          render={({ field, fieldState }) => (
            <CoverPicker
              id="ed-banniere"
              value={{ id: field.value, url: watch('cover_image_url') }}
              alt={watch('cover_image_decorative') ? '' : watch('cover_image_alt')}
              error={fieldState.error?.message}
              onChange={(cover) => {
                field.onChange(cover.id);
                setValue('cover_image_url', cover.url, { shouldDirty: true });
              }}
            />
          )}
        />
        {watch('cover_image_id') !== null && <CoverAltFields form={form} />}
      </div>

      <PlaceCards form={form} places={places} nodeLabel={nodeLabel} />
    </section>
  );
};
