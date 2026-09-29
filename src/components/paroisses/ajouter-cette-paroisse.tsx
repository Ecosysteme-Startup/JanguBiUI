'use client';

import { useState } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
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
  variant = 'primary',
  size = 'md',
  className,
  libelle = 'Ajouter cette paroisse',
}: AjouterCetteParoisseProps) {
  const [ouvert, setOuvert] = useState(false);
  const [principale, setPrincipale] = useState(false);
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
        onClick={() => {
          ajouter.reset();
          setPrincipale(false);
          setOuvert(true);
        }}
      >
        <Icon name="plus" size={16} />
        {libelle}
      </Button>
      <Modal
        open={ouvert}
        onOpenChange={setOuvert}
        title={`Ajouter ${paroisse.name}`}
        description="Vous devenez membre de cette paroisse, sans démarche à faire."
        footer={
          <>
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
              loading={ajouter.isPending}
            >
              Ajouter à mes paroisses
            </Button>
          </>
        }
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-14 text-ink">
          <li className="flex gap-2">
            <Icon
              name="check"
              size={16}
              className="mt-0.5 shrink-0 text-primary"
            />
            Ses enregistrements réservés aux paroissiens vous seront ouverts, y
            compris hors ligne.
          </li>
          <li className="flex gap-2">
            <Icon
              name="check"
              size={16}
              className="mt-0.5 shrink-0 text-primary"
            />
            Ses annonces iront dans « Autres paroisses », sans notification.
          </li>
          {actuelle && !principale && (
            <li className="flex gap-2">
              <Icon
                name="check"
                size={16}
                className="mt-0.5 shrink-0 text-primary"
              />
              {actuelle} reste votre paroisse principale.
            </li>
          )}
        </ul>
        {!deja && (
          <Choice
            className="mt-4"
            label="En faire ma paroisse principale"
            checked={principale}
            onChange={(e) => setPrincipale(e.target.checked)}
          />
        )}
        {erreur && (
          <p role="alert" className="m-0 mt-3 text-14 text-err">
            {erreur}
          </p>
        )}
      </Modal>
    </>
  );
}
