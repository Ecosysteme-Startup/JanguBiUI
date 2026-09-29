import type { HttpHandler } from 'msw';

import { declarationHandlers } from '@/testing/mocks/handlers/declaration';
import { donsHandlers } from '@/testing/mocks/handlers/dons';
import { adminComptesHandlers } from '@/testing/mocks/handlers/admin-comptes';
import { donsAnalyseHandlers } from '@/testing/mocks/handlers/dons-analyse';
import { audioLecteurHandlers } from '@/testing/mocks/handlers/audio-lecteur';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';
import { f8bHandlers } from '@/testing/mocks/handlers/f8b';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { paroissesHandlers } from '@/testing/mocks/handlers/paroisses';
import { personnalisationHandlers } from '@/testing/mocks/handlers/personnalisation';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { shellHandlers } from '@/testing/mocks/handlers/shell';
import { sonothequeHandlers } from '@/testing/mocks/handlers/sonotheque';
import { v1ComplementsHandlers } from '@/testing/mocks/handlers/v1-complements';

/**
 * Handlers MSW conformes au contrat (schema.yml), un fichier par lot.
 * Ordre significatif : le premier handler qui correspond répond (F5b en tête : fiche du nœud suivi).
 */
export const handlers: HttpHandler[] = [...f5bHandlers, ...shellHandlers, ...onboardingHandlers, ...paroleHandlers, ...actesHandlers, ...f7PretreHandlers, ...f8aHandlers, ...f4PublicHandlers, ...f8bHandlers, ...declarationHandlers, ...donsHandlers,
  // Sonothèque et lecteur audio global (fusion de main), paroisses multiples.
  ...audioLecteurHandlers, ...sonothequeHandlers, ...paroissesHandlers,
  // Compléments V1 : intentions de messe, recherche, comptes du clergé, tâches du jour, compteurs.
  ...v1ComplementsHandlers,
  // Analyse des dons (paroisse, diocèse, plateforme).
  ...donsAnalyseHandlers,
  // Administration des comptes synchronisée avec Keycloak (/admin/).
  ...adminComptesHandlers,
  // « Pour vous aujourd'hui », signaux de lecture, réglages, présence dans la messagerie.
  ...personnalisationHandlers];
