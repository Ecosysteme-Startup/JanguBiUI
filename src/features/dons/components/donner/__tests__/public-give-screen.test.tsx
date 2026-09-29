import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { paths } from '@/config/paths';
import { PublicGiveScreen } from '@/features/dons/components/donner/public-give-screen';
import { donsIds, donsState } from '@/testing/mocks/db-dons';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const CODE = 'DAK-SAINT-DOMINIQUE';
const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ');

beforeEach(() => {
  navigation.push.mockReset();
  window.sessionStorage.clear();
});

describe('WEB-Don-Paroisse', () => {
  it('présente la paroisse, la mention d’autorisation et le formulaire sur une colonne', async () => {
    renderApp(<PublicGiveScreen code={CODE} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Soutenir la paroisse Saint-Dominique' })).toBeInTheDocument();
    expect(screen.getByText(/^Point E, Dakar · /)).toBeInTheDocument();
    expect(screen.getByText(/Aucun compte n’est nécessaire/)).toBeInTheDocument();
    expect(screen.getByText(/Collecte autorisée par l’Archevêché de Dakar/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Saint-Dominique' })).toHaveAttribute('href', paths.paroisses.detail.getHref(CODE));

    expect(screen.getAllByRole('radio', { name: /Quête|Toiture|Contribution/ })).toHaveLength(4);
    expect(screen.getByText('Quête dominicale · jusqu’au 4 octobre')).toBeInTheDocument();
    expect(screen.getByText('Campagne · 26 % de 4 500 000 FCFA réunis', { normalizer: (t) => norm(t) })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Je couvre les frais \(2\s%\)$/ })).not.toBeChecked();
    expect(screen.getByLabelText(/E-mail/)).toHaveAttribute('type', 'email');
    expect(screen.getByText('Pour recevoir votre reçu (effacé après 90 jours).')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se connecter pour retrouver ce don dans Mes dons' })).toHaveAttribute(
      'href',
      paths.auth.connexion.getHref(paths.app.dons.root.getHref()),
    );
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('signale un montant sous le minimum', async () => {
    const user = userEvent.setup();
    renderApp(<PublicGiveScreen code={CODE} />);
    await screen.findByRole('heading', { level: 1 });

    await user.type(screen.getByLabelText('Autre montant'), '50');
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    expect(norm((await screen.findByRole('alert')).textContent)).toBe('Le montant minimum est de 100 FCFA.');
    expect(donsState.checkouts).toHaveLength(0);
  });

  it('vérifie l’e-mail puis crée le paiement sans compte', async () => {
    const user = userEvent.setup();
    renderApp(<PublicGiveScreen code={CODE} fundId={donsIds.contribution} />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('radio', { name: /Contribution annuelle 2026/ })).toBeChecked();
    await user.type(screen.getByLabelText(/E-mail/), 'pas-une-adresse');
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));
    expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeInTheDocument();
    expect(donsState.checkouts).toHaveLength(0);

    await user.clear(screen.getByLabelText(/E-mail/));
    await user.type(screen.getByLabelText(/E-mail/), 'awa.faye@example.sn');
    await user.click(screen.getByRole('radio', { name: /^1\s000\sFCFA$/ }));
    await user.click(screen.getByRole('button', { name: 'Continuer vers le paiement' }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith(paths.dons.redirection.getHref(donsIds.donConfirme)));
    expect(donsState.checkouts[0].body).toEqual({
      fund_id: donsIds.contribution,
      amount: 1000,
      fees_covered: false,
      anonymous: false,
      email: 'awa.faye@example.sn',
    });
    expect(donsState.checkouts[0].idempotencyKey).toBeTruthy();
    expect(JSON.parse(window.sessionStorage.getItem(`jb-dons-checkout-${donsIds.donConfirme}`) ?? '{}')).toMatchObject({ parish_code: CODE });
  });

  it('signale un code de paroisse inconnu', async () => {
    renderApp(<PublicGiveScreen code="INCONNUE" />);
    expect(await screen.findByText('Paroisse introuvable.')).toBeInTheDocument();
  });
});
