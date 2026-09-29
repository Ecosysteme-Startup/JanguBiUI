import { FeatureGate } from '@/components/feature-gate';
import { FEATURES } from '@/config/features';
import { TvContent } from '@/features/tv/components/tv-content';

// Route manquante côté backend (`/v1/tv/`) : écran derrière l'indicateur `tv`.
const TvPage = () => (
  <FeatureGate
    feature={FEATURES.tv}
    title="TV catholique"
    back={{ href: '/app/spirituel', label: 'Revenir à la spiritualité' }}
  >
    <TvContent />
  </FeatureGate>
);

export default TvPage;
