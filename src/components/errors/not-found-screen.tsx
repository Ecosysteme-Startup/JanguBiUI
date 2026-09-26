'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import { useLiturgyToday } from '@/hooks/use-liturgy-today';

const UsefulLink = ({ href, icon, title, text, last }: { href: string; icon: IconName; title: string; text: string; last?: boolean }) => (
  <NextLink
    href={href}
    className={`flex items-center gap-4 px-6 py-5 text-ink transition-colors hover:bg-surface hover:text-ink ${last ? '' : 'border-b border-line'}`}
  >
    <Icon name={icon} size={22} className="shrink-0 text-primary" />
    <span className="min-w-0 flex-1">
      <span className="block text-17 font-semibold">{title}</span>
      <span className="block text-14 text-ink-2">{text}</span>
    </span>
    <Icon name="chevron-droite" size={20} className="shrink-0 text-ink-3" />
  </NextLink>
);

/** Contenu de la 404 (WEB-Erreur-404) : message, recherche, retour à l'accueil, liens utiles. */
export const NotFoundScreen = () => {
  const { data: liturgy } = useLiturgyToday();
  return (
    <div className="jb-container grid items-start gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-24 lg:py-[136px]">
      <div>
        <p className="m-0 text-15 font-semibold text-primary">Erreur 404</p>
        <h1 className="m-0 mt-3 text-40 font-semibold text-ink">Cette page est introuvable</h1>
        <p className="m-0 mt-4 max-w-[560px] text-18 text-ink-2">
          Le lien est peut-être ancien, ou la page a été déplacée. Cherchez ce dont vous avez besoin, ou passez par l&apos;un des
          liens ci-contre.
        </p>
        <form role="search" action={paths.paroisses.list.getHref()} className="mt-8 flex max-w-[600px] flex-wrap gap-3 sm:flex-nowrap">
          <Input
            type="search"
            name="q"
            icon="recherche"
            aria-label="Rechercher sur Jàngu Bi"
            placeholder="Une paroisse, une lecture, une démarche"
          />
          <Button type="submit" variant="secondary" size="xl" className="border-line">
            Rechercher
          </Button>
        </form>
        <NextLink href={paths.home.getHref()} className="mt-6 inline-flex items-center gap-1.5 text-16 font-semibold">
          <Icon name="chevron-gauche" size={18} />
          Revenir à l&apos;accueil
        </NextLink>
      </div>
      <div>
        <h2 className="m-0 text-14 font-medium text-ink-3">Liens utiles</h2>
        <div className="mt-3 overflow-hidden rounded-16 border border-line bg-paper shadow-card">
          <UsefulLink
            href={paths.parole.getHref()}
            icon="parole"
            title="La Parole du jour"
            text={liturgy?.references.length ? liturgy.references.join(' · ') : 'Les lectures et l’Évangile du jour'}
          />
          <UsefulLink href={paths.paroisses.list.getHref()} icon="pin" title="Trouver une paroisse" text="Horaires des messes et contacts des paroisses" />
          <UsefulLink href={paths.aide.getHref()} icon="aide" title="Aide" text="Compte, demandes d’actes et messagerie" last />
        </div>
      </div>
    </div>
  );
};
