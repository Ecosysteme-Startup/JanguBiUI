'use client';

import { Printer } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import {
  heureCourte,
  type LigneFeuille,
  useFeuilleIntentions,
} from '../api/intentions';
import { jourLong } from '../utils/format';

// À l'impression, seule la feuille est visible (ni menu ni en-tête de l'espace).
const STYLE_IMPRESSION = `@media print {
  body * { visibility: hidden; }
  #feuille-intentions, #feuille-intentions * { visibility: visible; }
  #feuille-intentions { position: absolute; inset: 0; padding: 0; }
}`;

function Lignes({ lignes }: { lignes: LigneFeuille[] }) {
  if (lignes.length === 0)
    return <p className="text-sm text-muted-foreground">Aucune intention.</p>;
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      {lignes.map((l) => (
        <li key={l.id}>
          <span className="font-medium">{l.intention}</span>
          <span className="block text-xs text-muted-foreground">
            {l.kind_label} · Demandée par : {l.announced_as}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Feuille des intentions d'un jour, à lire ou afficher à la sacristie. Texte et
 * nom à annoncer seulement : aucune offrande ni montant n'y figure.
 */
export function FeuilleIntentions({
  node,
  date,
}: {
  node: string;
  date: string;
}) {
  const { data, isLoading, isError, refetch } = useFeuilleIntentions(
    node,
    date,
  );

  if (!node || !date)
    return (
      <p className="text-sm text-muted-foreground">
        Choisissez une paroisse et un jour depuis la page des intentions.
      </p>
    );
  if (isLoading) return <SkeletonList count={3} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <style>{STYLE_IMPRESSION}</style>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimer
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={paths.app.paroisse.intentions.getHref()}>
            Retour aux intentions
          </Link>
        </Button>
      </div>
      <article
        id="feuille-intentions"
        aria-label="Feuille des intentions"
        className="space-y-5 rounded-xl border border-border bg-card p-6 print:border-0"
      >
        <header>
          <h2 className="text-lg font-semibold">
            Intentions de messe · {data.node.name}
          </h2>
          <p className="text-sm capitalize text-muted-foreground">
            {jourLong(data.date)}
          </p>
        </header>
        {data.masses.map((m) => (
          <section
            key={`${m.place_id}-${m.start_time}`}
            className="space-y-2 break-inside-avoid"
          >
            <h3 className="text-sm font-semibold">
              {m.label || heureCourte(m.start_time)} · {m.place_name}
            </h3>
            <Lignes lignes={m.intentions} />
          </section>
        ))}
        {data.other_intentions.length > 0 && (
          <section className="space-y-2 break-inside-avoid">
            <h3 className="text-sm font-semibold">Autres intentions du jour</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {data.other_intentions.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.intention}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[
                      l.scheduled_mass,
                      l.kind_label,
                      `Demandée par : ${l.announced_as}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </div>
  );
}
