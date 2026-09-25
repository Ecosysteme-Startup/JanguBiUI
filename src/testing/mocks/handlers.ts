import type { HttpHandler } from 'msw';

import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { shellHandlers } from '@/testing/mocks/handlers/shell';

/** Handlers MSW conformes au contrat (schema.yml). Complétés par lot. */
export const handlers: HttpHandler[] = [...shellHandlers, ...onboardingHandlers, ...f4PublicHandlers];
