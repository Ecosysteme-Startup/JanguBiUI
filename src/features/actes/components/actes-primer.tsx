import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/** Encart pédagogique de FID-Demandes : paroisse du sacrement, original papier, repères de délai. */
export const ActesPrimer = ({ className }: { className?: string }) => (
  <aside aria-label="Comment fonctionne une demande d’acte" className={cn('flex flex-col gap-8', className)}>
    <div role="note" className="rounded border border-primary bg-tint-50 p-6">
      <p className="m-0 flex items-center gap-2 text-base font-semibold text-primary-strong">
        <Icon name="info" size={18} />
        Bon à savoir
      </p>
      <p className="m-0 mt-4 font-serif text-[1.375rem] italic leading-tight text-ink">
        L’acte est délivré par la paroisse où le sacrement a été célébré ; il vous est remis en original signé et scellé.
      </p>
      <p className="m-0 mt-4 text-sm leading-normal text-ink">
        Baptisé ailleurs que dans la paroisse que vous suivez aujourd’hui ? Adressez la demande à la paroisse du baptême. Aucun acte
        n’est délivré par voie numérique : seul l’original fait foi.
      </p>
    </div>
    <section aria-labelledby="dem-delais">
      <p id="dem-delais" className="tnum m-0 border-t border-line-strong pt-3 text-meta text-ink-2">
        Repères
      </p>
      <dl className="m-0 mt-4">
        <div className="border-b border-line pb-4">
          <dt className="tnum text-meta text-ink-3">Délai indicatif</dt>
          <dd className="m-0 mt-2 font-serif text-[2.6875rem] leading-none tracking-tight text-ink">3 à 7 jours</dd>
          <dd className="m-0 mt-1 text-sm text-ink-2">entre l’envoi et la mise à disposition.</dd>
        </div>
        <div className="pt-4">
          <dt className="tnum text-meta text-ink-3">Validité pour un mariage</dt>
          <dd className="m-0 mt-2 font-serif text-[2rem] leading-none text-ink">6 mois</dd>
          <dd className="m-0 mt-1 text-sm text-ink-2">Un extrait plus ancien vous sera redemandé.</dd>
        </div>
      </dl>
    </section>
  </aside>
);
