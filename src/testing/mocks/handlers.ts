import type { HttpHandler } from 'msw';

import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot. */
export const handlers: HttpHandler[] = [...shellHandlers, ...onboardingHandlers, ...actesHandlers];
