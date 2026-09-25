import type { Metadata } from 'next';

import { AsideVerse, AuthShell } from '@/components/layouts/auth-shell';
import { OnboardingForm } from '@/features/onboarding/components/onboarding-form';

export const metadata: Metadata = { title: 'Bienvenue', robots: { index: false } };

const BienvenuePage = () => (
  <AuthShell
    aside={
      <AsideVerse eyebrow="La Parole" verse="Ta parole est une lampe à mes pieds, une lumière sur mon sentier." reference="Psaume 118 (119), 105">
        Suivre une paroisse, c&apos;est recevoir ses annonces du dimanche, voir ses horaires et pouvoir écrire à ses prêtres. Vous pourrez
        en changer à tout moment dans votre profil.
      </AsideVerse>
    }
    footer="Besoin d’aide ? Le secrétariat de votre paroisse peut vous accompagner."
  >
    <OnboardingForm />
  </AuthShell>
);

export default BienvenuePage;
