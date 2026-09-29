import { cn } from '@/utils/cn';

/**
 * Visuel d'attente d'une campagne (arches de la maquette WEB-PAR-Campagne-Editeur), en jetons :
 * affiché tant qu'aucune image n'est déposée. Jamais de photo factice.
 */
export const CampaignArt = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn('relative overflow-hidden bg-tint-50', className)}>
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="block size-full">
      <path d="M60 180 V96 a50 50 0 0 1 100 0 V180 Z" className="fill-tint-200" />
      <path d="M84 180 V104 a26 26 0 0 1 52 0 V180 Z" className="fill-tint-100" />
      <path d="M180 180 V70 a44 44 0 0 1 88 0 V180 Z" className="fill-tint-100" />
      <path d="M196 180 V78 a28 28 0 0 1 56 0 V180 Z" className="fill-tint-300" opacity={0.5} />
      <line x1={0} x2={320} y1={150} y2={150} className="stroke-tint-200" strokeWidth={2} />
    </svg>
  </div>
);

/** Image déposée (URL signée du stockage ou aperçu local) ou visuel d'attente. */
export const CampaignImage = ({ url, className }: { url: string | null; className?: string }) =>
  url ? <img src={url} alt="" className={cn('object-cover', className)} /> : <CampaignArt className={className} />;
