import { SectionHeading } from '@/components/ui/section-heading';

import type { ParishSecretariat as Secretariat } from '../api/get-parish-by-code';

/** « 03 — Secrétariat » : coordonnées et heures d'accueil que la paroisse a choisi de publier. */
export const ParishSecretariat = ({ secretariat }: { secretariat: Secretariat | null }) => (
  <section aria-labelledby="h-secretariat">
    <SectionHeading id="h-secretariat" number="03" title="Secrétariat" />
    {secretariat ? (
      <>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-base">
          {secretariat.phone && (
            <li>
              <a href={`tel:${secretariat.phone.replace(/[^+\d]/g, '')}`} className="tnum text-primary hover:text-primary-strong">
                {secretariat.phone}
              </a>
            </li>
          )}
          {secretariat.email && (
            <li className="break-all">
              <a href={`mailto:${secretariat.email}`} className="text-primary hover:text-primary-strong">
                {secretariat.email}
              </a>
            </li>
          )}
        </ul>
        {secretariat.office_hours.length > 0 && (
          <>
            <h3 className="tnum m-0 mt-4 text-meta font-normal text-ink-3">Heures d&apos;accueil</h3>
            <dl className="m-0 mt-2 grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              {secretariat.office_hours.map((slot) => (
                <div key={`${slot.days}-${slot.hours}`} className="contents">
                  <dt className="text-ink-3">{slot.days}</dt>
                  <dd className="tnum m-0 text-ink">{slot.hours}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        <p className="m-0 mt-4 text-sm text-ink-2">
          Les demandes d&apos;extraits d&apos;actes se font en ligne ; l&apos;original se retire au secrétariat, aux heures d&apos;accueil.
        </p>
      </>
    ) : (
      <p className="m-0 mt-2 text-sm text-ink-2">La paroisse n&apos;a pas encore publié les coordonnées de son secrétariat.</p>
    )}
  </section>
);
