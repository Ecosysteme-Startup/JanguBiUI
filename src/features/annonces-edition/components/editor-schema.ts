import { z } from 'zod';

import { htmlToText } from '../utils/sanitize-html';
import { isSunday } from '../utils/sundays';

export const TITLE_MAX = 90;
export const EXCERPT_MAX = 280;
export const COVER_ALT_MAX = 250;

/** Formulaire de l'éditeur. Les limites de la maquette sont plus strictes que celles du serveur (200 / 400). */
export const editorSchema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire.').max(TITLE_MAX, `${TITLE_MAX} caractères au plus.`),
    excerpt: z.string().max(EXCERPT_MAX, `${EXCERPT_MAX} caractères au plus.`),
    content: z.string().refine((html) => htmlToText(html).length > 0, 'Le corps de l’annonce est vide.'),
    content_type: z.enum(['announcement', 'article']),
    is_sunday_notice: z.boolean(),
    sunday_date: z.string(),
    category_id: z.string().min(1, 'Choisissez une catégorie.'),
    place_id: z.string(),
    cover_image_id: z.number().nullable(),
    cover_image_url: z.string().nullable(),
    cover_image_alt: z.string().max(COVER_ALT_MAX, `${COVER_ALT_MAX} caractères au plus.`),
    cover_image_decorative: z.boolean(),
    notify_followers: z.boolean(),
    when: z.enum(['now', 'schedule']),
    publish_date: z.string(),
    publish_time: z.string(),
  })
  .superRefine((values, ctx) => {
    // Bannière non décorative : son texte alternatif est requis (lecteurs d'écran, WCAG 1.1.1).
    if (values.cover_image_id !== null && !values.cover_image_decorative && !values.cover_image_alt.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['cover_image_alt'],
        message: 'Décrivez la bannière, ou indiquez qu’elle est décorative.',
      });
    if (!values.is_sunday_notice) return;
    if (!values.sunday_date) ctx.addIssue({ code: 'custom', path: ['sunday_date'], message: 'Indiquez le dimanche concerné.' });
    else if (!isSunday(values.sunday_date))
      ctx.addIssue({ code: 'custom', path: ['sunday_date'], message: 'La date d’une annonce du dimanche doit être un dimanche.' });
  });

export type EditorValues = z.infer<typeof editorSchema>;
