'use client';

import { useNodeWeek } from '../api/get-node-week';
import { useActiveParish, useNow } from '../hooks/use-parish-now';
import { slotWhen, upcomingMasses } from '../utils/schedule';

import { MassSlot } from './mass-slot';

const shortName = (name: string) => name.replace(/^Paroisse\s+/i, '');

/**
 * Carte « Prochaine messe » de l'ouverture de l'accueil (WEB-Accueil) : les deux prochaines
 * messes de la paroisse pilote. Rien tant qu'aucun horaire n'est publié.
 */
export const NextMassesCard = ({ className }: { className?: string }) => {
  const parish = useActiveParish();
  const now = useNow();
  const { data } = useNodeWeek(parish?.id ?? '');
  if (!parish || !data || !now) return null;
  const masses = upcomingMasses(data.occurrences, now.today, now.time).slice(0, 2);
  if (masses.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-15 font-semibold text-ink">{masses.length > 1 ? 'Prochaines messes' : 'Prochaine messe'}</span>
        <span className="truncate text-13 text-ink-3">{shortName(parish.name)}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {masses.map((mass, index) => (
          <MassSlot
            key={`${mass.date}-${mass.start_time}-${mass.place_id}`}
            occurrence={mass}
            when={slotWhen(mass, now.today, now.time)}
            tone={index === 0 ? 'next' : 'default'}
          />
        ))}
      </div>
    </div>
  );
};
