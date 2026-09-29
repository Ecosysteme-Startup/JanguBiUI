'use client';

import { EffacerHistoriqueLecture } from '@/components/personnalisation/effacer-historique';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/form/switch';
import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import {
  useModifierReglagesParole,
  useReglagesParole,
} from '@/lib/personnalisation/parole';

import { definirSignauxActifs } from '../utils/signaux-lecture';

const SIGNAUX = [
  {
    titre: 'Vos lectures',
    detail: 'Les chapitres que vous ouvrez et ceux que vous terminez.',
  },
  {
    titre: 'Vos signets et surlignages',
    detail: 'Les versets que vous avez marqués.',
  },
  {
    titre: 'Vos recherches',
    detail: 'Le verset ouvert depuis les résultats, jamais le texte recherché.',
  },
  {
    titre: 'Le jour liturgique',
    detail: "Les lectures du jour et le temps de l'année liturgique.",
  },
];

/**
 * « Pourquoi ? » (spec C3 : contenu de la feuille APP-B10) : les signaux
 * utilisés, ce qui ne l'est jamais, l'interrupteur et l'effacement.
 */
export function PourquoiSuggestions({
  ouvert,
  onOuvertChange,
  exemple,
}: {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
  /** Raison réelle du jour, en exemple (« Parce que vous lisez Luc »). */
  exemple?: string | null;
}) {
  const { data: reglages } = useReglagesParole();
  const { mutate: modifier, isPending } = useModifierReglagesParole();
  const actif = reglages?.personnalisation_parole ?? true;

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Pourquoi ces suggestions ?</DialogTitle>
          <DialogDescription>
            Elles sont préparées chaque nuit à partir de vos lectures dans Jàngu
            Bi, et ne sont visibles que par vous.
          </DialogDescription>
        </DialogHeader>

        <section aria-labelledby="pq-utilises" className="space-y-2">
          <h3
            id="pq-utilises"
            className="text-sm font-semibold text-foreground"
          >
            Ce qui est utilisé
          </h3>
          <ul className="space-y-2">
            {SIGNAUX.map((s) => (
              <li key={s.titre} className="text-sm leading-5">
                <span className="font-medium text-foreground">{s.titre}</span>
                <span className="block text-muted-foreground">{s.detail}</span>
              </li>
            ))}
          </ul>
          {exemple && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground/80">
              Par exemple : «&nbsp;{exemple}&nbsp;».
            </p>
          )}
        </section>

        <section aria-labelledby="pq-jamais" className="space-y-1">
          <h3 id="pq-jamais" className="text-sm font-semibold text-foreground">
            Ce qui n&apos;est jamais utilisé
          </h3>
          <p className="text-sm text-muted-foreground">
            Vos messages, vos confessions, vos demandes et vos dons.
          </p>
        </section>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <label
            htmlFor="pq-suggestions"
            className="text-sm font-medium text-foreground"
          >
            Suggestions de lecture
          </label>
          <Switch
            id="pq-suggestions"
            checked={actif}
            disabled={!reglages || isPending}
            onCheckedChange={(v) =>
              modifier(v, { onSuccess: () => definirSignauxActifs(v) })
            }
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <EffacerHistoriqueLecture className="-ml-2" />
          <Link
            href={`${paths.app.profil.getHref()}#personnalisation`}
            className="text-sm font-medium text-primary"
            onClick={() => onOuvertChange(false)}
          >
            Tous les réglages
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
