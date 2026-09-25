import type { HttpHandler } from 'msw';

import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/**
 * Handlers MSW conformes au contrat (schema.yml), un fichier par lot.
 * Ordre significatif : le premier handler qui correspond répond (F5b en tête : fiche du nœud suivi).
 */
export const handlers: HttpHandler[] = [...f5bHandlers, ...shellHandlers, ...onboardingHandlers, ...paroleHandlers, ...actesHandlers];
