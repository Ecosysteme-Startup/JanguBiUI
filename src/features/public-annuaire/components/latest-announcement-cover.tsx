'use client';

import type { ReactNode } from 'react';

import { usePublicAnnouncements } from '../api/get-public-announcements';

/**
 * Bannière de la dernière annonce publiée (brique « Ma paroisse » de l'accueil), avec son
 * texte alternatif ; `fallback` (l'emplacement photo) tant qu'aucune annonce n'en a.
 */
export const LatestAnnouncementCover = ({ fallback }: { fallback: ReactNode }) => {
  const { data } = usePublicAnnouncements({ limit: 1 });
  const announcement = data?.results[0];
  if (!announcement?.cover_image_url) return <>{fallback}</>;
  return (
    <figure className="m-0">
      {/* URL signée du stockage (MinIO/S3) : pas d'optimisation next/image. */}
      <img
        src={announcement.cover_image_url}
        alt={announcement.cover_image_decorative ? '' : announcement.cover_image_alt}
        className="aspect-[3/2] w-full border border-line object-cover"
      />
    </figure>
  );
};
