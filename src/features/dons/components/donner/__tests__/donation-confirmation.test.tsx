import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { paths } from '@/config/paths';
import { PENDING_REFRESH_MS } from '@/features/dons/api/get-donation-status';
import { saveCheckout } from '@/features/dons/components/donner/checkout-storage';
import { DonationConfirmation } from '@/features/dons/components/donner/donation-confirmation';
import { apiUrl } from '@/testing/mocks/api-url';
import { donsIds, donsState } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ');
const item = (label: string) => norm(screen.getByText(label, { selector: 'dt' }).parentElement?.textContent);

/** Compte les lectures du statut, sans remplacer la réponse du handler du lot. */
const countStatusReads = () => {
  const reads = { count: 0 };
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET' && request.url.includes('/dons/checkout/')) reads.count += 1;
  });
  return reads;
};

beforeEach(() => window.sessionStorage.clear());
afterEach(() => server.events.removeAllListeners());

describe('WEB-FID-Don-Confirmation', () => {
  it('confirme le don avec sa référence, son numéro de reçu et le montant affecté', async () => {
    saveCheckout({
      donation_id: donsIds.donConfirme,
      reference: '4817-2093-6651',
      checkout_url: 'https://paydunya.com/x',
      amount: 5000,
      fee_amount: 100,
      charged_amount: 5000,
      net_amount: 4900,
      fund_id: donsIds.quete,
      fund_title: 'Quête du dimanche 27 septembre',
      parish_name: 'Saint-Dominique',
    });
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Merci, votre don est confirmé.' })).toBeInTheDocument();
    expect(screen.getByText(/reçu par la paroisse Saint-Dominique\. Un reçu est disponible/)).toBeInTheDocument();
    expect(item('Référence du don')).toBe('Référence du don4817-2093-6651');
    expect(item('Numéro de reçu')).toBe('Numéro de reçuSD-2026-00147');
    expect(item('Fonds')).toBe('FondsQuête du dimanche 27 septembreParoisse Saint-Dominique');
    expect(item('Montant')).toBe('Montant5 000 FCFAdont 4 900 FCFA affectés au fonds');
    expect(item('Date')).toMatch(/^DateJeudi 24 septembre 2026à \d+ h \d{2}$/);
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', paths.app.root.getHref());
    expect(screen.getByText(/ce n’est pas un reçu fiscal/)).toBeInTheDocument();
  });

  it('télécharge le reçu simple', async () => {
    const downloads: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/recu/')) downloads.push(new URL(request.url).pathname);
    });
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    URL.createObjectURL = vi.fn(() => 'blob:recu');
    URL.revokeObjectURL = vi.fn();
    const user = userEvent.setup();
    try {
      renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);
      await user.click(await screen.findByRole('button', { name: 'Télécharger le reçu' }));
      await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      expect(downloads).toEqual([expect.stringContaining(`/me/dons/${donsIds.donConfirme}/recu/`)]);
    } finally {
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    }
  });

  it('sans compte : pas de téléchargement ni de lien « Mes dons »', async () => {
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="public" signedIn={false} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Merci, votre don est confirmé.' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Télécharger le reçu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Voir mes dons' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', paths.home.getHref());
  });

  it('en attente, se met à jour seul jusqu’à la confirmation du serveur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      donsState.statusSequence = ['en_attente', 'confirme'];
      renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);

      expect(await screen.findByRole('heading', { level: 1, name: 'Paiement en attente de confirmation' })).toBeInTheDocument();
      expect(norm(screen.getByRole('status').textContent)).toContain('Ne refaites pas le paiement : cette page se met à jour d’elle-même');
      expect(screen.getByRole('link', { name: 'Voir mes dons' })).toHaveAttribute('href', paths.app.dons.historique.getHref());

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PENDING_REFRESH_MS + 100);
      });
      expect(await screen.findByRole('heading', { level: 1, name: 'Merci, votre don est confirmé.' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('paiement échoué : message sobre et « Réessayer » vers le formulaire', async () => {
    donsState.statusSequence = ['echoue'];
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Le paiement n’a pas abouti.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Réessayer' })).toHaveAttribute('href', paths.app.dons.root.getHref(donsIds.quete));
    expect(screen.queryByText(/Merci/)).not.toBeInTheDocument();
  });

  it('session expirée', async () => {
    donsState.statusSequence = ['expire'];
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);
    expect(await screen.findByRole('heading', { level: 1, name: 'La page de paiement a expiré.' })).toBeInTheDocument();
  });

  it('annulé chez l’agrégateur : lit le statut une seule fois et ne le présente pas comme confirmé', async () => {
    const reads = countStatusReads();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      donsState.statusSequence = ['en_attente', 'confirme'];
      renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="public" signedIn={false} cancelled />);

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/^Paiement annulé\s: rien n’a été débité\.$/);
      expect(screen.getByRole('link', { name: 'Réessayer' })).toHaveAttribute('href', paths.paroisses.list.getHref());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PENDING_REFRESH_MS * 2);
      });
      expect(reads.count).toBe(1);
      expect(screen.queryByText(/votre don est confirmé/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('annulé mais confirmé par le serveur : le serveur fait foi', async () => {
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn cancelled />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Merci, votre don est confirmé.' })).toBeInTheDocument();
  });

  it('parcours sans compte annulé : « Réessayer » revient au formulaire de la paroisse', async () => {
    saveCheckout({
      donation_id: donsIds.donConfirme,
      reference: '4817-2093-6651',
      checkout_url: 'https://paydunya.com/x',
      amount: 5000,
      fee_amount: 100,
      charged_amount: 5000,
      net_amount: 4900,
      fund_id: donsIds.quete,
      fund_title: 'Quête du dimanche 27 septembre',
      parish_name: 'Saint-Dominique',
      parish_code: 'DAK-SAINT-DOMINIQUE',
    });
    donsState.statusSequence = ['echoue'];
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="public" signedIn cancelled />);

    expect(await screen.findByRole('link', { name: 'Réessayer' })).toHaveAttribute(
      'href',
      paths.dons.paroisse.getHref('DAK-SAINT-DOMINIQUE', donsIds.quete),
    );
    expect(screen.getByRole('link', { name: 'Voir mes dons' })).toBeInTheDocument();
  });

  it('signale une erreur de lecture sans inviter à repayer', async () => {
    server.use(http.get(apiUrl('/dons/checkout/:id/'), () => HttpResponse.json({ error: { code: 'x', message: 'Erreur' } }, { status: 500 })));
    renderApp(<DonationConfirmation donationId={donsIds.donConfirme} variant="fidele" signedIn />);

    expect(await screen.findByText('L’état du don n’a pas pu être chargé.')).toBeInTheDocument();
    expect(screen.getByText(/Ne refaites pas le paiement/)).toBeInTheDocument();
  });
});
