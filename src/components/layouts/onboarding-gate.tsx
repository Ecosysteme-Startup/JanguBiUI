'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';

/** Sans consentement en vigueur (loi 2008-12), l'espace fidèle renvoie vers `/bienvenue`. */
export const OnboardingGate = () => {
  const router = useRouter();
  const { data: me } = useMe();
  const required = me?.consent.required === true;
  useEffect(() => {
    if (required) router.replace(paths.auth.bienvenue.getHref());
  }, [required, router]);
  return null;
};
