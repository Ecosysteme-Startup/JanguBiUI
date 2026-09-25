'use client';

import NextLink from 'next/link';

import { Brand } from '@/components/layouts/brand';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';

/** En-tête desktop de l'espace fidèle : marque, notifications, profil. */
export const FideleHeader = () => {
  const { data: me } = useMe();
  const name = displayName(me);
  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-line px-8 lg:flex">
      <Brand href={paths.app.root.getHref()} label="Jàngu Bi, accueil de mon espace" subtitle="Espace fidèle" />
      <div className="flex items-center gap-3">
        <NextLink
          href={paths.app.notifications.getHref()}
          aria-label="Notifications"
          className="inline-flex size-10 items-center justify-center rounded border border-line text-ink hover:bg-surface-2"
        >
          <Icon name="cloche" size={20} />
        </NextLink>
        {me && (
          <NextLink href={paths.app.profil.getHref()} aria-label={`Mon profil : ${name.full}`} className="flex items-center gap-3 pl-3 text-ink">
            <Avatar name={name.full} size={40} className="border-ink bg-transparent text-ink" />
            <span className="text-sm font-medium">{name.first}</span>
          </NextLink>
        )}
      </div>
    </header>
  );
};
