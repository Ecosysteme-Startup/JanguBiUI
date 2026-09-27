import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

const STEPS = [
  ['Vous faites la demande', 'À la paroisse où le sacrement a été célébré : c’est elle qui tient le registre.'],
  ['Le secrétariat vérifie', 'Il retrouve l’acte au registre et peut vous demander une précision.'],
  ['Le curé signe l’original', 'Vous êtes prévenu dès qu’il est prêt à retirer.'],
  ['Vous le retirez sur place', 'Au secrétariat, avec votre pièce d’identité, ou par un tiers muni d’une procuration.'],
] as const;

/** « Comment ça marche » et « Un original papier » (FID-Demandes, colonne de droite). */
export const ActesPrimer = ({ className }: { className?: string }) => (
  <aside aria-labelledby="dem-ccm" className={cn('flex min-w-0 flex-col gap-4', className)}>
    <div className="rounded-16 border border-line bg-surface p-6">
      <h2 id="dem-ccm" className="m-0 text-18 font-semibold text-ink">
        Comment ça marche
      </h2>
      <ol className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
            <span aria-hidden="true" className="tnum inline-flex size-6 items-center justify-center rounded-full bg-tint-100 text-13 font-semibold text-tint-800">
              {i + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-15 font-semibold text-ink">{title}</span>
              <span className="text-14 text-ink-2">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
    <div role="note" className="rounded-16 bg-tint-50 px-6 py-5 text-tint-900">
      <p className="m-0 flex items-center gap-2 text-15 font-semibold">
        <Icon name="info" size={18} />
        Un original papier
      </p>
      <p className="m-0 mt-2 text-14">
        Chaque acte est signé et scellé par la paroisse. Aucun document n’est envoyé par Jàngu Bi, ni par e-mail ni en PDF.
      </p>
    </div>
  </aside>
);
