import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { MyIntentions } from '@/features/accueil/components/my-intentions';
import { intentionFollowUp } from '@/features/accueil/utils/intentions';
import { apiUrl } from '@/testing/mocks/api-url';
import { reinitialiserV1Complements } from '@/testing/mocks/handlers/v1-complements';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => reinitialiserV1Complements());

describe('Accueil fidèle : « Mes intentions de messe »', () => {
  it('liste mes dernières intentions avec leur statut et leur suivi, vers /app/intentions', async () => {
    renderApp(<MyIntentions />);

    const section = screen.getByRole('region', { name: 'Mes intentions de messe' });
    const rows = await within(section).findAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText(/repos de l.âme de joseph diouf/i)).toBeInTheDocument();
    expect(within(rows[0]).getByText('Planifiée')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/planifiée le lundi 2 novembre, messe de 18 h 30/i)).toBeInTheDocument();
    expect(within(rows[1]).getByText('En attente')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Refusée')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/app/intentions');
    expect(within(section).getByRole('link', { name: 'Toutes mes intentions' })).toHaveAttribute('href', '/app/intentions');
  });

  it('ne fait jamais appel au don ni au paiement', async () => {
    renderApp(<MyIntentions />);
    const section = screen.getByRole('region', { name: 'Mes intentions de messe' });
    await within(section).findAllByRole('listitem');
    expect(section).not.toHaveTextContent(/offrande|don\b|donner|payer|paiement|montant|fcfa/i);
    expect(within(section).queryByRole('link', { name: /don/i })).not.toBeInTheDocument();
  });

  it('invite à demander une intention quand il n’y en a aucune, sans appel au don', async () => {
    server.use(http.get(apiUrl('/mass-intentions/mine/'), () => HttpResponse.json({ count: 0, next: null, previous: null, results: [] })));
    renderApp(<MyIntentions />);

    expect(await screen.findByText('Aucune intention de messe pour le moment.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demander une intention' })).toHaveAttribute('href', '/app/intentions');
    expect(screen.getByRole('region', { name: 'Mes intentions de messe' })).not.toHaveTextContent(/offrande|paiement/i);
  });

  it('signale une erreur de chargement', async () => {
    server.use(http.get(apiUrl('/mass-intentions/mine/'), () => HttpResponse.json({}, { status: 500 })));
    renderApp(<MyIntentions />);
    expect(await screen.findByText('Vos intentions n’ont pas pu être chargées.')).toBeInTheDocument();
  });

  it('rédige la ligne de suivi selon le statut', () => {
    const base = { requested_mass: '', scheduled_mass: '', requested_date: null, scheduled_date: null, celebrated_at: null };
    expect(intentionFollowUp({ ...base, status: 'recue' })).toBe('Pas de date précise');
    expect(intentionFollowUp({ ...base, status: 'annulee' })).toBe('Demande annulée');
    expect(intentionFollowUp({ ...base, status: 'celebree', celebrated_at: '2026-10-11T10:00:00Z', scheduled_mass: 'Messe de 10 h' })).toBe(
      'Célébrée le dimanche 11 octobre, Messe de 10 h',
    );
  });
});
