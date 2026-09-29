'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
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
    return <p className="text-14 text-ink-3">Aucune intention.</p>;
  return (
    <ol className="list-decimal space-y-2 pl-5 text-14">
      {lignes.map((l) => (
        <li key={l.id}>
          <span className="font-medium">{l.intention}</span>
          <span className="block text-13 text-ink-3">
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
      <p className="text-14 text-ink-3">
        Choisissez une paroisse et un jour depuis la page des intentions.
      </p>
    );
  if (isLoading) return <LoadingBlock />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <style>{STYLE_IMPRESSION}</style>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button size="sm" onClick={() => window.print()}>
          <Icon name="imprimer" className="size-4" aria-hidden="true" />
          Imprimer
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={paths.espace.intentions.root.getHref(node)}>
            Retour aux intentions
          </Link>
        </Button>
      </div>
      <article
        id="feuille-intentions"
        aria-label="Feuille des intentions"
        className="space-y-5 rounded-xl border border-line bg-surface p-6 print:border-0"
      >
        <header>
          <h2 className="text-18 font-semibold">
            Intentions de messe · {data.node.name}
          </h2>
          <p className="text-14 capitalize text-ink-3">{jourLong(data.date)}</p>
        </header>
        {data.masses.map((m) => (
          <section
            key={`${m.place_id}-${m.start_time}`}
            className="space-y-2 break-inside-avoid"
          >
            <h3 className="text-14 font-semibold">
              {m.label || heureCourte(m.start_time)} · {m.place_name}
            </h3>
            <Lignes lignes={m.intentions} />
          </section>
        ))}
        {data.other_intentions.length > 0 && (
          <section className="space-y-2 break-inside-avoid">
            <h3 className="text-14 font-semibold">Autres intentions du jour</h3>
            <ol className="list-decimal space-y-2 pl-5 text-14">
              {data.other_intentions.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.intention}</span>
                  <span className="block text-13 text-ink-3">
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
