'use client';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';
import { parishLabel } from '@/utils/parish-name';

import { AppearanceSection } from './appearance-section';
import { DeclarationComplementNotice } from './declaration-complement-notice';
import { IdentitySection } from './identity-section';
import { LifeStateSection } from './life-state-section';
import { MesParoisses } from './mes-paroisses';
import { NotificationSettingsSection } from './notification-settings-section';
import { DeleteAccountSection, PrivacySection } from './privacy-section';
import { ProfileNav } from './profile-nav';
import { SecuritySection } from './security-section';
import { SettingsCard } from './settings-card';

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

/** Profil et réglages (FID-Profil) : en-tête, onglets de réglages, cartes de sections. */
export const ProfilePage = ({ accountUrl, onAccountDeleted = leaveAfterDeletion }: ProfilePageProps) => {
  const { data: me, isPending, isError } = useMe();
  if (isPending) return <LoadingBlock label="Chargement de votre profil…" lines={5} />;
  if (isError) return <EmptyState tone="err" title="Votre profil n’a pas pu être chargé." />;
  const name = displayName(me);

  return (
    <>
      <header className="flex items-center gap-4 sm:gap-5">
        <Avatar name={name.full} size={72} className="text-24" />
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">{name.full}</h1>
          <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-15 text-ink-2">
            <span className="min-w-0 break-all">{me.email}</span>
            {me.paroisse_suivie && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-tint-50 px-3 text-13 font-semibold text-tint-800">
                <Icon name="paroisse" size={14} />
                {parishLabel(me.paroisse_suivie.name)}
              </span>
            )}
          </p>
        </div>
      </header>
      <DeclarationComplementNotice />
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8">
        <ProfileNav />
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
          <IdentitySection me={me} accountUrl={accountUrl} />
          <SettingsCard
            id="paroisse"
            title="Mes paroisses"
            description="Vous pouvez être membre de plusieurs paroisses. L’une d’elles est votre paroisse principale."
          >
            <div className="mt-5">
              <MesParoisses />
            </div>
          </SettingsCard>
          <NotificationSettingsSection />
          <AppearanceSection />
          <SecuritySection accountUrl={accountUrl} />
          <PrivacySection me={me} />
          <LifeStateSection />
          <DeleteAccountSection onAccountDeleted={onAccountDeleted} />
        </div>
      </div>
    </>
  );
};
