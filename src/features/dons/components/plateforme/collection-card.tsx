import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SkeletonLine } from '@/components/ui/skeleton';

import { useActivations } from '../../api/platform';

import { InfoRow } from './info-row';

/**
 * « Collecte ouverte » (WEB-PLA-Paiements) : paroisses où la collecte est activée et référence
 * d'autorisation. Lecture seule : la maquette ne montre pas la gestion des activations.
 */
export const CollectionCard = () => {
  const activations = useActivations();
  const list = activations.data ?? [];
  const open = list.filter((a) => a.enabled);
  const preparing = list.length - open.length;
  const refs = [
    ...new Set(open.map((a) => a.authorization_ref).filter(Boolean)),
  ];
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="pa-cadre"
      className="px-6 py-5"
    >
      <h2 id="pa-cadre" className="m-0 text-18 font-semibold leading-[26px]">
        Collecte ouverte
      </h2>
      {activations.isPending ? (
        <div className="mt-3 flex flex-col gap-2">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-2/3" />
        </div>
      ) : activations.isError ? (
        <p className="m-0 mt-3 text-14 text-err">
          Les activations n’ont pas pu être chargées.
        </p>
      ) : (
        <dl className="m-0 mt-3">
          <InfoRow label="Paroisses ouvertes" last={refs.length === 0}>
            <strong className="tnum text-15 font-semibold text-ink">
              {open.length}
            </strong>
            {preparing > 0 && ` · ${preparing} en préparation`}
          </InfoRow>
          {refs.length > 0 && (
            <InfoRow
              label={refs.length > 1 ? 'Autorisations' : 'Autorisation'}
              last
            >
              <span className="tnum">
                {refs.length > 2 ? `${refs.length} décisions` : refs.join(', ')}
              </span>
            </InfoRow>
          )}
        </dl>
      )}
      <p className="m-0 mt-4 flex gap-2 text-13 text-ink-3">
        <Icon name="cadenas" size={16} className="mt-px shrink-0" />
        <span>
          Ni nom de donateur ni montant de don à ce niveau. Aucune donnée de
          paiement n’est conservée.
        </span>
      </p>
    </Card>
  );
};
