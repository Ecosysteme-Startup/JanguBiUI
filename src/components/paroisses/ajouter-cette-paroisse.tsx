'use client';

import { Check, Plus } from 'lucide-react';
import { useId, useState } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-client';
import {
  messageAdhesion,
  type ParoisseRef,
  useAjouterParoisse,
  useMesParoisses,
} from '@/lib/paroisses/api';

interface AjouterCetteParoisseProps {
  paroisse: ParoisseRef;
  /** Appelé une fois la paroisse ajoutée (relire l'album, relancer la piste). */
  onAjoutee?: () => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  libelle?: string;
}

/**
 * « Ajouter cette paroisse » (décisions 4 et 6-8) : confirmation courte, puis
 * `POST /me/paroisses/`. Adhésion libre, sans validation ; la paroisse
 * principale ne change pas, sauf si la personne coche la case (maquette
 * APP-C10). Utilisé par l'album réservé et par le lecteur.
 */
export function AjouterCetteParoisse({
  paroisse,
  onAjoutee,
  variant = 'default',
  size = 'default',
  className,
  libelle = 'Ajouter cette paroisse',
}: AjouterCetteParoisseProps) {
  const [ouvert, setOuvert] = useState(false);
  const [principale, setPrincipale] = useState(false);
  const idCase = useId();
  const mes = useMesParoisses({ enabled: ouvert });
  const ajouter = useAjouterParoisse();
  const actuelle = mes.data?.find((m) => m.principale)?.paroisse.name;
  const deja = mes.data?.some((m) => m.paroisse.id === paroisse.id) ?? false;
  const erreur =
    ajouter.error instanceof ApiError
      ? messageAdhesion(ajouter.error.code)
      : ajouter.error
        ? messageAdhesion(null)
        : null;

  const confirmer = () =>
    ajouter.mutate(
      { paroisseId: paroisse.id, principale },
      {
        onSuccess: () => {
          setOuvert(false);
          onAjoutee?.();
        },
      },
    );

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        icon={<Plus className="size-4" aria-hidden />}
        onClick={() => {
          ajouter.reset();
          setPrincipale(false);
          setOuvert(true);
        }}
      >
        {libelle}
      </Button>
      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Ajouter {paroisse.name}</DialogTitle>
            <DialogDescription>
              Vous devenez membre de cette paroisse, sans démarche à faire.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              Ses enregistrements réservés aux paroissiens vous seront ouverts,
              y compris hors ligne.
            </li>
            <li className="flex gap-2">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              Ses annonces iront dans « Autres paroisses », sans notification.
            </li>
            {actuelle && !principale && (
              <li className="flex gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                {actuelle} reste votre paroisse principale.
              </li>
            )}
          </ul>
          {!deja && (
            <div className="flex items-center gap-2.5">
              <Checkbox
                id={idCase}
                checked={principale}
                onCheckedChange={(v) => setPrincipale(v === true)}
              />
              <label htmlFor={idCase} className="text-sm text-foreground">
                En faire ma paroisse principale
              </label>
            </div>
          )}
          {erreur && (
            <p role="alert" className="text-sm text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOuvert(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={confirmer}
              isLoading={ajouter.isPending}
            >
              Ajouter à mes paroisses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
