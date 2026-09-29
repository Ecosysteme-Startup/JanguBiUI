import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createStaffUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { reinitialiserV1Complements } from '@/testing/mocks/handlers/v1-complements';
import {
  fireEvent,
  renderApp,
  screen,
  userEvent,
  within,
} from '@/testing/test-utils';

import { FeuilleIntentions } from '../feuille-intentions';
import { IntentionsFidele } from '../intentions-fidele';
import { IntentionsParoisse } from '../intentions-paroisse';

beforeEach(() => reinitialiserV1Complements());

describe('Intentions de messe — fidèle (/v1/mass-intentions/)', () => {
  test('liste mes intentions, rappelle l’offrande et envoie une demande sans montant', async () => {
    let corps: Record<string, unknown> = {};
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/`, async ({ request }) => {
        corps = (await request.clone().json()) as Record<string, unknown>;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsFidele />);

    expect(
      await screen.findByText('Pour la guérison de Mme Awa Faye'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Motif :/)).toBeInTheDocument();
    expect(
      screen.getByText(/elle ne passe pas par l’application/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/FCFA/)).not.toBeInTheDocument();

    const form = screen.getByRole('form', { name: 'Nouvelle demande' });
    await within(form).findByRole('option', { name: 'Saint-Dominique' });
    fireEvent.change(within(form).getByLabelText('Messe souhaitée le'), {
      target: { value: '2026-10-11' },
    });
    await user.type(
      within(form).getByLabelText('Texte de l’intention'),
      'Pour les malades de la paroisse',
    );
    await user.click(within(form).getByLabelText('Demande anonyme'));
    await user.click(
      within(form).getByRole('button', { name: 'Envoyer la demande' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Votre demande a bien été transmise',
    );
    expect(corps).toMatchObject({
      kind: 'defunt',
      intention: 'Pour les malades de la paroisse',
      is_anonymous: true,
      requested_date: '2026-10-11',
    });
    expect(Object.keys(corps).some((k) => /montant|amount/.test(k))).toBe(
      false,
    );
  });
});

describe('Intentions de messe — demande sans date', () => {
  test('« Pas de date précise » envoie requested_date nul', async () => {
    let corps: Record<string, unknown> = {};
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/`, async ({ request }) => {
        corps = (await request.clone().json()) as Record<string, unknown>;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsFidele />);
    const form = await screen.findByRole('form', { name: 'Nouvelle demande' });
    await within(form).findByRole('option', { name: 'Saint-Dominique' });
    await user.click(within(form).getByLabelText('Pas de date précise'));
    expect(within(form).getByLabelText('Messe souhaitée le')).toBeDisabled();
    await user.type(
      within(form).getByLabelText('Texte de l’intention'),
      'Pour les familles de la paroisse',
    );
    await user.click(
      within(form).getByRole('button', { name: 'Envoyer la demande' }),
    );
    await vi.waitFor(() =>
      expect(corps).toMatchObject({ requested_date: null }),
    );
  });
});

