'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  type Compteur,
  useAjouterCompteur,
  useEquipeCompteurs,
  useRenommerCompteur,
  useRetirerCompteur,
} from '../../api/compteurs';

import { panelClasses } from './parts';

const LigneCompteur = ({
  nodeId,
  compteur,
}: {
  nodeId: string;
  compteur: Compteur;
}) => {
  const id = useId();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(compteur.nom);
  const renommer = useRenommerCompteur(nodeId);
  const retirer = useRetirerCompteur(nodeId);
  const erreur = renommer.error ?? retirer.error;
  return (
    <li className="flex flex-col gap-1 py-2">
      {edition ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim())
              renommer.mutate(
                { id: compteur.id, nom: nom.trim() },
                { onSuccess: () => setEdition(false) },
              );
          }}
        >
          <Input
            id={id}
            aria-label={`Nouveau nom de ${compteur.nom}`}
            controlSize="xs"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <Button type="submit" size="sm" loading={renommer.isPending}>
            Enregistrer
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-14 text-ink">{compteur.nom}</span>
          <span className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEdition(true)}
              aria-label={`Renommer ${compteur.nom}`}
            >
              Renommer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={retirer.isPending}
              onClick={() => retirer.mutate(compteur.id)}
              aria-label={`Retirer ${compteur.nom}`}
            >
              Retirer
            </Button>
          </span>
        </div>
      )}
      {erreur && (
        <p role="alert" className="m-0 text-13 text-err">
          {erreur.message}
        </p>
      )}
    </li>
  );
};

/** Équipe des compteurs habilités (APP-G08b, version web) : proposée à la saisie des quêtes. */
export const EquipeCompteurs = ({ nodeId }: { nodeId: string }) => {
  const id = useId();
  const { data, isPending } = useEquipeCompteurs(nodeId);
  const ajouter = useAjouterCompteur(nodeId);
  const [nom, setNom] = useState('');
  const actifs = (data?.compteurs ?? []).filter((c) => c.actif);
  const ajouterNom = (n: string) =>
    ajouter.mutate(n.trim(), { onSuccess: () => setNom('') });

  return (
    <section
      aria-labelledby={`${id}-titre`}
      className={`${panelClasses} p-6 pt-5`}
    >
      <h2 id={`${id}-titre`} className="m-0 text-18 font-semibold text-ink">
        Équipe des compteurs
      </h2>
      <p className="m-0 mt-1 text-14 text-ink-2">
        Chaque quête est comptée par deux personnes distinctes de l’équipe.
      </p>
      {!isPending && actifs.length === 0 ? (
        <p className="m-0 mt-3 text-14 text-ink-3">
          Aucun compteur pour l’instant.
        </p>
      ) : (
        <ul
          aria-label="Compteurs habilités"
          className="m-0 mt-2 list-none divide-y divide-line p-0"
        >
          {actifs.map((c) => (
            <LigneCompteur key={c.id} nodeId={nodeId} compteur={c} />
          ))}
        </ul>
      )}
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (nom.trim()) ajouterNom(nom);
        }}
      >
        <Input
          aria-label="Ajouter un compteur"
          controlSize="xs"
          placeholder="Awa Faye"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          loading={ajouter.isPending}
        >
          Ajouter
        </Button>
      </form>
      {(data?.noms_recents.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="m-0 text-13 text-ink-3">
            Vus dans les quêtes récentes :
          </p>
          <div className="flex flex-wrap gap-2">
            {data?.noms_recents.map((n) => (
              <Button
                key={n}
                size="sm"
                variant="outline"
                onClick={() => ajouterNom(n)}
                aria-label={`Ajouter ${n} à l’équipe`}
              >
                + {n}
              </Button>
            ))}
          </div>
        </div>
      )}
      {ajouter.isError && (
        <p role="alert" className="m-0 mt-2 text-13 text-err">
          {ajouter.error.message}
        </p>
      )}
    </section>
  );
};
