'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { isMfaRequired } from '@/components/layouts/mfa-required-notice';
import { paths } from '@/config/paths';
import { useContexts } from '@/lib/can';

const PREFER_FIDELE_KEY = 'jangubi-prefer-fidele';

/** Un responsable a choisi de rester côté fidèle : on ne le renvoie plus automatiquement vers /espace. */
export const preferFideleSpace = () => {
  try {
    sessionStorage.setItem(PREFER_FIDELE_KEY, '1');
  } catch {
    // stockage indisponible : le pire cas est un aller-retour vers /espace, sans gravité.
  }
};

const prefersFideleSpace = (): boolean => {
  try {
    return sessionStorage.getItem(PREFER_FIDELE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Après connexion, un responsable (curé, vicaire, secrétariat, diocèse…) arrivait sur l'espace
 * fidèle sans accès visible à son espace (JB-WEB-033/037/043). On le renvoie vers `/espace` (qui
 * ouvre sa première rubrique autorisée, ou l'invite à la double authentification), sauf s'il a
 * explicitement choisi de rester côté fidèle (« Revenir à mon espace fidèle »).
 *
 * Un compte de responsable est détecté soit par la présence d'au moins un contexte, soit par le
 * refus `mfa_required` de `/me/capacites/` (il a un rôle staff mais pas encore saisi son code).
 */
export const StaffHomeRedirect = () => {
  const router = useRouter();
  const { contexts, error } = useContexts();
  const isStaff = contexts.length > 0 || isMfaRequired(error);
  useEffect(() => {
    if (isStaff && !prefersFideleSpace()) router.replace(paths.espace.index.getHref());
  }, [isStaff, router]);
  return null;
};
