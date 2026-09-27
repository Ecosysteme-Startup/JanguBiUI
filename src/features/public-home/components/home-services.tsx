import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

type Service = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  items: string[];
  link: { label: string; href: string };
};

const SERVICES: Service[] = [
  {
    id: 'parole',
    kicker: 'La Parole',
    title: 'Les lectures de la messe, chaque jour',
    text: 'Première lecture, psaume et Évangile du jour, en grands caractères. Le calendrier liturgique indique la couleur et la fête du jour.',
    items: ['Lectures, psaume et Évangile du jour', 'La Bible, livre par livre', 'Le chapelet, avec les mystères du jour'],
    link: { label: 'Lire la Parole du jour', href: paths.parole.getHref() },
  },
  {
    id: 'paroisse',
    kicker: 'Votre paroisse',
    title: 'Les horaires justes et les annonces du dimanche',
    text: 'Le secrétariat publie lui-même les messes, les changements d’horaire et les annonces lues en fin de messe. Vous les retrouvez à jour, même si vous avez manqué la messe.',
    items: ['Messes, confessions et lieux de culte', 'Annonces du dimanche et agenda de la paroisse', 'Une notification quand un horaire change'],
    link: { label: 'Trouver votre paroisse', href: paths.paroisses.list.getHref() },
  },
  {
    id: 'actes',
    kicker: 'Demandes d’actes',
    title: 'Demandez votre extrait de baptême sans vous déplacer deux fois',
    text: 'La demande part à la paroisse où le sacrement a été célébré. Vous suivez chaque étape et vous êtes prévenu quand l’original est prêt. L’extrait reste un document papier signé et scellé, à retirer au secrétariat.',
    items: ['Baptême, confirmation, mariage, première communion', 'Suivi en ligne, de l’envoi au retrait', 'Retrait par vous ou par une personne mandatée'],
    link: { label: 'Faire une demande', href: paths.auth.inscription.getHref() },
  },
  {
    id: 'pretre',
    kicker: 'Parler à un prêtre',
    title: 'Une question, un accompagnement, un rendez-vous',
    text: 'Écrivez aux prêtres joignables de votre paroisse. Les messages sont chiffrés, aucun administrateur n’y a accès. Pour vous confesser, réservez un créneau et rendez-vous à l’église : aucun contenu n’est demandé.',
    items: ['Messagerie chiffrée, réservée aux majeurs', 'Rendez-vous de confession aux créneaux de la paroisse', 'Un rappel la veille de votre rendez-vous'],
    link: { label: 'Écrire à un prêtre', href: paths.auth.inscription.getHref() },
  },
];

const ServiceText = ({ service }: { service: Service }) => (
  <div>
    <p className="m-0 text-15 font-semibold text-primary">{service.kicker}</p>
    <h3 id={`service-${service.id}`} className="m-0 mt-2 text-24 font-semibold text-ink md:text-28">
      {service.title}
    </h3>
    <p className="m-0 mt-4 text-17 leading-7 text-ink-2">{service.text}</p>
    <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0 text-16 text-ink">
      {service.items.map((item) => (
        <li key={item} className="flex gap-3">
          <Icon name="check" size={20} className="mt-0.5 shrink-0 text-primary" />
          {item}
        </li>
      ))}
    </ul>
    <NextLink href={service.link.href} className="hit mt-6 inline-block text-16 font-semibold">
      {service.link.label}
    </NextLink>
  </div>
);

/** Cadre d'aperçu (fond surface) ; masqué s'il n'a rien à montrer. */
const Frame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div aria-hidden="true" className={cn('rounded-16 border border-line bg-surface p-5 empty:hidden md:p-8', className)}>
    {children}
  </div>
);

