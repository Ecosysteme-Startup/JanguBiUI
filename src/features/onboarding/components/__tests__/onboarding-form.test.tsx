import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';

import { OnboardingForm } from '@/features/onboarding/components/onboarding-form';
import { ids, onboardingState } from '@/testing/mocks/db';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { onboardingHandlers } from '@/testing/mocks/handlers/onboarding';
import { server } from '@/testing/mocks/server';
import { apiUrl } from '@/testing/mocks/api-url';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...onboardingHandlers));

beforeEach(() => {
  Object.assign(onboardingState, { paroisse: null, consent: null, annonces: null });
  navigation.replace.mockClear();
});

describe('OnboardingForm', () => {
  it('enregistre la paroisse suivie, le consentement exprès puis l’accueil', async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    await user.type(await screen.findByLabelText(/rechercher une paroisse/i), 'Point');
    await user.click(await screen.findByRole('radio', { name: /saint-dominique/i }));
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Avant de terminer' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: /terminer mon inscription/i });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/cochez les 2 accords requis/i)).toBeInTheDocument();
    // Aucune case cochée d'avance (loi 2008-12).
    screen.getAllByRole('checkbox').forEach((box) => expect(box).not.toBeChecked());

    await user.click(screen.getByRole('checkbox', { name: /appartenance religieuse : paroisse suivie \(saint-dominique\)/i }));
    await user.click(screen.getByRole('checkbox', { name: /conditions d.utilisation/i }));
    await user.click(screen.getByRole('checkbox', { name: /changements d.horaires et les annonces/i }));
    await user.click(submit);

    await vi.waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/app'));
    expect(onboardingState).toEqual({ paroisse: ids.saintDominique, consent: '2026-09', annonces: true });
  });

  it('refuse de continuer sans paroisse, en expliquant pourquoi', async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    await user.click(await screen.findByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText('Choisissez la paroisse que vous suivez.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Avant de terminer' })).not.toBeInTheDocument();
    expect(onboardingState.consent).toBeNull();
  });

  it('récapitule le compte et la paroisse, et permet de revenir au choix', async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    await user.click(await screen.findByRole('radio', { name: /saint-dominique/i }));
    await user.click(screen.getByRole('button', { name: 'Continuer' }));
    const recap = within(await screen.findByRole('complementary', { name: 'Récapitulatif' }));
    expect(recap.getByText('Paroisse suivie')).toBeInTheDocument();
    expect(recap.getByText('Saint-Dominique')).toBeInTheDocument();

    await user.click(recap.getByRole('button', { name: 'Modifier' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Votre paroisse' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /saint-dominique/i })).toBeChecked();
  });

  it('n’envoie jamais de consentement sans version : erreur de chargement, puis nouvel essai', async () => {
    server.use(http.get(apiUrl('/me/consent/'), () => HttpResponse.json({ detail: 'Erreur' }, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/inscription n’a pas pu être préparée/i);
    expect(screen.queryByRole('button', { name: 'Continuer' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findByRole('button', { name: 'Continuer' })).toBeInTheDocument();
    expect(onboardingState.consent).toBeNull();
  });

  it('distingue les paroisses présentes sur Jàngu Bi des autres', async () => {
    renderApp(<OnboardingForm />);

    expect(await screen.findByRole('radio', { name: /saint-dominique.*sur jàngu bi/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /cathédrale.*pas encore sur jàngu bi/i })).toBeInTheDocument();
  });
});
