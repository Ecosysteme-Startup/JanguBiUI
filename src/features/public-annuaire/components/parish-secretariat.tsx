import { Icon } from '@/components/ui/icon';

import type { ParishSecretariat as Secretariat } from '../api/get-parish-by-code';

/**
 * Carte « Contact » de la fiche (WEB-Fiche-Paroisse) : téléphone et heures d'accueil du
 * secrétariat, e-mail, adresse. Coordonnées affichées seulement si la paroisse les publie.
 */
export const ParishSecretariat = ({ secretariat, address }: { secretariat: Secretariat | null; address: string }) => {
  const hours = secretariat?.office_hours.map((slot) => `${slot.days}, ${slot.hours}`).join(' ; ');
  return (
    <section aria-labelledby="h-secretariat" className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <h2 id="h-secretariat" className="m-0 text-17 font-semibold text-ink">
        Contact
      </h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-4 p-0 text-15">
        {secretariat?.phone && (
          <li className="flex gap-3">
            <Icon name="telephone" size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <a href={`tel:${secretariat.phone.replace(/[^+\d]/g, '')}`} className="tnum font-semibold">
                {secretariat.phone}
              </a>
              {hours && <div className="text-13 text-ink-3">Secrétariat : {hours}</div>}
            </div>
          </li>
        )}
        {secretariat?.email && (
          <li className="flex gap-3">
            <Icon name="mail" size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <a href={`mailto:${secretariat.email}`} className="break-all font-semibold">
              {secretariat.email}
            </a>
          </li>
        )}
        {address && (
          <li className="flex gap-3">
            <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <span className="text-ink">{address}</span>
          </li>
        )}
      </ul>
      {!secretariat && <p className="m-0 mt-4 text-14 text-ink-2">La paroisse n&apos;a pas encore publié les coordonnées de son secrétariat.</p>}
    </section>
  );
};
