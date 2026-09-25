import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ContactForm } from '@/features/public-offre/components/contact-form';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { contactState } from '@/testing/mocks/db-f4';
import { directoryHandler } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

beforeEach(() => {
  server.use(directoryHandler);
  contactState.last = null;
});

type User = ReturnType<typeof userEvent.setup>;

const fillValidForm = async (user: User, { email = 'cecile.coly@ndanges.sn' } = {}) => {
  await user.type(screen.getByLabelText(/prénom et nom/i), 'Cécile Coly');
  await user.selectOptions(screen.getByLabelText(/fonction/i), 'Secrétaire paroissiale');
  await user.type(screen.getByLabelText(/paroisse ou service/i), 'Notre-Dame des Anges de Ouakam');
  await user.selectOptions(screen.getByLabelText(/diocèse/i), await screen.findByRole('option', { name: 'Archidiocèse de Dakar' }));
  await user.type(screen.getByLabelText(/téléphone/i), '77 543 18 62');
  await user.type(screen.getByLabelText(/e-mail/i), email);
  await user.click(screen.getByRole('checkbox', { name: /j.accepte que numerisen/i }));
};

describe('Formulaire de demande de présentation', () => {
  it('refuse un envoi incomplet et explique chaque champ', async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(await screen.findByText('Indiquez votre prénom et votre nom.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez votre fonction.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez le diocèse.')).toBeInTheDocument();
    expect(screen.getByText('Indiquez un numéro de téléphone.')).toBeInTheDocument();
    expect(screen.getByText(/cet accord est nécessaire/i)).toBeInTheDocument();
    expect(screen.getByText('7 champs à corriger avant l’envoi.')).toBeInTheDocument();
    expect(contactState.last).toBeNull();
  });

  it('signale une adresse e-mail sans extension', async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await fillValidForm(user, { email: 'cecile.coly@ndanges-ouakam' });
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(await screen.findByText(/adresse incomplète : il manque la fin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('1 champ à corriger avant l’envoi.')).toBeInTheDocument();
  });

  it('envoie la demande au contrat de l’API puis confirme la réception', async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await fillValidForm(user);
    await user.type(screen.getByLabelText(/votre message/i), 'Présentation au conseil pastoral.');
    await user.click(screen.getByRole('checkbox', { name: /le curé de la paroisse est informé/i }));
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Votre demande est bien arrivée.');
    expect(contactState.last).toEqual({
      full_name: 'Cécile Coly',
      fonction: 'secretaire',
      paroisse: 'Notre-Dame des Anges de Ouakam',
      diocese_node_id: ids.dakar,
      telephone: '+221 77 543 18 62',
      email: 'cecile.coly@ndanges.sn',
      message: 'Présentation au conseil pastoral.',
      consentement: true,
      cure_informe: true,
    });
  });

  it('accepte un diocèse inconnu (null) et un numéro international', async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await fillValidForm(user);
    await user.selectOptions(screen.getByLabelText(/diocèse/i), 'Autre, ou je ne sais pas');
    await user.clear(screen.getByLabelText(/téléphone/i));
    await user.type(screen.getByLabelText(/téléphone/i), '+33 6 12 34 56 78');
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    await screen.findByRole('status');
    expect(contactState.last).toMatchObject({ diocese_node_id: null, telephone: '+33 6 12 34 56 78', cure_informe: false });
    expect(contactState.last).not.toHaveProperty('message');
  });

  it('rattache au champ une erreur renvoyée par le serveur', async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await fillValidForm(user, { email: 'cecile@refuse.sn' });
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(await screen.findByText('Cette adresse est refusée par le serveur.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explique un échec d’envoi (service indisponible)', async () => {
    server.use(http.post(apiUrl('/public/contact/'), () => HttpResponse.json({ detail: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 })));
    const user = userEvent.setup();
    renderApp(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));

    expect(await screen.findByText('Envoi impossible')).toBeInTheDocument();
    expect(screen.getByText('Trop de demandes. Réessayez plus tard.')).toBeInTheDocument();
  });
});
