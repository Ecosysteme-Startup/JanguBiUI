import { AlternatingSection } from '@/features/landing/components/alternating-section';
import { CtaSection } from '@/features/landing/components/cta-section';
import { FeaturesSection } from '@/features/landing/components/features-section';
import { HeroSection } from '@/features/landing/components/hero-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingNav } from '@/features/landing/components/landing-nav';
import { PourQuiSection } from '@/features/landing/components/pour-qui-section';

const HomePage = () => {
  // La landing suit le thème (clair/sombre) piloté par next-themes : le bouton
  // de bascule de la nav agit donc réellement. En clair → « Sacred Editorial
  // day » (papier/ivoire, encre navy, accents or/cyan) ; en sombre → identité
  // nocturne (navy profond + champ d'étoiles). Plus de palette forcée ici.
  return (
    <div className="bg-background text-foreground">
      <LandingNav />
      <main>
        {/* StatsSection et TestimonialsSection retirées avant l'ouverture beta :
            leur contenu était entièrement inventé — chiffres d'adoption animés
            comme des métriques temps réel sur un produit sans utilisateurs, et
            trois témoignages nominatifs dont un attribué à un évêque nommé d'un
            diocèse réel, avec une statistique de collecte fabriquée. À
            réintroduire seulement avec des données et des accords réels. */}
        <HeroSection />
        <FeaturesSection />
        <AlternatingSection />
        <PourQuiSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default HomePage;
