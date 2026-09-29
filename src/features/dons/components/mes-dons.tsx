'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatFcfa } from '@/features/dons-analyse/utils/format';

import {
  DONATION_STATUS_LABELS,
  MES_DONS_PAGE,
  type MyDonation,
  telechargerRecu,
  useMesDons,
  useResumeDons,
} from '../api/dons';

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function LigneDon({ don }: { don: MyDonation }) {
  const [erreur, setErreur] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const recu = async () => {
    setErreur(false);
    setEnCours(true);
    try {
      await telechargerRecu(don);
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {don.fund.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {don.parish} · {dateCourte(don.created_at)}
        </p>
        <p className="text-xs text-muted-foreground">
          {DONATION_STATUS_LABELS[don.status] ?? don.status}
        </p>
        {erreur && (
          <p className="text-xs text-destructive" role="alert">
            Le reçu n’a pas pu être téléchargé.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold text-foreground">
          {formatFcfa(don.amount)}
        </span>
        {don.receipt_available && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void recu()}
            disabled={enCours}
            icon={<Download className="size-3.5" />}
          >
            Reçu
          </Button>
        )}
      </div>
    </li>
  );
}

/** Mes dons (`/v1/me/dons/`) et total de l'année (`/v1/me/dons/resume/`). */
export function MesDons() {
  const annee = new Date().getFullYear();
  const [offset, setOffset] = useState(0);
  const resume = useResumeDons(annee);
  const dons = useMesDons({ offset });

  return (
    <div className="space-y-4">
      {resume.data && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">
            Vos dons en {resume.data.year} (visible de vous seul)
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatFcfa(resume.data.total)}
          </p>
        </div>
      )}

      {dons.isLoading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chargement…
        </p>
      )}
      {dons.isError && (
        <p className="text-sm text-muted-foreground">
          Vos dons n’ont pas pu être chargés. Réessayez dans un instant.
        </p>
      )}
      {dons.data && dons.data.count === 0 && (
        <p className="text-sm text-muted-foreground">
          Vous n’avez pas encore fait de don en ligne.
        </p>
      )}
      {dons.data && dons.data.results.length > 0 && (
        <ul className="divide-y divide-border" aria-label="Mes dons">
          {dons.data.results.map((d) => (
            <LigneDon key={d.id} don={d} />
          ))}
        </ul>
      )}
      {dons.data && (dons.data.previous || dons.data.next) && (
        <div className="flex justify-between">
          <Button
            size="sm"
            variant="outline"
            disabled={!dons.data.previous}
            onClick={() => setOffset((o) => Math.max(0, o - MES_DONS_PAGE))}
          >
            Précédents
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!dons.data.next}
            onClick={() => setOffset((o) => o + MES_DONS_PAGE)}
          >
            Suivants
          </Button>
        </div>
      )}
    </div>
  );
}
