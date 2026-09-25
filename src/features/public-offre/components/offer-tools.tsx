import { Notice } from '@/components/ui/notice';
import { SectionHeading } from '@/components/ui/section-heading';

const TOOLS = [
  { title: 'Annonces du dimanche', text: 'Rédigées une fois, lues par les fidèles avant et après la messe, y compris par ceux qui n’ont pas pu venir.' },
  { title: 'Horaires et lieux de culte', text: 'Église, chapelles, messes anticipées : un seul horaire à jour, visible dans l’annuaire public.' },
  { title: 'File des demandes d’actes', text: 'Chaque demande arrive complète, avec l’année et le nom de baptême. Les retards sont signalés.' },
  { title: 'Messagerie des prêtres', text: 'Messages chiffrés, auxquels aucun administrateur n’a accès. Chaque prêtre choisit s’il est joignable et à quelles heures.' },
  { title: 'Rendez-vous de confession', text: 'Créneaux ouverts par les prêtres, pris par les fidèles. Le sacrement reste reçu en présence du prêtre.' },
  { title: 'Équipe et tableau de bord', text: 'Les offices suivent les nominations de l’évêque. Le curé voit l’activité de la semaine en un coup d’œil.' },
];

/** « 01 — Ce que la paroisse obtient ». */
export const OfferTools = () => (
  <section aria-labelledby="obtient-titre" className="flex flex-col">
    <SectionHeading number="01" title="Ce que la paroisse obtient" aside="Espace paroisse · secrétariat, curé, prêtres" />
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-4">
        <h2 id="obtient-titre" className="m-0 font-serif text-h2 font-normal text-ink">
          Six outils, une seule équipe.
        </h2>
        <p className="m-0 mt-6 text-body text-ink-2">
          Chaque membre de l&apos;équipe n&apos;accède qu&apos;à ce que son office lui permet : la secrétaire aux demandes, le curé à
          tout, le vicaire à sa messagerie.
        </p>
        <Notice className="mt-8" icon="document" title="Les registres ne changent pas">
          L&apos;acte reste un original papier, signé et scellé au presbytère. Jàngu Bi ne transmet jamais d&apos;acte en PDF.
        </Notice>
      </div>
      <dl className="m-0 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
        {TOOLS.map((tool, index) => (
          <div key={tool.title} className="border-t border-line py-6">
            <dt className="flex items-baseline gap-3 font-serif text-h3 text-ink">
              <span className="tnum font-sans text-meta text-primary">{String(index + 1).padStart(2, '0')}</span>
              {tool.title}
            </dt>
            <dd className="m-0 mt-2 text-base text-ink-2">{tool.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);
