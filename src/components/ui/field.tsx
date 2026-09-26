import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type FieldProps = {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  /** Affiche « (facultatif) » après le libellé (maquettes : seuls les champs facultatifs sont signalés). */
  optional?: boolean;
  /** Élément aligné à droite du libellé (ex. lien « Mot de passe oublié ? »). */
  labelAside?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  success?: React.ReactNode;
  counter?: { value: number; max: number };
  className?: string;
  /** Le contrôle ; reçoit id, aria-describedby et aria-invalid. */
  children: React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
};

/**
 * Champ de formulaire (WEB-Design-System, « Champs et états ») : libellé 14/500 toujours visible
 * au-dessus du champ, aide 13/18 en ink3, erreur sous le champ avec icône (jamais la couleur seule).
 */
export const Field = ({ id, label, required, optional, labelAside, hint, error, success, counter, className, children }: FieldProps) => {
  const hintId = `${id}-aide`;
  const messageId = `${id}-message`;
  const describedBy = [error || success ? messageId : null, hint || counter ? hintId : null].filter(Boolean).join(' ');
  const labelNode = (
    <label htmlFor={id} className="text-14 font-medium text-ink">
      {label}
      {optional && <span className="font-normal text-ink-3"> (facultatif)</span>}
      {required && <span className="sr-only"> (obligatoire)</span>}
    </label>
  );
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {labelAside ? (
        <div className="flex items-baseline justify-between gap-4">
          {labelNode}
          <span className="text-14 font-semibold">{labelAside}</span>
        </div>
      ) : (
        labelNode
      )}
      {React.cloneElement(children, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="m-0 -mt-0.5 flex gap-1.5 text-13 text-err">
          <Icon name="erreur" size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : success ? (
        <p id={messageId} className="m-0 -mt-0.5 flex gap-1.5 text-13 text-ok">
          <Icon name="check" size={14} className="mt-0.5 shrink-0" />
          {success}
        </p>
      ) : null}
      {(hint || counter) && (
        <p id={hintId} className="m-0 -mt-0.5 flex justify-between gap-4 text-13 text-ink-3">
          <span>{hint}</span>
          {counter && (
            <span className="tnum">
              {counter.value} / {counter.max}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

/**
 * Hauteur et fond des champs selon l'espace (relevés des maquettes) :
 * - `lg` 52 px, fond paper : pages publiques, inscription, connexion (défaut) ;
 * - `md` 48 px, fond surface : formulaires de l'espace fidèle (FID-Demande-Nouvelle, FID-Profil) ;
 * - `sm` 44 px, fond paper : back-office (PAR-Parametres, PAR-Annonce-Editeur).
 */
export type ControlSize = 'lg' | 'md' | 'sm';

export const CONTROL_HEIGHT: Record<ControlSize, string> = { lg: 'h-13', md: 'h-12', sm: 'h-11' };

/**
 * Classes communes des contrôles : rayon 12, bordure lineField ; focus et erreur à 2 px
 * (bordure + filet intérieur de 1 px, sans décalage du texte) ; désactivé en surface2.
 */
export const controlClasses = (invalid?: boolean, valid?: boolean, size: ControlSize = 'lg') =>
  cn(
    'w-full rounded-12 border text-16 text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-ink-3',
    size === 'lg' ? 'px-4' : 'px-3.5',
    size === 'md' ? 'bg-surface' : 'bg-paper',
    invalid
      ? 'border-err-line ring-1 ring-inset ring-err-line'
      : 'border-line-field focus:border-primary focus:ring-1 focus:ring-inset focus:ring-primary',
    // Valide : la bordure reste neutre, la coche okT est posée par <Input valid>.
    valid && !invalid && 'pr-11',
  );
