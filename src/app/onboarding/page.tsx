'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  type PickedParish,
  ParishPicker,
} from '@/components/org/parish-picker';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { ApiError } from '@/lib/api-client';
import { useLogout, useUser } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';
import { useAjouterParoisse, useMesParoisses } from '@/lib/paroisses/api';

/**
 * Premier choix de paroisse (facultatif) : `POST /v1/me/paroisses/` avec
 * `principale: true`. La recherche couvre l'annuaire public
 * (`GET /v1/public/nodes/?q=&type=paroisse`). Une personne déjà membre d'une
 * paroisse (`GET /v1/me/paroisses/`) est renvoyée vers son accueil.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: mesParoisses } = useMesParoisses();
  const [choix, setChoix] = useState<PickedParish | null>(null);
  const ajouter = useAjouterParoisse();
  const { mutate: logout } = useLogout();

  const accueil = getRoleHomePath(user);
  const dejaMembre = (mesParoisses?.length ?? 0) > 0;

  useEffect(() => {
    if (dejaMembre) router.replace(accueil);
  }, [dejaMembre, accueil, router]);

  if (dejaMembre) return null;

  const valider = () => {
    if (!choix) return;
    ajouter.mutate(
      { paroisseId: choix.id, principale: true },
      { onSuccess: () => router.replace(accueil) },
    );
  };

  const erreur =
    ajouter.error instanceof ApiError
      ? ajouter.error.message
      : ajouter.error
        ? 'L’enregistrement n’a pas abouti. Réessayez dans un instant.'
        : null;

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
            Choisissez la paroisse que vous fréquentez. Vous pourrez en ajouter
            d’autres depuis votre profil.
          </p>
        </div>

        <Card variant="elevated" className="p-6">
          <ParishPicker
            value={choix}
            onChange={setChoix}
            disabled={ajouter.isPending}
          />

          {erreur && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {erreur}
            </p>
          )}

          <Button
            className="mt-6 w-full"
            onClick={valider}
            disabled={!choix || ajouter.isPending}
          >
            {ajouter.isPending ? 'Enregistrement…' : 'Commencer'}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => router.replace(accueil)}
            disabled={ajouter.isPending}
          >
            Plus tard
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
