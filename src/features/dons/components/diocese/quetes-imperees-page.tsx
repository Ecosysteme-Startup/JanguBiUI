'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { useImperees } from '../../api/imperees';

import { ImpereeFollow } from './imperee-follow';
import { defaultImperee } from './imperee-labels';
import { ImpereeList } from './imperee-list';
import { ImpereePanel } from './imperee-panel';
import { PayoutsReceived } from './payouts-received';

/**
 * Quêtes impérées du diocèse (WEB-DIO-Quetes-Imperees, dons.definir_quete_imperee) : liste de
 * l'année, suivi par paroisse en totaux, reversements reçus et panneau « Définir une quête impérée ».
 * La quête suivie est dans l'URL (`?quete=<id>`) ; par défaut, la première ouverte.
 */
export const QuetesImpereesPage = ({ nodeId }: { nodeId: string }) => {
  const router = useRouter();
  const params = useSearchParams();
  const [chosen, setChosen] = React.useState<string | null>(
    params.get('quete'),
  );
  const [panelOpen, setPanelOpen] = React.useState(true);
  const imperees = useImperees(nodeId);
  const list = imperees.data ?? [];
  const selected = list.find((q) => q.id === chosen) ?? defaultImperee(list);

  const select = (id: string) => {
    setChosen(id);
    router.replace(paths.espace.quetesImperees.getHref(nodeId, id), {
      scroll: false,
    });
  };

  return (
    <div>
      <PageHeader
        compact
        title="Quêtes impérées"
        description="Les quêtes prescrites par l’Ordinaire et leur suivi par paroisse, en totaux."
        actions={
          !panelOpen && (
            <Button
              variant="outline"
              className="min-h-11 text-14"
              onClick={() => setPanelOpen(true)}
            >
              <Icon name="plus" size={18} className="text-ink-2" />
              Définir une quête impérée
            </Button>
          )
        }
      />
      <div
        className={
          panelOpen
            ? 'mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_344px]'
            : 'mt-8'
        }
      >
        <div className="flex min-w-0 flex-col gap-6">
          {imperees.isPending ? (
            <Card>
              <LoadingBlock label="Chargement des quêtes impérées…" lines={3} />
            </Card>
          ) : imperees.isError ? (
            <Card>
              <EmptyState
                tone="err"
                icon="alerte"
                title="Les quêtes impérées n’ont pas pu être chargées"
              >
                {imperees.error.message}
              </EmptyState>
            </Card>
          ) : list.length === 0 ? (
            <Card>
              <EmptyState icon="don" title="Aucune quête impérée">
                Les quêtes prescrites par l’Ordinaire apparaîtront ici, avec
                leur suivi par paroisse.
              </EmptyState>
            </Card>
          ) : (
            <>
              <ImpereeList
                imperees={list}
                selectedId={selected?.id}
                onSelect={select}
              />
              {selected && <ImpereeFollow imperee={selected} />}
            </>
          )}
          <PayoutsReceived nodeId={nodeId} />
        </div>
        {panelOpen && (
          <ImpereePanel
            nodeId={nodeId}
            onClose={() => setPanelOpen(false)}
            onCreated={(i) => select(i.id)}
          />
        )}
      </div>
    </div>
  );
};