/** Aperçu d'une demande d'acte (exemple, illustration). */
const RequestExample = () => (
  <>
    <div className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="tnum text-13 text-ink-3">JB-2026-00412</span>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-tint-50 px-2.5 text-12 font-medium text-tint-800">
          <span className="size-1.5 rounded-full bg-primary-fill" />
          En vérification
        </span>
      </div>
      <div className="mt-2 text-18 font-semibold text-ink">Extrait d&apos;acte de baptême</div>
      <div className="text-14 text-ink-2">Paroisse du baptême, pour mariage</div>
      <div className="mt-5 grid grid-cols-4 gap-1">
        {[true, true, false, false].map((done, i) => (
          <span key={i} className={cn('h-1.5 rounded-full', done ? 'bg-primary-fill' : 'bg-surface-2')} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-13 text-ink-3">
        <span>Soumise</span>
        <span className="font-semibold text-ink">Vérification</span>
        <span>Prête</span>
        <span>Retirée</span>
      </div>
      <div className="mt-4 border-t border-line pt-4 text-13 text-ink-3">Mise à jour par le secrétariat</div>
    </div>
    <div className="mt-4 flex gap-3 rounded-12 border border-line-active bg-tint-50 p-4 text-14 text-tint-900">
      <Icon name="info" size={20} className="shrink-0 text-primary" />
      <span>L&apos;extrait est un original papier. Présentez une pièce d&apos;identité au secrétariat pour le retirer.</span>
    </div>
  </>
);

/** Aperçu d'un échange avec un prêtre (exemple, illustration). */
const ConversationExample = () => (
  <div className="overflow-hidden rounded-16 border border-line bg-paper shadow-card">
    <div className="flex items-center gap-3 border-b border-line px-5 py-4">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-tint-100 text-tint-800">
        <Icon name="profil" size={18} />
      </span>
      <div className="flex-1">
        <div className="text-15 font-semibold text-ink">Un prêtre de votre paroisse</div>
        <div className="flex items-center gap-1 text-12 text-ink-3">
          <Icon name="cadenas" size={12} />
          Messages chiffrés
        </div>
      </div>
    </div>
    <div className="flex gap-2.5 border-b border-tint-100 bg-tint-50 px-5 py-3 text-13 text-tint-900">
      <Icon name="info" size={16} className="mt-px shrink-0 text-primary" />
      <span>La confession ne se fait pas par message. Prenez rendez-vous pour une confession en présentiel.</span>
    </div>
    <div className="flex flex-col gap-2 p-5 text-14">
      <div className="max-w-[78%] self-end rounded-[16px_16px_4px_16px] bg-tint-100 px-3.5 py-2.5 text-tint-900">
        Bonjour mon Père, nous souhaitons nous marier en juin prochain. Par où commencer&nbsp;?
      </div>
      <div className="max-w-[78%] self-start rounded-[16px_16px_16px_4px] border border-line bg-surface px-3.5 py-2.5 text-ink">
        Comptez environ neuf mois : un entretien avec vous deux, puis un parcours avec un couple accompagnateur.
      </div>
    </div>
  </div>
);

type HomeServicesProps = {
  /** Aperçu du psaume du jour. */
  paroleVisual: ReactNode;
  /** Aperçu des horaires de la paroisse pilote. */
  parishVisual: ReactNode;
};

/**
 * « Ce que vous pouvez faire avec Jàngu Bi » (WEB-Accueil) : quatre services, en rangées
 * alternées texte / aperçu. Les aperçus de la Parole et de la paroisse montrent les données du
 * jour ; ceux de la demande d'acte et de l'échange avec un prêtre sont des exemples.
 */
export const HomeServices = ({ paroleVisual, parishVisual }: HomeServicesProps) => {
  const visuals: Record<string, ReactNode> = {
    parole: paroleVisual,
    paroisse: parishVisual,
    actes: <RequestExample />,
    pretre: <ConversationExample />,
  };
  return (
    <section aria-labelledby="services-titre" className="jb-container pt-16 md:pt-24">
      <h2 id="services-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
        Ce que vous pouvez faire avec Jàngu Bi
      </h2>
      <p className="m-0 mt-2 text-18 text-ink-2">Quatre services pensés avec la paroisse Saint-Dominique et l&apos;archidiocèse de Dakar.</p>
      {SERVICES.map((service, index) => (
        <article
          key={service.id}
          aria-labelledby={`service-${service.id}`}
          className={cn(
            'grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-24',
            index === 0 ? 'mt-12 md:mt-16' : 'mt-14 md:mt-20',
          )}
        >
          <ServiceText service={service} />
          <Frame className={cn(index % 2 === 1 && 'lg:order-first')}>{visuals[service.id]}</Frame>
        </article>
      ))}
    </section>
  );
};
