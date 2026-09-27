'use client';

import { Icon } from '@/components/ui/icon';

import { type Place, useNodeWeek } from '../api/get-node-week';

/** Itinéraire OpenStreetMap : position si connue, sinon recherche par nom et adresse. */
export const itineraryHref = (place: { name: string; address?: string | null; city?: string | null; lat?: string | number | null; lng?: string | number | null }) => {
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  if (place.lat !== null && place.lat !== undefined && place.lat !== '' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  }
  const query = [place.name, place.address, place.city].filter(Boolean).join(', ');
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
};

/** Plan schématique décoratif (rues et repère) en attendant une vraie carte. */
const PlanDrawing = () => (
  <svg viewBox="0 0 352 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
    <path d="M0 20h120v50H0zM140 0h110v60H140zM270 0h82v90h-82zM0 90h150v50H0zM170 80h80v60h-80z" className="fill-surface" />
    <path d="M-10 78 362 70M130 -10l30 160M260 -10v160M0 16l352 30" className="stroke-paper" strokeWidth="10" fill="none" />
    <path d="M-10 78 362 70" className="stroke-line" strokeWidth="1" fill="none" />
    <circle cx="205" cy="62" r="14" className="fill-tint-200" opacity="0.6" />
    <circle cx="205" cy="62" r="7" className="fill-primary-fill stroke-paper" strokeWidth="3" />
  </svg>
);

const PlaceCard = ({ place }: { place: Place }) => {
  const address = [place.address, place.city].filter(Boolean).join(', ');
  return (
    <li className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
      <div className="h-[140px] bg-surface-2">
        <PlanDrawing />
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="text-16 font-semibold text-ink">{place.name}</div>
        {address && <div className="text-14 text-ink-2">{address}</div>}
        <a
          href={itineraryHref(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="hit mt-3 inline-flex items-center gap-1.5 text-14 font-semibold"
        >
          <Icon name="pin" size={16} />
          Itinéraire<span className="sr-only"> vers {place.name} (OpenStreetMap, nouvel onglet)</span>
        </a>
      </div>
    </li>
  );
};

/** « Lieux de culte » de la fiche (WEB-Fiche-Paroisse) : église, chapelles, avec l'itinéraire. */
export const ParishPlaces = ({ nodeId }: { nodeId: string }) => {
  const { data } = useNodeWeek(nodeId);
  const places = [...(data?.places ?? [])].filter((p) => p.is_active !== false).sort((a, b) => Number(b.is_main) - Number(a.is_main));
  if (places.length === 0) return null;
  return (
    <section aria-labelledby="h-lieux">
      <div className="flex items-baseline justify-between gap-6">
        <h2 id="h-lieux" className="m-0 text-24 font-semibold text-ink">
          Lieux de culte
        </h2>
        <span className="text-15 text-ink-3">{places.length > 1 ? `${places.length} lieux` : '1 lieu'}</span>
      </div>
      <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </ul>
    </section>
  );
};
