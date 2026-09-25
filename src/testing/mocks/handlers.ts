import type { HttpHandler } from 'msw';

import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot. */
export const handlers: HttpHandler[] = [...shellHandlers, ...onboardingHandlers, ...paroleHandlers];
