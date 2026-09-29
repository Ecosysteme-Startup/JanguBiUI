'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { paths } from '@/config/paths';
import {
  DONATION_STATUS_LABELS,
  useCheckoutStatus,
} from '@/features/dons/api/dons';
import { formatFcfa } from '@/features/dons-analyse/utils/format';

// Retour de la page de paiement : l'agrégateur renvoie vers
// DONATIONS_RETURN_URL?don=<id> (et `&annule=1` en cas d'abandon).
// Défaut backend : http://localhost:3000/dons/retour — en recette, régler
// DONATIONS_RETURN_URL sur <origine du web>/dons/retour.
// Le statut affiché vient de GET /v1/dons/checkout/<id>/ (public) ; seule la
// notification signée de l'agrégateur confirme un don.

function Retour() {
  const params = useSearchParams();
  const donId = params.get('don');
  const annule = params.get('annule') === '1';
  const { data, isLoading, isError } = useCheckoutStatus(donId);

  let titre = 'Merci pour votre don';
  let texte =
    'Nous attendons la confirmation du paiement. Cette page se met à jour toute seule.';
  if (annule || data?.status === 'echoue' || data?.status === 'expire') {
    titre = 'Paiement non abouti';
    texte =
      'Aucun montant n’a été prélevé. Vous pouvez reprendre votre don quand vous le souhaitez.';
  } else if (data?.status === 'confirme') {
    texte = `Votre don à ${data.parish} est confirmé. Le reçu est disponible dans « Mes dons ».`;
  }
  if (!donId || isError) {
    titre = 'Don introuvable';
    texte = 'Ce lien de retour ne correspond à aucun don.';
  }

  return (
    <Card variant="elevated" className="w-full max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold text-foreground">{titre}</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <p className="text-sm text-muted-foreground">{texte}</p>
      )}
      {data && !isError && (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Pour</dt>
            <dd className="text-right text-foreground">{data.fund.title}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Montant</dt>
            <dd className="text-foreground">{formatFcfa(data.amount)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Référence</dt>
            <dd className="text-foreground">{data.reference}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Statut</dt>
            <dd className="text-foreground">
              {DONATION_STATUS_LABELS[data.status] ?? data.status}
            </dd>
          </div>
        </dl>
      )}
      <Button asChild className="w-full">
        <Link href={paths.app.dons.getHref()}>Revenir aux dons</Link>
      </Button>
    </Card>
  );
}

export default function DonsRetourPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Suspense>
        <Retour />
      </Suspense>
    </div>
  );
}