describe('Intentions de messe — secrétariat (intentions.gerer)', () => {
  beforeEach(() =>
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createStaffUser(['intentions.gerer'])),
      ),
    ),
  );

  test('planifie une intention reçue à la messe souhaitée', async () => {
    const user = userEvent.setup();
    renderApp(<IntentionsParoisse />);
    const table = await screen.findByRole('table', {
      name: 'Intentions de messe de Saint-Dominique',
    });
    expect(within(table).getByText('Anonyme à la messe')).toBeInTheDocument();
    const ligne = within(table)
      .getByText(/25 ans de mariage/)
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Traiter' }));
    const panneau = screen.getByRole('complementary', {
      name: 'Intention sélectionnée',
    });
    expect(
      within(panneau).getByText(/Annoncée à la messe : Une personne/),
    ).toBeInTheDocument();
    await user.click(
      within(panneau).getByRole('button', { name: /Planifier le/ }),
    );
    expect(
      await screen.findByText('Aucun montant ni paiement n’est géré ici.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Intention sélectionnée' }),
    ).not.toBeInTheDocument();
    expect(
      await within(table).findByText(/Marguerite Mendy/),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText(/25 ans de mariage/),
    ).not.toBeInTheDocument();
  });

  test('refuse avec un motif envoyé au demandeur', async () => {
    let motif = '';
    server.use(
      http.post(
        `${env.API_URL}/v1/mass-intentions/:id/decline/`,
        async ({ request }) => {
          motif = ((await request.clone().json()) as { reason: string }).reason;
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsParoisse />);
    const table = await screen.findByRole('table', {
      name: 'Intentions de messe de Saint-Dominique',
    });
    const ligne = within(table)
      .getByText(/Marguerite Mendy/)
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Traiter' }));
    await user.type(
      screen.getByLabelText('Message au demandeur (facultatif)'),
      'Une messe de semaine reste possible',
    );
    await user.click(screen.getByRole('button', { name: 'Refuser' }));
    await screen.findByText('Aucun montant ni paiement n’est géré ici.', {
      exact: false,
    });
    await vi.waitFor(() =>
      expect(motif).toBe(
        'Messe demandée déjà complète. Une messe de semaine reste possible',
      ),
    );
  });

  test('messes du jour : places restantes, heure précise et plafond', async () => {
    let corps: Record<string, unknown> = {};
    server.use(
      http.post(
        `${env.API_URL}/v1/mass-intentions/:id/accept/`,
        async ({ request }) => {
          corps = (await request.clone().json()) as Record<string, unknown>;
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsParoisse />);
    const messes = await screen.findByRole('region', {
      name: 'Messes du jour',
    });
    expect(
      await within(messes).findAllByText('5 places restantes'),
    ).toHaveLength(3);
    expect(
      within(messes).getByRole('link', { name: /Feuille à imprimer/ }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('/app/paroisse/intentions/feuille?node='),
    );

    const table = await screen.findByRole('table', {
      name: 'Intentions de messe de Saint-Dominique',
    });
    const ligne = within(table)
      .getByText(/Rose Gomis/)
      .closest('tr') as HTMLElement;
    expect(within(ligne).getByText('Pas de date précise')).toBeInTheDocument();
    await user.click(within(ligne).getByRole('button', { name: 'Traiter' }));
    const panneau = screen.getByRole('complementary', {
      name: 'Intention sélectionnée',
    });
    fireEvent.change(within(panneau).getByLabelText('Date'), {
      target: { value: '2026-10-04' },
    });
    const choix = within(panneau).getByLabelText('Messe');
    await within(panneau).findByRole('option', { name: /Messe de 10 h/ });
    await user.selectOptions(choix, '10:00');
    await user.click(
      within(panneau).getByRole('button', { name: /Planifier le/ }),
    );
    await vi.waitFor(() =>
      expect(corps).toMatchObject({
        scheduled_date: '2026-10-04',
        scheduled_time: '10:00',
        place_id: 12,
        scheduled_mass: 'Messe de 10 h',
      }),
    );
  });

  test('messe complète : message clair (mass_full)', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/:id/accept/`, () =>
        HttpResponse.json(
          { error: { code: 'mass_full', message: 'Complète', details: {} } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsParoisse />);
    const table = await screen.findByRole('table', {
      name: 'Intentions de messe de Saint-Dominique',
    });
    const ligne = within(table)
      .getByText(/Marguerite Mendy/)
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Traiter' }));
    const panneau = screen.getByRole('complementary', {
      name: 'Intention sélectionnée',
    });
    await within(panneau).findByRole('option', { name: /Messe de 18 h 30/ });
    await user.selectOptions(within(panneau).getByLabelText('Messe'), '18:30');
    await user.click(
      within(panneau).getByRole('button', { name: /Planifier le/ }),
    );
    expect(await within(panneau).findByRole('alert')).toHaveTextContent(
      'Cette messe a déjà toutes ses intentions.',
    );
  });

  test('règle le nombre d’intentions par messe (1 à 50)', async () => {
    let corps: Record<string, unknown> = {};
    server.use(
      http.patch(
        `${env.API_URL}/v1/mass-intentions/parish/reglages/`,
        async ({ request }) => {
          corps = (await request.clone().json()) as Record<string, unknown>;
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<IntentionsParoisse />);
    const champ = await screen.findByLabelText('Intentions par messe');
    await vi.waitFor(() => expect(champ).toHaveValue(5));
    await user.clear(champ);
    await user.type(champ, '8');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Réglage enregistré.')).toBeInTheDocument();
    expect(corps).toMatchObject({ max_per_mass: 8 });
  });
});

describe('Feuille des intentions (imprimable)', () => {
  test('liste les intentions par messe, sans aucun montant', async () => {
    renderApp(
      <FeuilleIntentions
        node="00000000-0000-4000-8000-000000000000"
        date="2026-11-02"
      />,
    );
    const feuille = await screen.findByRole('article', {
      name: 'Feuille des intentions',
    });
    expect(
      within(feuille).getByText("Pour le repos de l'âme de Joseph Diouf"),
    ).toBeInTheDocument();
    expect(
      within(feuille).getByText(/Demandée par : Marie-Thérèse Diouf/),
    ).toBeInTheDocument();
    expect(feuille.textContent).not.toMatch(/FCFA|montant|offrande/i);
    expect(
      screen.getByRole('button', { name: 'Imprimer' }),
    ).toBeInTheDocument();
  });
});
