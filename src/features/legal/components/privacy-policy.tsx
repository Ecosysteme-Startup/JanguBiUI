import NextLink from 'next/link';

import { paths } from '@/config/paths';

import { LegalArticle, type LegalSection } from './legal-article';

const SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Qui traite vos données',
    body: (
      <>
        <p>
          Jàngu Bi est une application éditée par Numerisen, à Dakar. Numerisen est le responsable du traitement de vos données. Chaque
          paroisse et chaque diocèse reste maître des informations qui le concernent (annonces, horaires, demandes d&apos;actes qu&apos;il
          traite) et n&apos;y accède que dans le cadre de ses offices.
        </p>
        <p>
          Les traitements respectent la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et les
          règles de la Commission de protection des données personnelles (CDP). Le traitement fait l&apos;objet d&apos;une déclaration
          auprès de la CDP.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Les données utilisées',
    body: (
      <ul>
        <li>
          Votre compte : nom, prénom, adresse e-mail, numéro de téléphone et date de naissance (celle-ci sert notamment à vérifier que la
          messagerie et les dons restent réservés aux majeurs), et le cas échéant votre état de vie (laïc, religieux, clerc).
        </li>
        <li>La paroisse que vous suivez et vos préférences de notification.</li>
        <li>
          Vos demandes d&apos;extraits d&apos;actes : les informations nécessaires pour retrouver l&apos;acte dans le registre de la
          paroisse du sacrement (nom de baptême, date et lieu approximatifs, motif).
        </li>
        <li>Vos rendez-vous de confession : le créneau et le prêtre, jamais de contenu.</li>
        <li>Vos échanges avec un prêtre : les messages, chiffrés.</li>
        <li>
          Vos dons et quêtes : le montant, la date, la paroisse et le fonds bénéficiaires, pour votre historique et les reçus. Le paiement
          est traité par notre agrégateur : Jàngu Bi ne conserve aucune coordonnée bancaire ni numéro de carte.
        </li>
      </ul>
    ),
  },
  {
    id: 'sensibles',
    title: 'Des données sensibles, protégées comme telles',
    body: (
      <>
        <p>
          L&apos;appartenance religieuse est une donnée sensible au sens de la loi. Elle n&apos;est enregistrée qu&apos;avec votre
          consentement exprès, recueilli lors de l&apos;inscription, et vous pouvez le retirer à tout moment.
        </p>
        <p>
          Les messages échangés avec un prêtre sont chiffrés : aucun administrateur, ni de la paroisse, ni du diocèse, ni de Numerisen, n&apos;y
          a accès. La confession ne se fait jamais par message.
        </p>
        <p>
          Les tableaux de bord des diocèses et de la plateforme ne montrent que des chiffres d&apos;ensemble, jamais de données
          nominatives.
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Qui y a accès',
    body: (
      <>
        <p>
          Seules les personnes nommées à un office dans la paroisse concernée (curé, vicaire, secrétaire) accèdent à ce que cet office
          leur permet : une demande d&apos;acte n&apos;est visible que par la paroisse du sacrement. Les droits suivent les nominations
          de l&apos;évêque et prennent fin avec elles.
        </p>
        <p>Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.</p>
      </>
    ),
  },
  {
    id: 'hebergement',
    title: 'Hébergement et transferts hors du Sénégal',
    body: (
      <>
        <p>
          Vos données sont hébergées pour le compte de Numerisen. Certains prestataires techniques (hébergement, envoi des e-mails,
          agrégateur de paiement, outil de suivi des erreurs) peuvent être situés hors du Sénégal, y compris dans l&apos;Union
          européenne.
        </p>
        <p>
          Lorsqu&apos;un transfert hors du Sénégal a lieu, il est encadré par des garanties appropriées et limité à ce qui est nécessaire
          au service ; les données sensibles (appartenance religieuse, contenu des messages) ne sont pas transférées à des fins autres que
          l&apos;hébergement sécurisé.
        </p>
      </>
    ),
  },
  {
    id: 'conservation',
    title: 'Conservation',
    body: (
      <>
        <p>
          Les données sont conservées le temps nécessaire au service rendu, puis supprimées ou anonymisées. Les durées suivantes
          s&apos;appliquent (ADR-011) :
        </p>
        <ul>
          <li>Compte et profil : tant que le compte est actif, puis supprimés ou anonymisés dans les 30 jours suivant sa fermeture.</li>
          <li>Demandes d&apos;actes : conservées pour le suivi, puis anonymisées 12 mois après la clôture de la demande.</li>
          <li>Rendez-vous de confession (créneau, sans contenu) : 12 mois.</li>
          <li>Messages échangés avec un prêtre : supprimés à la fermeture du compte.</li>
          <li>
            Dons et quêtes : l&apos;historique et les reçus sont conservés le temps imposé par les obligations comptables et fiscales
            (jusqu&apos;à 10 ans).
          </li>
          <li>Journaux techniques : expurgés de tout contenu personnel ou religieux et conservés quelques semaines au plus.</li>
        </ul>
        <p>
          Les actes eux-mêmes restent dans les registres papier de la paroisse : Jàngu Bi n&apos;en conserve ni copie ni fichier.
        </p>
      </>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    body: (
      <>
        <p>
          Vous pouvez consulter et corriger vos informations depuis votre profil, changer de paroisse suivie, retirer votre consentement
          et demander la suppression de votre compte. Vous disposez aussi d&apos;un droit d&apos;accès, de rectification et
          d&apos;opposition, que vous pouvez exercer auprès de Numerisen.
        </p>
        <p>
          En cas de difficulté, vous pouvez saisir la Commission de protection des données personnelles du Sénégal.{' '}
          <NextLink href={paths.contact.getHref()} className="text-primary underline">
            Nous écrire
          </NextLink>
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et mesures techniques',
    body: (
      <p>
        Jàngu Bi utilise un cookie de session, indispensable pour rester connecté, et une préférence d&apos;affichage (clair ou sombre).
        Aucun cookie publicitaire ni de suivi. Les erreurs techniques sont signalées à un outil de suivi dont les journaux sont expurgés
        de tout contenu religieux ou personnel.
      </p>
    ),
  },
];

/** Politique de confidentialité (charte éditoriale, loi 2008-12). */
export const PrivacyPolicy = () => (
  <LegalArticle
    kicker="Informations"
    title="Confidentialité"
    updated="septembre 2026"
    intro={
      <p className="m-0">
        Jàngu Bi sert la vie de votre paroisse. Ce qui vous concerne y est traité avec la discrétion que l&apos;Église attend de ses
        secrétariats : le strict nécessaire, pour la seule démarche que vous engagez.
      </p>
    }
    sections={SECTIONS}
  />
);
