import { screen } from '@testing-library/react';
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

    await user.type(await screen.findByLabelText(/nom, quartier ou ville/i), 'Point');
    await user.click(await screen.findByRole('radio', { name: /saint-dominique/i }));
    await user.click(screen.getByRole('checkbox', { name: /mon appartenance à la paroisse saint-dominique/i }));
    await user.click(screen.getByRole('checkbox', { name: /conditions d.utilisation/i }));
    await user.click(screen.getByRole('button', { name: /terminer mon inscription/i }));

    await vi.waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/app'));
    expect(onboardingState).toEqual({ paroisse: ids.saintDominique, consent: '2026-09', annonces: true });
  });

  it('refuse de continuer sans paroisse ni accords, en expliquant pourquoi', async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    await user.click(await screen.findByRole('button', { name: /terminer mon inscription/i }));

    expect(await screen.findByText('Choisissez la paroisse que vous suivez.')).toBeInTheDocument();
    expect(screen.getByText(/cet accord est nécessaire/i)).toBeInTheDocument();
    expect(onboardingState.consent).toBeNull();
  });

  it('n’envoie jamais de consentement sans version : erreur de chargement, puis nouvel essai', async () => {
    server.use(http.get(apiUrl('/me/consent/'), () => HttpResponse.json({ detail: 'Erreur' }, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/inscription n’a pas pu être préparée/i);
    expect(screen.queryByRole('button', { name: /terminer mon inscription/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findByRole('button', { name: /terminer mon inscription/i })).toBeInTheDocument();
    expect(onboardingState.consent).toBeNull();
  });

  it('distingue les paroisses actives de celles en préparation', async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingForm />);

    await user.type(await screen.findByLabelText(/nom, quartier ou ville/i), 'Dakar');

    expect(await screen.findByRole('radio', { name: /saint-dominique.*active/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /cathédrale.*en préparation/i })).toBeInTheDocument();
  });
});
