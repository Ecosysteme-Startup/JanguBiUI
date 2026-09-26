import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { plural } from '@/utils/plural';

import type { WeekPlace } from '../api/get-parish-week';

/** Itinéraire vers l'adresse (service de cartes ouvert dans un nouvel onglet). */
const directionsHref = (place: WeekPlace) => {
  const where = [place.name, place.address, place.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(where)}`;
};

/** Plan dessiné (décor) : aucune coordonnée n'est connue, le lien « Itinéraire » fait foi. */
const MapDrawing = ({ variant }: { variant: number }) => (
  <svg width="100%" height="100%" viewBox="0 0 352 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {variant % 2 === 0 ? (
      <>
        <path d="M0 16h120v44H0zM140 0h110v52H140zM270 0h82v80h-82zM0 80h150v40H0zM170 72h80v48h-80z" fill="var(--jb-surface)" />
        <path d="M-10 68 362 60M130 -10l26 140M260 -10v140M0 12l352 26" stroke="var(--jb-paper)" strokeWidth="10" fill="none" />
        <circle cx="205" cy="54" r="14" fill="var(--jb-tint-200)" opacity="0.6" />
        <circle cx="205" cy="54" r="7" fill="var(--jb-primary-fill)" stroke="var(--jb-paper)" strokeWidth="3" />
      </>
    ) : (
      <>
        <path d="M20 8h140v60H20zM190 8h140v34H190zM190 62h140v58H190zM0 88h160v32H0z" fill="var(--jb-surface)" />
        <path d="M-10 78h372M175 -10v140M0 52 160 78" stroke="var(--jb-paper)" strokeWidth="10" fill="none" />
        <circle cx="120" cy="40" r="14" fill="var(--jb-tint-200)" opacity="0.6" />
        <circle cx="120" cy="40" r="7" fill="var(--jb-primary-fill)" stroke="var(--jb-paper)" strokeWidth="3" />
      </>
    )}
  </svg>
);

/** « Lieux de culte » : église et chapelles de la paroisse, avec leur adresse et un itinéraire. */
export const WorshipPlaces = ({ places }: { places: WeekPlace[] }) => {
  if (places.length === 0) return null;
  const sorted = [...places].sort((a, b) => Number(Boolean(b.is_main)) - Number(Boolean(a.is_main)));
  return (
    <section aria-labelledby="mp-lieux">
      <SectionHeading id="mp-lieux" size="md" title="Lieux de culte" aside={<span className="text-15 text-ink-3">{plural(places.length, 'lieu', 'lieux')}</span>} />
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
        {sorted.map((place, index) => {
          const address = [place.address, place.city].filter(Boolean).join(', ');
          return (
            <li key={place.id} className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
              <div className="h-[104px] bg-surface-2">
                <MapDrawing variant={index} />
              </div>
              <div className="px-5 pb-5 pt-4">
                <p className="m-0 text-16 font-semibold text-ink">{place.name}</p>
                {address && <p className="m-0 text-14 text-ink-2">{address}</p>}
                <a
                  href={directionsHref(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hit mt-3 inline-flex items-center gap-1.5 text-14 font-semibold text-primary"
                >
                  <Icon name="pin" size={16} />
                  Itinéraire
                  <span className="sr-only"> vers {place.name} (nouvel onglet)</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
