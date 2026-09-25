import type { HttpHandler } from 'msw';

import { f8aHandlers } from '@/testing/mocks/handlers/f8a';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot. */
export const handlers: HttpHandler[] = [...shellHandlers, ...onboardingHandlers, ...f8aHandlers];
