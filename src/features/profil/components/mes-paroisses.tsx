'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import {
  formatDateAdhesion,
  type MaParoisse,
  messageAdhesion,
  useAjouterParoisse,
  useDefinirPrincipale,
  useMesParoisses,
  useQuitterParoisse,
  useRechercheParoisses,
} from '@/lib/paroisses/api';
import { cn } from '@/utils/cn';

const lieu = (p: MaParoisse['paroisse']) =>
  [p.city, p.deanery_name ? `doyenné ${p.deanery_name}` : null]
    .filter(Boolean)
    .join(' · ');

function messageErreur(err: unknown): string | null {
  if (!err) return null;
  return messageAdhesion(err instanceof ApiError ? err.code : null);
}

function PastillePrincipale() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary-fill px-2.5 text-13 font-semibold text-on-primary">
      <Star className="size-3.5 fill-current" aria-hidden />
      Principale
    </span>
  );
}

function QuitterDialog({
  paroisse,
  onConfirm,
  onOpenChange,
  pending,
}: {
  paroisse: MaParoisse['paroisse'] | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
}) {
  return (
    <Dialog open={!!paroisse} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Quitter {paroisse?.name} ?</DialogTitle>
          <DialogDescription>
            Ses enregistrements réservés aux paroissiens ne vous seront plus
            ouverts, et ceux que vous avez téléchargés seront retirés de vos
            appareils. Vous pourrez l’ajouter de nouveau quand vous voudrez.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={pending}
          >
            Quitter la paroisse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AjouterUneParoisse({ mes }: { mes: MaParoisse[] }) {
  const [q, setQ] = useState('');
  const recherche = useRechercheParoisses(q);
  const ajouter = useAjouterParoisse();
  const [ajoutee, setAjoutee] = useState<string | null>(null);
  const statut = (id: string) => mes.find((m) => m.paroisse.id === id);
  const erreur = messageErreur(ajouter.error);
  const resultats = q.trim().length >= 2 ? (recherche.data ?? []) : [];

  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <h3 className="text-15 font-semibold text-ink">Ajouter une paroisse</h3>
      <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-14 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <Icon name="recherche" className="size-4 text-ink-3" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAjoutee(null);
          }}
          placeholder="Nom de la paroisse ou quartier"
          aria-label="Rechercher une paroisse à ajouter"
          className="h-full min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </label>
      {erreur && (
        <p role="alert" className="mt-2 text-14 text-err">
          {erreur}
        </p>
      )}
      {q.trim().length >= 2 &&
        !recherche.isFetching &&
        resultats.length === 0 && (
          <p className="mt-3 text-14 text-ink-3">
            Aucune paroisse ne correspond à « {q.trim()} ».
          </p>
        )}
      {resultats.length > 0 && (
        <ul aria-label="Paroisses trouvées" className="mt-3 space-y-2">
          {resultats.map((p) => {
            const m = statut(p.id);
            const detail = [
              p.city,
              p.deanery_name ? `doyenné ${p.deanery_name}` : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <li
                key={p.id}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-50 text-primary">
                  <Icon name="paroisse" className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-14 font-semibold text-ink">
                    {p.name}
                  </span>
                  <span className="block text-13 leading-[18px] text-ink-3">
                    {detail ? `${detail}. ` : ''}
                    {m
                      ? m.principale
                        ? 'Votre paroisse principale.'
                        : 'Déjà dans vos paroisses.'
                      : 'Ses enregistrements réservés vous seront ouverts ; ses annonces iront dans « Autres paroisses ».'}
                  </span>
                </span>
                {m ? (
                  m.principale ? (
                    <PastillePrincipale />
                  ) : (
                    <span className="inline-flex h-8 items-center gap-1 text-14 font-medium text-ink-3">
                      <Icon name="check" className="size-4" aria-hidden />
                      {ajoutee === p.id ? 'Ajoutée' : 'Membre'}
                    </span>
                  )
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    aria-label={`Ajouter ${p.name}`}
                    loading={
                      ajouter.isPending &&
                      ajouter.variables?.paroisseId === p.id
                    }
                    onClick={() =>
                      ajouter.mutate(
                        { paroisseId: p.id },
                        { onSuccess: () => setAjoutee(p.id) },
                      )
                    }
                  >
                    <Icon name="plus" className="size-4" aria-hidden />
                    Ajouter
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * « Mes paroisses » du profil (décisions 6-8, maquette WEB-FID-Mes-Paroisses) :
 * la paroisse principale, les autres paroisses (définir comme principale,
 * quitter), l'ajout d'une paroisse et deux encadrés d'explication. Adhésion
 * libre, sans validation ; aucun classement entre paroisses.
 */
export function MesParoisses() {
  const { data, isLoading, isError, refetch } = useMesParoisses();
  const principale = useDefinirPrincipale();
  const quitter = useQuitterParoisse();
  const [aQuitter, setAQuitter] = useState<MaParoisse['paroisse'] | null>(null);
  const erreur = messageErreur(principale.error ?? quitter.error);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="text-14 text-ink-3">
        Vos paroisses n’ont pas pu être chargées.{' '}
        <button
          type="button"
          onClick={() => void refetch()}
          className="font-medium text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const main = data.find((m) => m.principale) ?? null;
  const autres = data.filter((m) => !m.principale);

  return (
    <div className="space-y-5">
      {main ? (
        <div className="flex items-start gap-3 rounded-xl border border-tint-300 bg-tint-50 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint-50 text-primary">
            <Icon name="accueil" className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-15 font-semibold text-ink">
                {main.paroisse.name}
              </span>
              <PastillePrincipale />
            </span>
            <span className="mt-0.5 block text-13 leading-[18px] text-ink-3">
              {[
                lieu(main.paroisse),
                main.membre_depuis
                  ? `membre depuis le ${formatDateAdhesion(main.membre_depuis)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line p-4 text-14 text-ink-3">
          Vous n’êtes membre d’aucune paroisse pour l’instant. La première que
          vous ajoutez devient votre paroisse principale.
        </p>
      )}

      {autres.length > 0 && (
        <div>
          <h3 className="text-15 font-semibold text-ink">
            Autres paroisses{' '}
            <span className="font-normal text-ink-3">· {autres.length}</span>
          </h3>
          <ul aria-label="Autres paroisses" className="mt-2 space-y-2">
            {autres.map((m) => (
              <li
                key={m.paroisse.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">
                    <Icon name="paroisse" className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-14 font-semibold text-ink">
                      {m.paroisse.name}
                    </span>
                    <span className="block text-13 leading-[18px] text-ink-3">
                      {[
                        m.paroisse.city,
                        m.membre_depuis
                          ? `ajoutée le ${formatDateAdhesion(m.membre_depuis)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Définir ${m.paroisse.name} comme principale`}
                    loading={
                      principale.isPending &&
                      principale.variables === m.paroisse.id
                    }
                    onClick={() => principale.mutate(m.paroisse.id)}
                  >
                    <Star className="size-3.5" aria-hidden />
                    Définir comme principale
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-err hover:text-err"
                    aria-label={`Quitter ${m.paroisse.name}`}
                    onClick={() => {
                      quitter.reset();
                      setAQuitter(m.paroisse);
                    }}
                  >
                    <Icon name="deconnexion" className="size-3.5" aria-hidden />
                    Quitter
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {erreur && (
        <p role="alert" className="text-14 text-err">
          {erreur}
        </p>
      )}

      <AjouterUneParoisse mes={data} />

      <div className="grid gap-3 lg:grid-cols-2">
        <section
          aria-labelledby="paroisse-principale-titre"
          className="rounded-xl bg-surface-2 p-4"
        >
          <h3
            id="paroisse-principale-titre"
            className="text-14 font-semibold text-ink"
          >
            Ce que change la paroisse principale
          </h3>
          <ul className="mt-2 space-y-1.5 text-13 leading-[18px] text-ink-3">
            {[
              'L’accueil, les horaires des messes et les annonces avec notifications viennent d’elle. C’est aussi elle qui vous est proposée pour les dons.',
              'Toutes vos paroisses, principale ou non, vous ouvrent leurs enregistrements réservés aux paroissiens.',
              'Les annonces des autres paroisses sont réunies dans un fil séparé, « Autres paroisses », sans notification.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="check"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden
                />
                {t}
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="adhesion-libre-titre"
          className={cn('rounded-xl bg-surface-2 p-4')}
        >
          <h3
            id="adhesion-libre-titre"
            className="text-14 font-semibold text-ink"
          >
            Une adhésion libre
          </h3>
          <p className="mt-2 text-13 leading-[18px] text-ink-3">
            Vous ajoutez et quittez une paroisse vous-même, sans validation. Une
            paroisse peut aussi retirer un membre ; vous en êtes alors prévenu.
          </p>
          <p className="mt-2 text-13 leading-[18px] text-ink-3">
            Quitter une paroisse retire de vos appareils ses enregistrements
            réservés téléchargés. Vos demandes d’actes ne changent pas : elles
            restent à la paroisse du sacrement.
          </p>
        </section>
      </div>

      <QuitterDialog
        paroisse={aQuitter}
        pending={quitter.isPending}
        onOpenChange={(open) => {
          if (!open) setAQuitter(null);
        }}
        onConfirm={() => {
          if (!aQuitter) return;
          quitter.mutate(aQuitter.id, {
            onSettled: () => setAQuitter(null),
          });
        }}
      />
    </div>
  );
}
