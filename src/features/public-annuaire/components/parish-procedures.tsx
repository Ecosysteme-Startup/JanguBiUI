'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { useNodeWeek } from '../api/get-node-week';
import { weeklyRows } from '../utils/schedule';

/**
 * « Démarches » de la fiche (WEB-Fiche-Paroisse) : demander un extrait d'acte (original papier à
 * retirer) et réserver un créneau de confession. Seulement pour une paroisse ouverte.
 */
export const ParishProcedures = ({ nodeId, delayDays }: { nodeId: string; delayDays: number | null }) => {
  const { data } = useNodeWeek(nodeId);
  const confessions = weeklyRows((data?.occurrences ?? []).filter((o) => o.kind === 'confession'));
  const action = cn(buttonVariants({ variant: 'outline' }), 'mt-3 min-h-11 w-full');
  return (
    <section aria-labelledby="h-demarches" className="rounded-16 border border-line bg-surface p-6">
      <h2 id="h-demarches" className="m-0 text-17 font-semibold text-ink">
        Démarches
      </h2>
      <h3 className="m-0 mt-3 text-15 font-semibold text-ink">Extrait d&apos;acte de baptême ou de mariage</h3>
      <p className="m-0 mt-1 text-14 text-ink-2">
        Si le sacrement a été célébré ici, faites la demande en ligne. L&apos;original papier, signé et scellé, se retire au secrétariat.
        {delayDays ? ` Délai habituel : ${delayDays} jours.` : ''}
      </p>
      <NextLink href={paths.app.demandes.nouvelle.getHref()} className={action}>
        Demander un extrait
      </NextLink>
      <div className="mt-5 border-t border-line pt-5">
        <h3 className="m-0 text-15 font-semibold text-ink">Confession</h3>
        <p className="m-0 mt-1 text-14 text-ink-2">
          {confessions.length > 0
            ? `${confessions.map((row) => `${row.label} : ${row.text.charAt(0).toLowerCase()}${row.text.slice(1)}`).join(' ; ')}. Réservez un créneau pour éviter l’attente.`
            : 'Réservez un créneau auprès d’un prêtre de la paroisse.'}
        </p>
        <NextLink href={paths.app.confession.getHref()} className={action}>
          Prendre rendez-vous
        </NextLink>
      </div>
    </section>
  );
};
