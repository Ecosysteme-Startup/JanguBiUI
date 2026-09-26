import type { Metadata } from 'next';

import { AuthShell } from '@/components/layouts/auth-shell';
import { SignOutButton } from '@/components/layouts/sign-out-button';
import { OnboardingForm } from '@/features/onboarding/components/onboarding-form';

export const metadata: Metadata = { title: 'Bienvenue', robots: { index: false } };

/** Étapes 2 et 3 de l'inscription (WEB-Inscription-Paroisse, WEB-Inscription-Consentement). Compte déjà créé : déconnexion à droite. */
const BienvenuePage = () => (
  <AuthShell headerAction={<SignOutButton />}>
    <OnboardingForm />
  </AuthShell>
);

export default BienvenuePage;
