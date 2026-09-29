import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { paths } from '@/config/paths';
import { GiveScreen } from '@/features/dons/components/donner/give-screen';
import { apiUrl } from '@/testing/mocks/api-url';
import { me } from '@/testing/mocks/db';
import { donsIds, donsState } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const summary = () => within(screen.getByRole('complementary', { name: 'Votre don' }));
const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ');
const row = (label: string) => norm(summary().getByText(label, { selector: 'dt' }).parentElement?.textContent);

beforeEach(() => {
  navigation.push.mockReset();
  window.sessionStorage.clear();
});

describe('WEB-FID-Donner', () => {
  it('présente la paroisse suivie, ses quatre fonds et le récapitulatif par défaut', async () => {
    renderApp(<GiveScreen />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Soutenir la paroisse Saint-Dominique' })).toBeInTheDocument();
    expect(screen.getByText(/Collecte autorisée par l’Archevêché de Dakar/)).toBeInTheDocument();
    expect(screen.getByText('4 fonds ouverts à Saint-Dominique.')).toBeInTheDocument();

    const funds = screen.getAllByRole('radio', { name: /Quête|Toiture|Contribution/ });
    expect(funds).toHaveLength(4);
    expect(screen.getByRole('radio', { name: /Quête du dimanche 27 septembre/ })).toBeChecked();
    expect(screen.getByText('Quête dominicale · du 26 septembre au 4 octobre')).toBeInTheDocument();
    expect(screen.getByText('Contribution annuelle · pour toute l’année 2026')).toBeInTheDocument();
    expect(screen.getByText('Reversée au diocèse')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Avancement de la collecte' })).toHaveAttribute('aria-valuenow', '26');
    expect(screen.getByRole('link', { name: 'Voir la campagne' })).toHaveAttribute('href', paths.app.dons.campagne.getHref(donsIds.toiture));

    expect(screen.getByRole('radio', { name: /^5\s000\sFCFA$/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Je couvre les frais de paiement \(100\sFCFA\)/ })).not.toBeChecked();
    expect(row('Don')).toBe('Don5 000 FCFA');
    expect(row('Affecté au fonds')).toBe('Affecté au fonds4 900 FCFA');
    expect(norm(summary().getByText(/Frais estimés/).parentElement?.textContent)).toContain('− 100 FCFA');
    expect(screen.getByRole('link', { name: /Mes dons Historique et reçus/ })).toHaveAttribute('href', paths.app.dons.historique.getHref());
  });

  it('présélectionne le fonds passé en paramètre', async () => {
    renderApp(<GiveScreen fundId={donsIds.brin} />);

    expect(await screen.findByRole('radio', { name: /Grand Séminaire de Brin/ })).toBeChecked();
    expect(summary().getByText('Quête impérée pour le Grand Séminaire de Brin')).toBeInTheDocument();
  });

  it('met à jour le récapitulatif selon le montant et les frais couverts', async () => {
    const user = userEvent.setup();
    renderApp(<GiveScreen />);
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('radio', { name: /^10\s000\sFCFA$/ }));
    expect(row('Don')).toBe('Don10 000 FCFA');
    expect(row('Affecté au fonds')).toBe('Affecté au fonds9 800 FCFA');

    await user.click(screen.getByRole('checkbox', { name: /Je couvre les frais de paiement \(200\sFCFA\)/ }));
    expect(row('Vous payez')).toBe('Vous payez10 200 FCFA');
    expect(row('Affecté au fonds')).toBe('Affecté au fonds10 000 FCFA');

    await user.type(screen.getByLabelText('Autre montant'), '2 5a00');
    expect(screen.getByLabelText('Autre montant')).toHaveValue('2500');
    expect(screen.getByRole('radio', { name: /^10\s000\sFCFA$/ })).not.toBeChecked();
    expect(row('Don')).toBe('Don2 500 FCFA');
  });

  it('refuse un montant hors bornes, sans appeler le paiement', async () => {
    const user = userEvent.setup();
    renderApp(<GiveScreen />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByText('Entre 100 et 1 000 000 FCFA.', { normalizer: (t) => norm(t) })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Autre montant'), '50');
    await user.tab();
    expect(norm((await screen.findByRole('alert')).textContent)).toBe('Le montant minimum est de 100 FCFA.');
    expect(screen.getByLabelText('Autre montant')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    expect(donsState.checkouts).toHaveLength(0);

    await user.clear(screen.getByLabelText('Autre montant'));
    await user.type(screen.getByLabelText('Autre montant'), '2000000');
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    expect(norm((await screen.findByRole('alert')).textContent)).toBe('Le montant maximum est de 1 000 000 FCFA.');
    expect(donsState.checkouts).toHaveLength(0);
  });

  it('crée le paiement avec une clé d’idempotence stable, puis ouvre la redirection', async () => {
    const user = userEvent.setup();
    renderApp(<GiveScreen />);
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('checkbox', { name: 'Don anonyme' }));
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(paths.app.dons.redirection.getHref(donsIds.donConfirme)));
    expect(donsState.checkouts).toHaveLength(1);
    expect(donsState.checkouts[0].body).toEqual({ fund_id: donsIds.quete, amount: 5000, fees_covered: false, anonymous: true, email: '', source: 'web' });
    const key = donsState.checkouts[0].idempotencyKey;
    expect(key).toBeTruthy();

    const stored = JSON.parse(window.sessionStorage.getItem(`jb-dons-checkout-${donsIds.donConfirme}`) ?? '{}');
    expect(stored).toMatchObject({
      checkout_url: 'https://paydunya.com/sandbox-checkout/invoice/test_4817',
      reference: '4817-2093-6651',
      fund_title: 'Quête du dimanche 27 septembre',
      net_amount: 4900,
    });

    // Même intention (double envoi) : même clé ; formulaire modifié : nouvelle clé.
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    await vi.waitFor(() => expect(donsState.checkouts).toHaveLength(2));
    expect(donsState.checkouts[1].idempotencyKey).toBe(key);

    await user.click(screen.getByRole('radio', { name: /^2\s000\sFCFA$/ }));
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    await vi.waitFor(() => expect(donsState.checkouts).toHaveLength(3));
    expect(donsState.checkouts[2].body).toMatchObject({ amount: 2000 });
    expect(donsState.checkouts[2].idempotencyKey).not.toBe(key);
  });

  it('envoie les frais couverts au serveur', async () => {
    const user = userEvent.setup();
    renderApp(<GiveScreen fundId={donsIds.toiture} />);
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('checkbox', { name: /Je couvre les frais/ }));
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));

    await vi.waitFor(() => expect(donsState.checkouts).toHaveLength(1));
    expect(donsState.checkouts[0].body).toEqual({ fund_id: donsIds.toiture, amount: 5000, fees_covered: true, anonymous: false, email: '', source: 'web' });
  });

  it('affiche l’erreur du serveur sans quitter la page', async () => {
    server.use(http.post(apiUrl('/dons/checkout/'), () => HttpResponse.json({ error: { code: 'unavailable', message: 'L’agrégateur ne répond pas. Réessayez dans un instant.' } }, { status: 503 })));
    const user = userEvent.setup();
    renderApp(<GiveScreen />);
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    expect(await screen.findByText('L’agrégateur ne répond pas. Réessayez dans un instant.')).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('invite à choisir une paroisse quand aucune n’est suivie', async () => {
    server.use(http.get(apiUrl('/me/'), () => HttpResponse.json({ ...me, paroisse_suivie: null })));
    renderApp(<GiveScreen />);

    expect(await screen.findByText('Vous ne suivez encore aucune paroisse.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choisir ma paroisse' })).toHaveAttribute('href', paths.app.profil.getHref());
    expect(screen.queryByRole('button', { name: 'Continuer vers le paiement' })).not.toBeInTheDocument();
  });
});
