import { screen } from '@testing-library/react';

import { CapabilityDenied } from '@/features/actes-traitement/components/capability-denied';
import { QueueView } from '@/features/actes-traitement/components/queue-view';
import { RequireCapability } from '@/lib/can';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { resetActes } from '@/testing/mocks/db-f6-actes';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetActes());

const Page = () => (
  <RequireCapability capacite="actes.traiter" nodeId={ids.saintDominique} fallback={<CapabilityDenied />}>
    <QueueView nodeId={ids.saintDominique} />
  </RequireCapability>
);

describe('Garde actes.traiter', () => {
  it('ouvre la file avec la capacité sur la paroisse', async () => {
    renderApp(<Page />, { capacites: grantsSecretaire });

    expect(await screen.findByRole('heading', { name: 'Demandes d’actes' })).toBeInTheDocument();
  });

  it('refuse l’accès sans la capacité sur ce nœud', async () => {
    renderApp(<Page />, { capacites: grantsChancelier });

    expect(await screen.findByText('Accès réservé au traitement des actes.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
