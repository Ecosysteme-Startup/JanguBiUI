'use client';

import type { UseFormReturn } from 'react-hook-form';

import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { COVER_ALT_MAX, type EditorValues } from './editor-schema';

/**
 * Texte alternatif de la bannière (PAR-Annonce-Editeur §03) : ce qu'un lecteur d'écran lit à la
 * place de l'image. Une bannière purement décorative n'en a pas (alternative vide).
 */
export const CoverAltFields = ({ form }: { form: UseFormReturn<EditorValues> }) => {
  const { register, watch, formState } = form;
  const decorative = watch('cover_image_decorative');
  const alt = watch('cover_image_alt');
  return (
    <div className="flex flex-col gap-3">
      {!decorative && (
        <Field
          id="ed-banniere-alt"
          label="Texte alternatif"
          required
          hint="Décrivez ce que montre la photo en une phrase, ex. « Parvis de Saint-Dominique à la sortie de la messe de 11 h 30 »."
          error={formState.errors.cover_image_alt?.message}
          counter={{ value: alt.length, max: COVER_ALT_MAX }}
        >
          <Input {...register('cover_image_alt')} />
        </Field>
      )}
      <Choice
        {...register('cover_image_decorative')}
        label="Image décorative"
        description="Elle n’apporte aucune information : les lecteurs d’écran l’ignorent."
      />
    </div>
  );
};
