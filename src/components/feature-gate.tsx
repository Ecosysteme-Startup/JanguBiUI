'use client';

import { Hourglass } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { type Feature, isFeatureEnabled } from '@/config/features';

type FeatureGateProps = {
  feature: Feature;
  children: React.ReactNode;
  /** Titre de l'état « pas encore disponible ». */
  title?: string;
  description?: React.ReactNode;
  /** Lien de repli (ex. retour à l'accueil spirituel). */
  back?: { href: string; label: string };
};

/**
 * Affiche l'écran seulement si la fonctionnalité est activée
 * (`NEXT_PUBLIC_FEATURES`, voir config/features.ts). Sinon, un état sobre :
 * jamais de données fictives en mode réel.
 */
export function FeatureGate({
  feature,
  children,
  title = 'Bientôt disponible',
  description = 'Cette rubrique n’est pas encore ouverte. Elle le sera dès que le service sera prêt.',
  back,
}: FeatureGateProps) {
  if (isFeatureEnabled(feature)) return <>{children}</>;
  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <EmptyState
        icon={<Hourglass />}
        title={title}
        description={description}
        action={
          back ? (
            <Button asChild variant="outline">
              <Link href={back.href}>{back.label}</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
