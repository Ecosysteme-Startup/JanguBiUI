'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogOut, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { MembershipManager } from '@/components/org/membership-manager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/button';
import { useNotifications } from '@/components/ui/notifications';
import { useDeleteAccount, useLogout, useUser } from '@/lib/auth';
import { isFidele } from '@/lib/authorization';
import { accountConsoleUrl } from '@/lib/oidc';

import { UpdateProfileInput, useUpdateProfile } from '../api/update-profile';

import { Personnalisation } from './personnalisation';

// ── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 space-y-4 rounded-2xl border border-border bg-card p-4"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';
const errorClass = 'mt-1 text-xs text-destructive';

// ── Main component ───────────────────────────────────────────────────────────

export function ProfilContent() {
  const { addNotification } = useNotifications();
  const { data: user, isLoading } = useUser();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
  });

  // Sync default values once user data arrives
  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.profile?.first_name ?? '',
        last_name: user.profile?.last_name ?? '',
        phone: user.profile?.phone ?? '',
      });
    }
  }, [user, resetProfile]);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Profil mis à jour',
      });
    },
  });

  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const { mutate: deleteAccount, isPending: isDeletingAccount } =
    useDeleteAccount();

  function onProfileSubmit(data: ProfileFormValues) {
    const payload: UpdateProfileInput = {};
    if (data.first_name) payload.first_name = data.first_name;
    if (data.last_name) payload.last_name = data.last_name;
    if (data.phone) payload.phone = data.phone;
    updateProfile(payload);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName =
    [user?.profile?.first_name, user?.profile?.last_name]
      .filter(Boolean)
      .join(' ') || user?.email;

  const initials =
    [user?.profile?.first_name, user?.profile?.last_name]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join('') ||
    (user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <div className="mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl">
      {/* Gradient header with large avatar */}
      <div className="relative">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10" />
        <div className="-mt-10 flex items-end gap-4 px-4 pb-4">
          <Avatar className="size-20 ring-4 ring-background shadow-lg">
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {displayName}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8 md:px-6 lg:px-8">
        {/* Profile info section */}
        <SectionCard title="Informations personnelles">
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="first_name" className={labelClass}>
                  Prénom
                </label>
                <input
                  id="first_name"
                  className={inputClass}
                  {...registerProfile('first_name')}
                />
                {profileErrors.first_name && (
                  <p className={errorClass} role="alert">
                    {profileErrors.first_name.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="last_name" className={labelClass}>
                  Nom
                </label>
                <input
                  id="last_name"
                  className={inputClass}
                  {...registerProfile('last_name')}
                />
                {profileErrors.last_name && (
                  <p className={errorClass} role="alert">
                    {profileErrors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+221 77 000 00 00"
                className={inputClass}
                {...registerProfile('phone')}
              />
              {profileErrors.phone && (
                <p className={errorClass} role="alert">
                  {profileErrors.phone.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={isUpdating}
              disabled={isProfileSubmitting}
            >
              Enregistrer
            </Button>
          </form>
        </SectionCard>

        {/* Mot de passe, e-mail, double authentification : compte Keycloak */}
        <SectionCard title="Connexion et sécurité">
          <p className="mb-3 text-sm text-muted-foreground">
            Votre mot de passe, votre adresse e-mail et la double
            authentification se gèrent sur votre espace de connexion Jàngu Bi.
          </p>
          <a
            href={accountConsoleUrl('security')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Gérer ma connexion
          </a>
        </SectionCard>

        {/* Mes églises — gestion des appartenances (Chantier 7b) */}
        {isFidele(user) && (
          <SectionCard title="Mes églises">
            <MembershipManager />
          </SectionCard>
        )}

        {/* Personnalisation : suggestions, présence, historique (lot C5) */}
        <SectionCard id="personnalisation" title="Personnalisation">
          <Personnalisation />
        </SectionCard>

        {/* Apparence — bascule thème (parité mobile ; la sidebar la porte sur
            desktop). md:hidden : évite un 2e toggle sur le Profil desktop. */}
        <div className="md:hidden">
          <SectionCard title="Apparence">
            <ThemeToggle
              className="w-full justify-start border border-border bg-card"
              labelClassName="block"
            />
          </SectionCard>
        </div>

        {/* Session section */}
        <SectionCard title="Session">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => logout()}
              disabled={isLoggingOut}
              icon={<LogOut className="size-4" />}
              className="justify-start"
            >
              Se déconnecter
            </Button>
          </div>
        </SectionCard>

        {/* Danger zone */}
        <SectionCard title="Zone de danger">
          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 className="size-4" />}
              className="border border-destructive/30 bg-destructive/5 text-destructive shadow-none hover:bg-destructive/10"
            >
              Supprimer mon compte
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Cette action est irréversible. Votre compte et toutes vos
                données seront supprimés.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteAccount()}
                  isLoading={isDeletingAccount}
                  className="flex-1"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
