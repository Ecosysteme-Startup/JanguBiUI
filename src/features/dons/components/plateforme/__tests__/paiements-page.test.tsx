import { screen, within } from '@testing-library/react';

import Page from '@/app/plateforme/paiements/page';
import { PaiementsPage } from '@/features/dons/components/plateforme/paiements-page';
import { grantsPlateforme } from '@/testing/mocks/db';
import { grantsEconomeDiocesain } from '@/testing/mocks/db-dons';
import { renderApp } from '@/testing/test-utils';

// Lundi 28 septembre 2026, 9 h (données de la maquette) : seule l'horloge est figée.
beforeEach(() =>
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-28T09:00:00Z') }),
);
afterEach(() => vi.useRealTimers());

describe('Paiements (plateforme)', () => {
  it('montre l’agrégateur, les notifications et ce qui reste à traiter', async () => {
    renderApp(<PaiementsPage />, { capacites: grantsPlateforme });

    expect(
      await screen.findByRole('heading', { name: 'PayDunya · mode test' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dernière notification il y a 4 minutes'),
    ).toBeInTheDocument();

    const notifications = screen.getByRole('table', {
      name: /notifications sur 24 heures et 7 jours/i,
    });
    expect(
      within(notifications).getByRole('row', { name: /reçues/i }),
    ).toHaveTextContent(/62\s*402/);
    expect(
      within(notifications).getByRole('row', { name: /traitées/i }),
    ).toHaveTextContent('388');
    expect(
      within(notifications).getByRole('row', { name: /doublons ignorés/i }),
    ).toHaveTextContent('9');
    expect(
      within(notifications).getByRole('row', { name: /rejetées, signature/i }),
    ).toHaveTextContent('3');
    expect(
      within(notifications).getByRole('row', { name: /erreurs/i }),
    ).toHaveTextContent('2');
    expect(screen.getByText(/sur 24 h, 2 en échec/i)).toBeInTheDocument();

    const todo = screen.getByRole('region', { name: 'À traiter' });
    expect(
      within(todo).getByText('Paiements en attente').parentElement,
    ).toHaveTextContent('3');
    expect(
      within(todo).getByText('Le plus ancien depuis 26 h'),
    ).toBeInTheDocument();
    expect(
      within(todo).getByText('Reversement à rapprocher').parentElement,
    ).toHaveTextContent('1');
    expect(
      within(todo).getByText('Écart de reversement').parentElement,
    ).toHaveTextContent('1');

    const collecte = screen.getByRole('region', { name: 'Collecte ouverte' });
    expect(
      await within(collecte).findByText('ARCH-DAK-2026-041'),
    ).toBeInTheDocument();
    expect(
      within(collecte).getByText('Paroisses ouvertes').parentElement,
    ).toHaveTextContent('1');
  });

  it('traduit les incidents et recommande une action, sans nom ni montant de donateur', async () => {
    renderApp(<PaiementsPage />, { capacites: grantsPlateforme });

    const table = await screen.findByRole('table', {
      name: 'Incidents de paiement',
    });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent(
      /07:42\s*Aujourd’hui\s*Signature invalide.*Vérifier la clé de signature/,
    );
    expect(rows[1]).toHaveTextContent(
      /18:05\s*Hier\s*Montant incohérent.*Demander le détail à l’agrégateur/,
    );
    expect(rows[2]).toHaveTextContent(
      /Paiement tardif.*rembourser le donateur/,
    );
    expect(rows[3]).toHaveTextContent(
      /22:14\s*Sam\. 26 sept\.\s*Agrégateur injoignable.*Suivre la page de statut/,
    );
    expect(
      within(table).queryByText(
        /invalid_signature|amount_mismatch|late_payment|provider_unavailable/,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Journal d’audit' }),
    ).toHaveAttribute('href', '/plateforme/audit');
    expect(document.body).not.toHaveTextContent(/FCFA/);
  });

  it('réserve l’écran à plateforme.admin', async () => {
    renderApp(<Page />, { capacites: grantsEconomeDiocesain });
    expect(
      await screen.findByText('Cette page ne vous est pas ouverte'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Paiements' }),
    ).not.toBeInTheDocument();
  });

  it('s’ouvre à l’administrateur de la plateforme', async () => {
    renderApp(<Page />, { capacites: grantsPlateforme });
    expect(
      await screen.findByRole('heading', { name: 'Paiements', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/mis à jour à 9 h/i)).toBeInTheDocument();
  });
});
