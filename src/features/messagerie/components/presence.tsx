import { cn } from '@/utils/cn';

import type { LibellePresence } from '../utils/format-presence';

/**
 * « En ligne » : pastille 8 px + texte dans la même couleur (jamais la couleur
 * seule) ; « Vu … » : texte seul, discret. Rien quand la présence est masquée.
 * Pas d'`aria-live` : un changement de présence n'interrompt pas la lecture.
 */
export function PresenceTexte({
  libelle,
  className,
}: {
  libelle: LibellePresence | null;
  className?: string;
}) {
  if (!libelle) return null;
  if (libelle.etat === 'en_ligne') {
    return (
      <span
        data-presence="en_ligne"
        className={cn(
          'inline-flex items-center gap-1.5 text-13 font-medium text-ok',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-ok-dot"
        />
        En ligne
      </span>
    );
  }
  return (
    <span data-presence="vu" className={cn('text-13 text-ink-3', className)}>
      {libelle.texte}
    </span>
  );
}

/** Point sur l'avatar (décoratif : le texte porte l'information). */
export function PastilleAvatar({ enLigne }: { enLigne: boolean }) {
  if (!enLigne) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-0 right-0 size-[11px] rounded-full border-2 border-paper bg-ok-dot"
    />
  );
}
