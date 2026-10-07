import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { RequestWizard } from '@/features/actes/components/request-wizard';
import { apiUrl } from '@/testing/mocks/api-url';
import { me } from '@/testing/mocks/db';
import { actesState, resetActes } from '@/testing/mocks/db-f6-actes';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

beforeEach(() => {
  resetActes();
  navigation.push.mockClear();
});

type User = ReturnType<typeof userEvent.setup>;

const fillInfos = async (user: User) => {
  await user.type(screen.getByLabelText(/date de naissance/i), '14/03/1992');
  await user.type(screen.getByLabelText(/lieu de naissance/i), 'Dakar');
  await user.type(screen.getByLabelText(/nom et prénoms du père/i), 'Étienne Diouf');
  await user.type(screen.getByLabelText(/nom de jeune fille de la mère/i), 'Hélène Gomis');
  await user.type(screen.getByLabelText(/téléphone/i), '+221 77 418 26 90');
  await user.selectOptions(screen.getByLabelText(/mois du baptême/i), '08');
  await user.type(screen.getByLabelText(/année du baptême/i), '1992');
  await user.click(screen.getByRole('radio', { name: 'Mariage religieux' }));
};

describe('FID-Demande-Nouvelle', () => {
  it('dépose la demande à la paroisse du sacrement, en quatre étapes', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);

    // 1. Type d'acte
    await user.click(await screen.findByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // 2. Paroisse du sacrement (annuaire public, y compris les paroisses pas encore actives)
    expect(await screen.findByText(/la demande va à la paroisse où le sacrement a été célébré/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/nom de la paroisse/i), 'Grand');
    await user.click(await screen.findByRole('radio', { name: /sainte-thérèse de grand-dakar/i }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // 3. Informations (préremplies depuis le profil)
    expect(await screen.findByLabelText(/nom de famille/i)).toHaveValue('Diouf');
    expect(screen.getByLabelText(/adresse électronique/i)).toHaveValue('marie-therese.diouf@example.sn');
    await fillInfos(user);
    await user.click(screen.getByRole('checkbox', { name: /transmises au secrétariat de sainte-thérèse de grand-dakar/i }));
    await user.click(screen.getByRole('button', { name: /voir le récapitulatif/i }));

    // 4. Récapitulatif
    expect(await screen.findByRole('heading', { name: 'Vérifier et envoyer' })).toBeInTheDocument();
    expect(screen.getByText('Un original papier, jamais un fichier.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }));

    await vi.waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/app/demandes/d0c00000-0000-4000-8000-0000000000ff'));
    expect(actesState.lastCreate).toMatchObject({
      target_node_id: 'b1000000-0000-4000-8000-000000000011',
      document_type: 'baptism',
      reason: 'religious_marriage',
      requester_last_name: 'Diouf',
      requester_first_names: 'Marie-Thérèse',
      date_of_birth: '1992-03-14',
      sacrament_approximate_date: '08/1992',
      sacrament_location: 'Sainte-Thérèse de Grand-Dakar',
      pickup_mode: 'secretariat',
      consent_given: true,
      attachment_file_id: null,
    });
  });

  it('bloque chaque étape tant que l’obligatoire manque, avec un message sous le champ', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);

    await user.click(await screen.findByRole('button', { name: /continuer/i }));
    expect(await screen.findByText('Choisissez l’acte que vous demandez.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await user.click(await screen.findByRole('button', { name: /continuer/i }));
    expect(await screen.findByText('Choisissez la paroisse où le sacrement a été célébré.')).toBeInTheDocument();
  });

  it('refuse une date ou une année mal formée et exige le consentement', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);
    await user.click(await screen.findByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/nom de la paroisse/i), 'Grand');
    await user.click(await screen.findByRole('radio', { name: /sainte-thérèse/i }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    await user.type(await screen.findByLabelText(/date de naissance/i), '31/02/1992');
    await user.type(screen.getByLabelText(/année du baptême/i), '199');
    await user.click(screen.getByRole('button', { name: /voir le récapitulatif/i }));

    expect(await screen.findByText(/date au format jj\/mm\/aaaa/i)).toBeInTheDocument();
    expect(screen.getByText('Quatre chiffres, par exemple 1992.')).toBeInTheDocument();
    expect(screen.getByText('Cet accord est nécessaire pour transmettre la demande.')).toBeInTheDocument();
    expect(actesState.lastCreate).toBeNull();
  });

  it('ne propose que les motifs compatibles avec l’acte demandé', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);
    await user.click(await screen.findByRole('radio', { name: 'Attestation de mariage religieux' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/nom de la paroisse/i), 'Grand');
    await user.click(await screen.findByRole('radio', { name: /sainte-thérèse/i }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    await screen.findByLabelText(/nom de famille/i);
    expect(screen.queryByRole('radio', { name: 'Mariage religieux' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Parrain / marraine' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Dossier paroissial' })).toBeInTheDocument();
    expect(screen.getByLabelText(/nom et prénoms de l’époux/i)).toBeInTheDocument();
  });

  it('propose de transmettre l’original à la paroisse suivie quand elle diffère', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);
    await user.click(await screen.findByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/nom de la paroisse/i), 'Grand');
    await user.click(await screen.findByRole('radio', { name: /sainte-thérèse/i }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByRole('radio', { name: /au secrétariat de la paroisse du sacrement/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /transmission à ma paroisse, saint-dominique/i })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/pdf/i);
  });

  it('préremplit la date de naissance (et le téléphone) depuis le profil (JB-WEB-028)', async () => {
    server.use(
      http.get(apiUrl('/me/'), () =>
        HttpResponse.json({ ...me, profile: { ...me.profile, date_of_birth: '1992-03-14', phone: '+221 77 418 26 90' } }),
      ),
    );
    const user = userEvent.setup();
    renderApp(<RequestWizard />);
    await user.click(await screen.findByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await user.type(await screen.findByLabelText(/nom de la paroisse/i), 'Grand');
    await user.click(await screen.findByRole('radio', { name: /sainte-thérèse/i }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByLabelText(/date de naissance/i)).toHaveValue('14/03/1992');
    expect(screen.getByLabelText(/téléphone/i)).toHaveValue('+221 77 418 26 90');
  });

  it('déplace le focus sur le champ en erreur, pas sur le bouton (JB-WEB-028)', async () => {
    const user = userEvent.setup();
    renderApp(<RequestWizard />);
    await user.click(await screen.findByRole('radio', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    // Étape Paroisse : « Continuer » sans choix → le focus doit aller au champ de recherche invalide.
    await user.click(await screen.findByRole('button', { name: /continuer/i }));

    const search = await screen.findByLabelText(/nom de la paroisse/i);
    await waitFor(() => expect(search).toHaveFocus());
  });
});
