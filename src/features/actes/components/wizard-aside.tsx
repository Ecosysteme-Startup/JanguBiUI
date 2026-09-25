'use client';

import { useFormContext } from 'react-hook-form';

import { cn } from '@/utils/cn';

import type { RequestOptions } from '../api/get-request-options';
import type { WizardValues } from '../utils/wizard-schema';

/** Colonne latérale (desktop) : rappel des étapes 1 et 2, suite de la démarche. */
export const WizardAside = ({ options, className }: { options: RequestOptions; className?: string }) => {
  const { watch } = useFormContext<WizardValues>();
  const [type, free, parish] = watch(['document_type', 'document_type_free', 'parish']);
  const label = type === 'other' && free ? free : options.document_types.find((t) => t.value === type)?.label;
  const secretariat = parish ? `Le secrétariat de ${parish.name}` : 'Le secrétariat de la paroisse du sacrement';

  return (
    <aside aria-label="Rappel et suite de la demande" className={cn('flex-col gap-8', className)}>
      <div className="rounded border border-line-strong bg-surface p-6">
        <p className="tnum m-0 text-meta text-primary">Rappel · étapes 1 et 2</p>
        <dl className="m-0 mt-4">
          <div className="border-t border-line py-3">
            <dt className="tnum text-meta text-ink-3">Acte demandé</dt>
            <dd className="m-0 mt-1.5 text-body font-semibold text-ink">{label ?? '—'}</dd>
          </div>
          <div className="border-t border-line py-3">
            <dt className="tnum text-meta text-ink-3">Paroisse du sacrement</dt>
            <dd className="m-0 mt-1.5 text-body font-semibold text-ink">{parish?.name ?? '—'}</dd>
            {parish?.city && <dd className="m-0 mt-0.5 text-sm text-ink-2">{[parish.address, parish.city].filter(Boolean).join(' · ')}</dd>}
          </div>
        </dl>
      </div>

      <section aria-labelledby="dn-ensuite">
        <p id="dn-ensuite" className="tnum m-0 border-t border-line-strong pt-3 text-meta text-ink-2">
          Ce qui se passe ensuite
        </p>
        <ol className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
          {[
            `${secretariat} recherche votre acte dans le registre.`,
            'S’il manque une précision, il vous écrit ici. Vous êtes prévenu par notification.',
            'L’acte est signé par le curé et scellé du sceau de la paroisse.',
            'Vous le retirez en original, sur présentation d’une pièce d’identité. Aucun envoi numérique.',
          ].map((text, index) => (
            <li key={text} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 text-sm text-ink">
              <span className="tnum text-meta text-primary">{String(index + 1).padStart(2, '0')}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t border-line pt-4">
          <p className="tnum m-0 text-meta text-ink-3">Délai indicatif</p>
          <p className="m-0 mt-2 font-serif text-h2 text-ink">3 à 7 jours</p>
          <p className="m-0 mt-1 text-sm text-ink-2">Les registres anciens peuvent demander davantage de recherche.</p>
        </div>
        <p className="m-0 mt-6 text-sm text-ink-3">Ces informations ne sont visibles que par le secrétariat de la paroisse du sacrement.</p>
      </section>
    </aside>
  );
};
