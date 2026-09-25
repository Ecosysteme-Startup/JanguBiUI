import type { HttpHandler } from 'msw';

import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot (F5b en tête : fiche du nœud suivi). */
export const handlers: HttpHandler[] = [...f5bHandlers, ...shellHandlers, ...onboardingHandlers];
