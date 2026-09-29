'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { type NoeudStaff, libelleTypeNoeud } from '@/lib/staff/capacites';

import {
  type ContenuInput,
  LIBELLES_TYPE,
  TYPES_CONTENU,
  useCategoriesStaff,
} from '../api/staff-articles';

const articleFormSchema = z
  .object({
    node_id: z.string().optional(),
    title: z.string().min(1, 'Le titre est requis').max(200),
    content: z.string().min(1, 'Le texte est requis'),
    excerpt: z.string().max(400).optional(),
    category_id: z.coerce.number().min(1, 'La catégorie est requise'),
    content_type: z.enum(TYPES_CONTENU),
    is_sunday_notice: z.boolean(),
    sunday_date: z.string().optional(),
    notify_followers: z.boolean(),
  })
  .refine((v) => !v.is_sunday_notice || !!v.sunday_date, {
    path: ['sunday_date'],
    message: 'Indiquez le dimanche concerné',
  });

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface ArticleFormProps {
  defaultValues?: Partial<ArticleFormValues>;
  /** Communautés où la personne publie (création seulement). */
  noeuds?: NoeudStaff[];
  onSubmit: (data: ArticleFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50';

/** Éditeur d'annonce ou d'article (création et modification). */
export function ArticleForm({
  defaultValues,
  noeuds,
  onSubmit,
  isSubmitting,
  submitLabel = 'Enregistrer',
}: ArticleFormProps) {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategoriesStaff();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof articleFormSchema>, unknown, ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      content_type: 'announcement',
      is_sunday_notice: false,
      notify_followers: true,
      node_id: noeuds?.[0]?.id,
      ...defaultValues,
    },
  });

  const dominical = watch('is_sunday_notice');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {noeuds && noeuds.length > 1 && (
        <div className="space-y-2">
          <label htmlFor="form-node" className="block text-sm font-medium">
            Communauté <span className="text-destructive">*</span>
          </label>
          <select id="form-node" {...register('node_id')} className={champ}>
            {noeuds.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({libelleTypeNoeud(n.type)})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="form-title" className="block text-sm font-medium">
          Titre <span className="text-destructive">*</span>
        </label>
        <input
          id="form-title"
          {...register('title')}
          className={champ}
          placeholder="Titre de l’annonce"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="form-content-type"
            className="block text-sm font-medium"
          >
            Type de contenu <span className="text-destructive">*</span>
          </label>
          <select
            id="form-content-type"
            {...register('content_type')}
            className={champ}
          >
            {TYPES_CONTENU.map((t) => (
              <option key={t} value={t}>
                {LIBELLES_TYPE[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="form-category" className="block text-sm font-medium">
            Catégorie <span className="text-destructive">*</span>
          </label>
          <select
            id="form-category"
            {...register('category_id')}
            disabled={categoriesLoading}
            className={champ}
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-destructive">
              {errors.category_id.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="form-excerpt" className="block text-sm font-medium">
          Chapô
        </label>
        <textarea
          id="form-excerpt"
          {...register('excerpt')}
          rows={2}
          className={champ}
          placeholder="Deux lignes affichées dans le fil (400 caractères au plus)"
        />
        {errors.excerpt && (
          <p className="text-xs text-destructive">{errors.excerpt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="form-content" className="block text-sm font-medium">
          Texte <span className="text-destructive">*</span>
        </label>
        <textarea
          id="form-content"
          {...register('content')}
          rows={12}
          className={champ}
        />
        {errors.content && (
          <p className="text-xs text-destructive">{errors.content.message}</p>
        )}
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Diffusion</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_sunday_notice')} />
          Annonce du dimanche (feuille dominicale)
        </label>
        {dominical && (
          <div className="space-y-1">
            <label htmlFor="form-sunday" className="block text-sm">
              Dimanche concerné
            </label>
            <input
              id="form-sunday"
              type="date"
              {...register('sunday_date')}
              className={champ}
            />
            {errors.sunday_date && (
              <p className="text-xs text-destructive">
                {errors.sunday_date.message}
              </p>
            )}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('notify_followers')} />
          Prévenir les fidèles à la publication
        </label>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(paths.app.admin.articles.getHref())}
        >
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Corps envoyé au back à partir des valeurs du formulaire. */
export const versContenuInput = (
  v: ArticleFormValues,
): Omit<ContenuInput, 'node_id'> => ({
  content_type: v.content_type,
  title: v.title,
  excerpt: v.excerpt ?? '',
  content: v.content,
  category_id: v.category_id,
  is_sunday_notice: v.is_sunday_notice,
  sunday_date: v.is_sunday_notice ? (v.sunday_date ?? null) : null,
  notify_followers: v.notify_followers,
});
