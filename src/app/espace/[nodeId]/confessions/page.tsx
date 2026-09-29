'use client';

import { use } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ConfessionsPlanning } from '@/features/confessions-planning/components/confessions-planning';
import { RequireCapability } from '@/lib/can';

type Props = { params: Promise<{ nodeId: string }> };

// Créneaux de confession (PAR-Confessions) : confessions.gerer ou confessions.voir_planning.
const ConfessionsPage = ({ params }: Props) => {
  const nodeId = decodeURIComponent(use(params).nodeId);
  return (
    <RequireCapability
      capacite={['confessions.gerer', 'confessions.voir_planning']}
      nodeId={nodeId}
      fallback={
        <EmptyState
          icon="cadenas"
          title="Le planning des confessions ne vous est pas ouvert"
        >
          Il est réservé aux prêtres qui confessent et au secrétariat de la
          paroisse.
        </EmptyState>
      }
    >
      <ConfessionsPlanning nodeId={nodeId} />
    </RequireCapability>
  );
};

export default ConfessionsPage;
