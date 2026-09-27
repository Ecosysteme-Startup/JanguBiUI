import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

import type { ParishSheet } from '../api/get-parish-sheet';

/** Carte « Contact » : secrétariat publié par la paroisse (téléphone, horaires, e-mail) et adresse. */
export const ContactCard = ({ secretariat, address }: { secretariat: ParishSheet['secretariat']; address: string }) => {
  const phone = secretariat?.phone.trim();
  const email = secretariat?.email.trim();
  const hours = secretariat?.office_hours ?? [];
  if (!phone && !email && hours.length === 0 && !address) return null;

  return (
    <Card as="section" aria-labelledby="mp-contact">
      <h2 id="mp-contact" className="m-0 text-18 font-semibold text-ink">
        Contact
      </h2>
      <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0 text-14">
        {(phone || hours.length > 0) && (
          <li className="flex gap-3">
            <Icon name="telephone" size={18} className="mt-px shrink-0 text-ink-3" />
            <span>
              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="tnum font-semibold">
                  {phone}
                </a>
              )}
              {hours.map((h) => (
                <span key={`${h.days}-${h.hours}`} className="block text-ink-2">
                  Secrétariat {h.days.charAt(0).toLowerCase() + h.days.slice(1)}, {h.hours}
                </span>
              ))}
            </span>
          </li>
        )}
        {email && (
          <li className="flex gap-3">
            <Icon name="mail" size={18} className="mt-px shrink-0 text-ink-3" />
            <a href={`mailto:${email}`} className="min-w-0 break-words font-medium">
              {email}
            </a>
          </li>
        )}
        {address && (
          <li className="flex gap-3 text-ink">
            <Icon name="pin" size={18} className="mt-px shrink-0 text-ink-3" />
            {address}
          </li>
        )}
      </ul>
    </Card>
  );
};
