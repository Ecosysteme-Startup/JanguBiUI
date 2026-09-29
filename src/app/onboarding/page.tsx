'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  ChurchCascadeSelector,
  type SelectedChurch,
} from '@/components/org/church-cascade-selector';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { useLogout, useUser } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';
import { useAddMemberships } from '@/lib/org/update-parish';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const [selected, setSelected] = useState<SelectedChurch[]>([]);
  const [primaryChurchId, setPrimaryChurchId] = useState<number | null>(null);

  const { mutate: addMemberships, isPending } = useAddMemberships({
    onSuccess: () => {
      router.replace(getRoleHomePath(user));
    },
  });

  const { mutate: logout } = useLogout();

  // Onboarding déjà terminé → on redirige (effet, pas pendant le render).
  const completed = user?.onboarding_state === 'completed';
  useEffect(() => {
    if (completed && user) {
      router.replace(getRoleHomePath(user));
    }
  }, [completed, user, router]);

  if (completed) return null;

  const handleSelectionChange = (
    next: SelectedChurch[],
    nextPrimary: number | null,
  ) => {
    setSelected(next);
    setPrimaryChurchId(nextPrimary);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    // Église principale en tête : le back marque la 1re de church_ids comme is_primary.
    const orderedIds = [
      ...(primaryChurchId != null ? [primaryChurchId] : []),
      ...selected.map((s) => s.churchId).filter((id) => id !== primaryChurchId),
    ];
    addMemberships({ churchIds: orderedIds });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="size-12 text-primary"
            >
              <rect x="10" y="2" width="4" height="20" rx="2" />
              <rect x="2" y="8" width="20" height="4" rx="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenue sur Jàngu Bi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez la ou les églises que vous fréquentez, puis désignez votre
            église principale.
          </p>
        </div>

        <Card variant="elevated" className="p-6">
          <ChurchCascadeSelector
            selected={selected}
            primaryChurchId={primaryChurchId}
            onChange={handleSelectionChange}
            disabled={isPending}
          />

          <Button
            className="mt-6 w-full"
            onClick={handleSubmit}
            disabled={selected.length === 0 || isPending}
          >
            {isPending ? 'Enregistrement…' : 'Commencer'}
          </Button>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ce n&apos;est pas vous ?{' '}
          <button
            type="button"
            onClick={() => logout()}
            className="font-medium text-primary hover:text-primary/80"
          >
            Se déconnecter
          </button>
        </p>
      </div>
    </div>
  );
}
