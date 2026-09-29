'use client';

import { Users } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { type NoeudStaff } from '@/lib/staff/capacites';

import {
  type Compteur,
  useAjouterCompteur,
  useEquipeCompteurs,
  useRenommerCompteur,
  useRetirerCompteur,
} from '../api/dons-staff';

const champ =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const messageErreur = (e: unknown) =>
  e instanceof ApiError ? e.message : 'L’opération n’a pas abouti.';

/** Noms proposés dans la saisie d'une quête : l'équipe active, puis les récents. */
export const nomsProposes = (
  data: { compteurs: Compteur[]; noms_recents: string[] } | undefined,
): string[] => [
  ...(data?.compteurs ?? []).filter((c) => c.actif).map((c) => c.nom),
  ...(data?.noms_recents ?? []),
];

function LigneCompteur({ compteur }: { compteur: Compteur }) {
  const id = useId();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(compteur.nom);
  const renommer = useRenommerCompteur();
  const retirer = useRetirerCompteur();
  const erreur = renommer.error ?? retirer.error;
  return (
    <li className="space-y-1 py-2">
      {edition ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            renommer.mutate(
              { id: compteur.id, nom: nom.trim() },
              { onSuccess: () => setEdition(false) },
            );
          }}
        >
          <label htmlFor={id} className="sr-only">
            Nom
          </label>
          <input
            id={id}
            className={champ}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <Button type="submit" size="sm" isLoading={renommer.isPending}>
            Enregistrer
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">{compteur.nom}</span>
          <span className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEdition(true)}>
              Renommer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isLoading={retirer.isPending}
              onClick={() => retirer.mutate(compteur.id)}
            >
              Retirer
            </Button>
          </span>
        </div>
      )}
      {erreur && (
        <p role="alert" className="text-xs text-destructive">
          {messageErreur(erreur)}
        </p>
      )}
    </li>
  );
}

/** Équipe des compteurs habilités (APP-G08b, version web). */
export function EquipeCompteurs({
  noeud,
  onClose,
}: {
  noeud: NoeudStaff;
  onClose: () => void;
}) {
  const id = useId();
  const { data, isLoading } = useEquipeCompteurs(noeud.id);
  const ajouter = useAjouterCompteur();
  const [nom, setNom] = useState('');
  const actifs = (data?.compteurs ?? []).filter((c) => c.actif);

  const ajouterNom = (n: string) =>
    ajouter.mutate(
      { node: noeud.id, nom: n.trim() },
      { onSuccess: () => setNom('') },
    );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Équipe des compteurs</DialogTitle>
          <DialogDescription>
            Chaque quête est comptée par deux personnes distinctes de l’équipe.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : actifs.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Aucun compteur"
            description="Ajoutez les personnes qui comptent les quêtes."
          />
        ) : (
          <ul
            className="divide-y divide-border"
            aria-label="Compteurs habilités"
          >
            {actifs.map((c) => (
              <LigneCompteur key={c.id} compteur={c} />
            ))}
          </ul>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim()) ajouterNom(nom);
          }}
        >
          <div className="flex-1 space-y-1">
            <label htmlFor={id} className="text-sm font-medium">
              Ajouter un compteur
            </label>
            <input
              id={id}
              className={champ}
              placeholder="Awa Faye"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" isLoading={ajouter.isPending}>
            Ajouter
          </Button>
        </form>
        {(data?.noms_recents.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Vus dans les quêtes récentes :
            </p>
            <div className="flex flex-wrap gap-2">
              {data?.noms_recents.map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant="outline"
                  onClick={() => ajouterNom(n)}
                >
                  + {n}
                </Button>
              ))}
            </div>
          </div>
        )}
        {ajouter.isError && (
          <p role="alert" className="text-sm text-destructive">
            {messageErreur(ajouter.error)}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
