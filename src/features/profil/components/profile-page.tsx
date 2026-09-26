'use client';

import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';

import { DeclarationComplementNotice } from './declaration-complement-notice';
import { FollowedParishSection } from './followed-parish-section';
import { IdentitySection } from './identity-section';
import { NotificationSettingsSection } from './notification-settings-section';
import { PrivacySection } from './privacy-section';
import { SecuritySection } from './security-section';

/** Après suppression : fin de session Auth.js puis Keycloak (comme « Se déconnecter »). */
const leaveAfterDeletion = async () => {
  try {
    const response = await fetch('/deconnexion', { method: 'POST' });
    const { redirectTo } = (await response.json()) as { redirectTo?: string };
    window.location.assign(redirectTo ?? paths.home.getHref());
  } catch {
    window.location.assign(paths.home.getHref());
  }
};

type ProfilePageProps = { accountUrl: string | null; onAccountDeleted?: () => void };

/** Profil et paramètres (FID-Profil). */
export const ProfilePage = ({ accountUrl, onAccountDeleted = leaveAfterDeletion }: ProfilePageProps) => {
  const { data: me, isPending, isError } = useMe();
  if (isPending) return <LoadingBlock label="Chargement de votre profil…" lines={5} />;
  if (isError) return <EmptyState tone="err" title="Votre profil n’a pas pu être chargé." />;
  const name = displayName(me);

  return (
    <div className="mx-auto max-w-[1180px]">
      <NextLink href={paths.app.root.getHref()} className="hidden items-center gap-2 text-sm text-ink-2 hover:text-primary lg:inline-flex">
        <Icon name="fleche-gauche" size={16} />
        Retour · Accueil
      </NextLink>
      <header className="mt-2 lg:mt-6">
        <p className="tnum m-0 text-meta text-ink-3">
          <span className="text-primary">05</span> — Profil et paramètres
        </p>
        <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">
          Mon <em className="text-primary">profil</em>
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <Avatar name={name.full} size={56} />
          <span>
            <span className="block font-serif text-h4 text-ink">{name.full}</span>
            <span className="block text-sm text-ink-3">{me.email}</span>
          </span>
        </div>
      </header>
      <DeclarationComplementNotice />
      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex flex-col gap-12 lg:col-span-7">
          <IdentitySection me={me} />
          <NotificationSettingsSection />
        </div>
        <div className="flex flex-col gap-12 lg:col-span-5">
          <FollowedParishSection me={me} />
          <SecuritySection accountUrl={accountUrl} />
          <PrivacySection me={me} onAccountDeleted={onAccountDeleted} />
        </div>
      </div>
    </div>
  );
};
