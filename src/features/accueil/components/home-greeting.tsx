'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';
import { parishLabel } from '@/utils/parish-name';

/** En-tête de l'accueil (FID-Accueil) : salutation, paroisse suivie, « Demander un acte ». */
export const HomeGreeting = () => {
  const { data: me } = useMe();
  const name = displayName(me);
  const paroisse = me?.paroisse_suivie?.name;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="m-0 text-32 font-semibold text-ink">Bonjour{name.first ? ` ${name.first}` : ''}</h1>
        {me && (
          <p className="m-0 mt-2 flex items-center gap-1.5 text-16 text-ink-2">
            <Icon name="pin" size={18} className="shrink-0" />
            {paroisse ? (
              parishLabel(paroisse)
            ) : (
              <NextLink href={paths.app.profil.getHref()} className="font-medium">
                Choisir ma paroisse
              </NextLink>
            )}
          </p>
        )}
      </div>
      <NextLink href={paths.app.demandes.nouvelle.getHref()} className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}>
        <Icon name="plus" size={18} />
        Demander un acte
      </NextLink>
    </header>
  );
};
