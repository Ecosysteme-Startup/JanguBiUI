import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { paths } from '@/config/paths';
import { saveCheckout, type StoredCheckout } from '@/features/dons/components/donner/checkout-storage';
import { PaymentRedirect } from '@/features/dons/components/donner/payment-redirect';
import { donsIds } from '@/testing/mocks/db-dons';
import { renderApp } from '@/testing/test-utils';

const URL_PAYDUNYA = 'https://paydunya.com/sandbox-checkout/invoice/test_4817';
const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ');

const stored = (extra: Partial<StoredCheckout> = {}): StoredCheckout => ({
  donation_id: donsIds.donConfirme,
  reference: '4817-2093-6651',
  checkout_url: URL_PAYDUNYA,
  amount: 5000,
  fee_amount: 100,
  charged_amount: 5000,
  net_amount: 4900,
  fund_id: donsIds.quete,
  fund_title: 'Quête du dimanche 27 septembre',
  parish_name: 'Saint-Dominique',
  ...extra,
});

beforeEach(() => window.sessionStorage.clear());

describe('WEB-FID-Don-Redirection', () => {
  it('récapitule le don puis ouvre la page de l’agrégateur', async () => {
    saveCheckout(stored());
    const onRedirect = vi.fn();
    renderApp(<PaymentRedirect donationId={donsIds.donConfirme} variant="fidele" delayMs={20} onRedirect={onRedirect} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Vous allez être redirigé vers la page de paiement sécurisée' })).toBeInTheDocument();
    const recap = norm(screen.getByText('Référence du don').closest('dl')?.textContent);
    expect(recap).toContain('FondsQuête du dimanche 27 septembre');
    expect(recap).toContain('Don5 000 FCFA');
    expect(recap).toContain('Frais estimés100 FCFA, déduits du don');
    expect(recap).toContain('Référence du don4817-2093-6651');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('progressbar', { name: 'Ouverture de la page de paiement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuer' })).toHaveAttribute('href', URL_PAYDUNYA);
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute('href', paths.app.dons.root.getHref(donsIds.quete));

    await vi.waitFor(() => expect(onRedirect).toHaveBeenCalledWith(URL_PAYDUNYA));
  });

  it('« Annuler » arrête l’ouverture et oublie la session de paiement', async () => {
    saveCheckout(stored());
    const onRedirect = vi.fn();
    const user = userEvent.setup();
    renderApp(<PaymentRedirect donationId={donsIds.donConfirme} variant="fidele" delayMs={60_000} onRedirect={onRedirect} />);

    await user.click(await screen.findByRole('link', { name: 'Annuler' }));
    expect(screen.getByText('Ouverture annulée.')).toBeInTheDocument();
    expect(window.sessionStorage.getItem(`jb-dons-checkout-${donsIds.donConfirme}`)).toBeNull();
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it('parcours sans compte : retour au formulaire de la paroisse', async () => {
    saveCheckout(stored({ parish_code: 'DAK-SAINT-DOMINIQUE', charged_amount: 5100, net_amount: 5000 }));
    renderApp(<PaymentRedirect donationId={donsIds.donConfirme} variant="public" delayMs={60_000} onRedirect={vi.fn()} />);

    expect(await screen.findByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      paths.dons.paroisse.getHref('DAK-SAINT-DOMINIQUE', donsIds.quete),
    );
    expect(norm(screen.getByText('Frais estimés').closest('dl')?.textContent)).toContain('100 FCFA, ajoutés au paiement');
  });

  it('n’ouvre jamais une adresse qui n’est pas en HTTPS', async () => {
    saveCheckout(stored({ checkout_url: 'javascript:alert(1)' }));
    const onRedirect = vi.fn();
    renderApp(<PaymentRedirect donationId={donsIds.donConfirme} variant="fidele" delayMs={0} onRedirect={onRedirect} />);

    expect(await screen.findByText('La page de paiement n’est plus disponible dans cet onglet.')).toBeInTheDocument();
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it('sans session de paiement dans l’onglet, renvoie vers l’état du don', async () => {
    renderApp(<PaymentRedirect donationId={donsIds.donConfirme} variant="fidele" onRedirect={vi.fn()} />);

    expect(await screen.findByText('La page de paiement n’est plus disponible dans cet onglet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir l’état du don' })).toHaveAttribute('href', paths.app.dons.confirmation.getHref(donsIds.donConfirme));
  });
});
