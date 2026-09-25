'use client';

import { LiturgicalBanner } from '@/components/signature/liturgical-banner';
import { useLiturgyToday } from '@/hooks/use-liturgy-today';

type Props = { href: string; variant?: 'desktop' | 'mobile' | 'backoffice'; className?: string };

/** Bandeau liturgique alimenté par `/liturgy/today/` ; la date seule s'affiche en attendant. */
export const LiturgyBannerSlot = ({ href, variant, className }: Props) => {
  const { data } = useLiturgyToday();
  return <LiturgicalBanner data={data} href={href} variant={variant} className={className} />;
};
