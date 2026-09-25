import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuditJournal } from '@/features/audit/components/audit-journal';
import { grantsPlateforme, ids } from '@/testing/mocks/db';
import { f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { f8bHandlers } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8bHandlers));

beforeEach(() => {
  resetF8b();
  navigation.replace.mockClear();
});

describe('Journal d’audit', () => {
  it('lit ses filtres dans l’URL et les transmet à l’API', async () => {
    renderApp(<AuditJournal filters={{ action: 'office.', date_from: '2026-09-01' }} />, { capacites: grantsPlateforme });

    expect(await screen.findByText('Nomination créée')).toBeInTheDocument();
    expect(screen.queryByText(/demande d.acte : prête à retirer/i)).not.toBeInTheDocument();
    const url = new URL(f8bState.requests.at(-1)!.url);
    expect(url.searchParams.get('action')).toBe('office.');
    expect(url.searchParams.get('date_from')).toBe('2026-09-01');
    expect(screen.getByLabelText('Action')).toHaveValue('office.');
  });

  it('écrit chaque changement de filtre dans l’URL', async () => {
    const user = userEvent.setup();
    renderApp(<AuditJournal filters={{ action: 'office.' }} />, { capacites: grantsPlateforme });

    await screen.findByText('Nomination créée');
    await user.selectOptions(await screen.findByLabelText('Nœud'), ids.dakar);
    expect(navigation.replace).toHaveBeenLastCalledWith(`/plateforme/audit?action=office.&node=${ids.dakar}`, { scroll: false });

    await user.type(screen.getByLabelText('Acteur'), 'pas-un-uuid{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(/format uuid/i);

    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/plateforme/audit', { scroll: false });
  });

  it('traduit les actions et nomme les nœuds connus', async () => {
    renderApp(<AuditJournal filters={{}} />, { capacites: grantsPlateforme });

    const row = (await screen.findByText('Demande d’acte : prête à retirer')).closest('tr')!;
    expect(within(row).getByText('Demande d’acte n° 403')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Capacité retirée à un office').closest('tr')).toHaveTextContent('Archidiocèse de Dakar'));
    expect(screen.getByText('Capacité retirée à un office').closest('tr')).toHaveTextContent('Système');
  });
});
