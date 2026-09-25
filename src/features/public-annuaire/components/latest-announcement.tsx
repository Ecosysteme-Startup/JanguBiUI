'use client';

import { usePublicAnnouncements } from '../api/get-public-announcements';

import { PublicAnnouncementItem } from './parish-announcements';

/** Dernière annonce publiée sur la plateforme (brique « Ma paroisse » de l'accueil). */
export const LatestAnnouncement = () => {
  const { data } = usePublicAnnouncements({ limit: 1 });
  const announcement = data?.results[0];
  if (!announcement) return null;
  return (
    <div>
      <PublicAnnouncementItem announcement={announcement} number={1} />
      {announcement.scope?.node_name && <p className="m-0 mt-3 border-t border-line pt-3 text-sm text-ink-3">{announcement.scope.node_name}</p>}
    </div>
  );
};
