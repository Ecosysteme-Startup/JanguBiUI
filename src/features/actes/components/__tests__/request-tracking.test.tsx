import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { RequestTracking } from '@/features/actes/components/request-tracking';
import { apiUrl } from '@/testing/mocks/api-url';
import { ACTE_IDS, actesState, resetActes } from '@/testing/mocks/db-f6-actes';
import { processorView } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

beforeEach(() => resetActes());

describe('FID-Demande-Suivi', () => {
  it('affiche l’avancement, la paroisse du sacrement et l’étape en cours', async () => {
    renderApp(<RequestTracking id={ACTE_IDS.verification} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Certificat de baptême' })).toBeInTheDocument();
    const timeline = screen.getByRole('list', { name: /avancement de la demande/i });
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(4);
    expect(within(timeline).getByText('En vérification dans le registre').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByText(/Sainte-Thérèse de Grand-Dakar/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /annuler la demande/i })).not.toBeInTheDocument();
  });

  it('annonce le motif, le délai indicatif et la date estimée de mise à disposition', async () => {
    renderApp(<RequestTracking id={ACTE_IDS.verification} />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('Mise à disposition estimée')).toBeInTheDocument();
    expect(screen.getByText('Lundi 28 septembre')).toBeInTheDocument();
    expect(screen.getByText('Délai indicatif : 7 jours')).toBeInTheDocument();
    expect(screen.getByText(/à venir · estimé lun\. 28\.09/i)).toBeInTheDocument();
    expect(screen.getAllByText(/mariage religieux/i).length).toBeGreaterThan(0);
  });

  it('ne promet plus de date une fois l’acte prêt', async () => {
    renderApp(<RequestTracking id={ACTE_IDS.ready} />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Mise à disposition estimée')).not.toBeInTheDocument();
  });

  it('permet de répondre à une demande de complément', async () => {
    const user = userEvent.setup();
    renderApp(<RequestTracking id={ACTE_IDS.info} />);

    expect(await screen.findByRole('heading', { name: /la paroisse a besoin d’un complément/i })).toBeInTheDocument();
    expect(screen.getAllByText(/nom de votre marraine/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /envoyer le complément/i }));
    expect(await screen.findByText('Écrivez votre réponse ou joignez une pièce.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Votre réponse'), 'Ma marraine est Mme Élisabeth Gomis.');
    await user.click(screen.getByRole('button', { name: /envoyer le complément/i }));

    await vi.waitFor(() => expect(actesState.lastSupplement).toEqual({ additional_info: 'Ma marraine est Mme Élisabeth Gomis.', attachment_file_id: null }));
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: /besoin d’un complément/i })).not.toBeInTheDocument());
    expect(screen.getAllByText('En vérification').length).toBeGreaterThan(0);
  });

  it('joint une pièce au complément', async () => {
    const user = userEvent.setup();
    renderApp(<RequestTracking id={ACTE_IDS.info} />);
    await screen.findByRole('heading', { name: /besoin d’un complément/i });

    await user.upload(screen.getByLabelText('Pièce justificative'), new File(['x'], 'carte-bapteme.jpg', { type: 'image/jpeg' }));
    expect(screen.getByText('carte-bapteme.jpg')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /envoyer le complément/i }));

    await vi.waitFor(() => expect(actesState.lastSupplement).toEqual({ additional_info: '', attachment_file_id: 901 }));
  });

  it('annule une demande soumise après confirmation', async () => {
    const user = userEvent.setup();
    renderApp(<RequestTracking id={ACTE_IDS.submitted} />);

    await user.click(await screen.findByRole('button', { name: 'Annuler la demande' }));
    const dialog = await screen.findByRole('dialog', { name: /annuler cette demande/i });
    await user.click(within(dialog).getByRole('button', { name: /confirmer l’annulation/i }));

    await vi.waitFor(() => expect(actesState.requests.find((r) => r.id === ACTE_IDS.submitted)?.status).toBe('cancelled'));
    await vi.waitFor(() => expect(screen.getAllByText('Annulée').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: 'Annuler la demande' })).not.toBeInTheDocument();
  });

  it('indique où retirer l’original quand l’acte est prêt, sans aucun fichier d’acte', async () => {
    renderApp(<RequestTracking id={ACTE_IDS.ready} />);

    expect(await screen.findByText('Secrétariat de la Cathédrale')).toBeInTheDocument();
    expect(screen.getByText('Lundi – vendredi, 9 h-12 h')).toBeInTheDocument();
    expect(screen.getByText(/aucun acte n'est délivré par voie numérique/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/pdf/i);
    expect(screen.queryByRole('link', { name: /télécharger/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /télécharger/i })).not.toBeInTheDocument();
  });

  it('affiche le motif du rejet', async () => {
    renderApp(<RequestTracking id={ACTE_IDS.rejected} />);

    expect(await screen.findByText(/la paroisse n’a pas pu donner suite/i)).toBeInTheDocument();
    expect(screen.getAllByText('Aucun acte à ce nom dans nos registres.').length).toBeGreaterThan(0);
  });

  it('n’affiche jamais les notes internes ni le registre, même si l’API les renvoyait', async () => {
    const leaked = actesState.requests.find((r) => r.id === ACTE_IDS.verification)!;
    server.use(
      http.get(apiUrl('/documents/requests/:id/'), () =>
        HttpResponse.json({
          ...processorView(leaked),
          internal_notes: [{ id: 1, content: 'NOTE-INTERNE-SECRETE', author_id: null, created_at: '2026-09-22T10:00:00Z' }],
          register: { volume: 'VOL-SECRET', page: '47', number: 'ACTE-187', marginal_notes: 'MENTION-SECRETE' },
        }),
      ),
    );
    renderApp(<RequestTracking id={ACTE_IDS.verification} />);

    await screen.findByRole('heading', { level: 1 });
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('NOTE-INTERNE-SECRETE');
    expect(text).not.toContain('VOL-SECRET');
    expect(text).not.toContain('ACTE-187');
    expect(text).not.toContain('MENTION-SECRETE');
    expect(screen.queryByText(/notes? internes?/i)).not.toBeInTheDocument();
  });

  it('signale une demande introuvable', async () => {
    renderApp(<RequestTracking id="inconnue" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Demande introuvable.');
  });
});
