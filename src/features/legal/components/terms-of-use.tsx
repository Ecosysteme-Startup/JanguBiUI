import NextLink from 'next/link';

import { paths } from '@/config/paths';

import { LegalArticle, type LegalSection } from './legal-article';

const SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: 'Le service',
    body: (
      <p>
        Jàngu Bi, édité par Numerisen, met à disposition des fidèles catholiques du Sénégal la Parole du jour, les informations de leur
        paroisse, le suivi de leurs demandes d&apos;extraits d&apos;actes, un échange avec les prêtres et la prise de rendez-vous de
        confession. L&apos;application est gratuite pour les fidèles.
      </p>
    ),
  },
  {
    id: 'compte',
    title: 'Votre compte',
    body: (
      <>
        <p>
          L&apos;inscription demande une adresse e-mail valide et le choix d&apos;une paroisse suivie. Vous êtes responsable de la
          confidentialité de votre mot de passe ; les comptes du personnel des paroisses sont protégés par une double authentification.
        </p>
        <p>La messagerie avec les prêtres est réservée aux personnes majeures.</p>
      </>
    ),
  },
  {
    id: 'eglise',
    title: 'Ce que l’application ne remplace pas',
    body: (
      <ul>
        <li>La confession ne se fait pas par message : seul le rendez-vous se prend en ligne, le sacrement est reçu en présence du prêtre.</li>
        <li>
          Un acte de catholicité est un original papier, signé et scellé, à retirer au secrétariat de la paroisse du sacrement.
          Jàngu Bi ne délivre aucun acte sous forme de fichier.
        </li>
        <li>Les informations publiées par une paroisse (annonces, horaires) relèvent de sa responsabilité.</li>
      </ul>
    ),
  },
  {
    id: 'usage',
    title: 'Bon usage',
    body: (
      <p>
        Les échanges restent courtois et conformes à leur objet. Une demande d&apos;acte doit concerner vous-même ou une personne pour
        laquelle vous êtes fondé à la faire. La paroisse peut refuser une demande incomplète ou injustifiée, en en donnant le motif.
      </p>
    ),
  },
  {
    id: 'textes',
    title: 'Textes liturgiques et bibliques',
    body: (
      <p>
        Les textes de la Parole du jour sont reproduits selon les droits indiqués sur chaque page (textes liturgiques de l&apos;AELF avec
        son autorisation, ou Bible en domaine public). Ils ne peuvent être réutilisés hors de ce cadre.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    body: (
      <p>
        Le traitement de vos données est décrit dans la{' '}
        <NextLink href={paths.confidentialite.getHref()} className="text-primary underline">
          politique de confidentialité
        </NextLink>
        , conformément à la loi n° 2008-12.
      </p>
    ),
  },
  {
    id: 'evolution',
    title: 'Évolution du service',
    body: (
      <p>
        L&apos;application est en phase pilote : ses fonctions peuvent évoluer. Toute modification importante de ces conditions vous
        sera signalée dans l&apos;application avant de s&apos;appliquer.
      </p>
    ),
  },
];

/** Conditions d'utilisation (charte éditoriale, fonctionnement réel de l'application). */
export const TermsOfUse = () => (
  <LegalArticle
    kicker="Informations"
    title="Conditions d’utilisation"
    updated="septembre 2026"
    intro={<p className="m-0">Ce que Jàngu Bi propose, ce qu&apos;il ne remplace pas, et ce que chacun s&apos;engage à respecter.</p>}
    sections={SECTIONS}
  />
);
