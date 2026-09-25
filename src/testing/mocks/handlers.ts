import type { HttpHandler } from 'msw';

import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot. */
export const handlers: HttpHandler[] = [...shellHandlers, ...onboardingHandlers, ...f7PretreHandlers];
