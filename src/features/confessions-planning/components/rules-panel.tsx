'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-error-details';
import { clockLabel } from '@/utils/availability-label';

import { usePlaces } from '../api/get-places';
import { useDeleteRule, useRules } from '../api/rules';

import { RuleForm, WEEKDAYS } from './rule-form';

/** Panneau « Créneaux récurrents » : mes règles et la création d'une nouvelle règle. */
export const RulesPanel = ({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}) => {
  const rules = useRules({ enabled: true });
  const places = usePlaces(nodeId, { enabled: true });
  const remove = useDeleteRule();
  const active = (rules.data ?? []).filter(
    (r) => r.is_active && r.place.node_id === nodeId,
  );
  const activePlaces = (places.data ?? []).filter((p) => p.is_active);

  return (
    <section
      id="panneau-recurrent"
      aria-labelledby="titre-recurrent"
      className="flex flex-col gap-5 border border-line-strong bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="titre-recurrent"
            className="m-0 font-serif text-h3 font-normal text-ink"
          >
            Nouveaux créneaux récurrents
          </h2>
          <p className="m-0 mt-1 text-sm text-ink-2">
            Pour vous-même : chaque prêtre ouvre ses propres créneaux.
          </p>
        </div>
        <IconButton icon="x" label="Fermer le panneau" onClick={onClose} />
      </div>

      {places.isPending ? (
        <LoadingBlock label="Chargement des lieux…" lines={2} />
      ) : places.isError || activePlaces.length === 0 ? (
        <EmptyState icon="pin" title="Aucun lieu de culte actif">
          Les lieux se gèrent dans les horaires de la paroisse.
        </EmptyState>
      ) : (
        <RuleForm places={activePlaces} onDone={onClose} />
      )}

      <div>
        <p className="tnum m-0 border-t border-line pt-2 text-meta text-ink-2">
          Mes règles en cours
        </p>
        {rules.isPending ? (
          <LoadingBlock label="Chargement de vos règles…" lines={1} />
        ) : active.length === 0 ? (
          <p className="m-0 py-2 text-sm text-ink-2">
            Aucune règle active sur cette paroisse.
          </p>
        ) : (
          <ul aria-label="Mes règles en cours" className="m-0 list-none p-0">
            {active.map((rule) => {
              const label = `Chaque ${WEEKDAYS[rule.weekday]}, ${clockLabel(rule.start_time)}-${clockLabel(rule.end_time)}`;
              return (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2"
                >
                  <span className="text-base text-ink">
                    {label}
                    <span className="block text-sm text-ink-2">
                      {rule.place.name} · créneaux de {rule.slot_minutes} min
                    </span>
                  </span>
                  <Button
                    variant="tertiary"
                    size="sm"
                    aria-label={`Désactiver : ${label}`}
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(rule.id, {
                        onSuccess: () =>
                          toast.ok(
                            'Règle désactivée. Les rendez-vous déjà pris sont maintenus.',
                          ),
                        onError: (error) => toast.err(apiErrorMessage(error)),
                      })
                    }
                  >
                    Désactiver
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
