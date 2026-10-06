import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RequestProcessing } from '@/features/actes-traitement/components/request-processing';
import { ids } from '@/testing/mocks/db';
import { ACTE_IDS, actesState, resetActes } from '@/testing/mocks/db-f6-actes';
import { renderApp } from '@/testing/test-utils';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

beforeEach(() => resetActes());

const render = (id: string) => renderApp(<RequestProcessing nodeId={ids.saintDominique} id={id} />);
const decision = () => screen.getByRole('region', { name: 'Statut' });

describe('PAR-Demande-Detail', () => {
  it('montre les informations du fidèle, le registre, le journal et les notes internes', async () => {
    render(ACTE_IDS.verification);

    expect(await screen.findByRole('heading', { level: 1, name: 'Certificat de baptême' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Marie-Thérèse Ndèye Diouf/ })).toBeInTheDocument();
    expect(screen.getByText('+221 77 418 26 90')).toBeInTheDocument();
    expect(screen.getByLabelText('Volume')).toHaveValue('II');
    expect(screen.getByLabelText('N° d’acte')).toHaveValue('187');
    expect(within(screen.getByRole('region', { name: /historique/i })).getByText('Passée en vérification')).toBeInTheDocument();
    expect(await screen.findByText('Deux baptêmes au même nom en 1992 : vérifier la marraine.')).toBeInTheDocument();
    expect(screen.getByText('Non visibles du fidèle')).toBeInTheDocument();
  });

  it('ne propose que les transitions permises en vérification', async () => {
    render(ACTE_IDS.verification);
    await screen.findByRole('heading', { level: 1 });

    const panel = decision();
    const choices = within(panel).getByRole('group', { name: 'Changer le statut' });
    expect(within(choices).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      expect.stringMatching(/^Complément demandé/),
      expect.stringMatching(/^Prête à retirer/),
      expect.stringMatching(/^Rejetée/),
    ]);
    expect(within(panel).getByRole('radio', { name: /prête à retirer/i })).toBeChecked();
    expect(within(panel).queryByRole('button', { name: /marquer comme retirée/i })).not.toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /commencer la vérification/i })).not.toBeInTheDocument();
  });

  it('n’autorise « prête à retirer » qu’une fois l’original signé et scellé', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.verification);
    await screen.findByRole('heading', { level: 1 });

    const button = within(decision()).getByRole('button', { name: 'Marquer prête à retirer' });
    expect(button).toBeDisabled();
    // JB-WEB-029 : un texte explique pourquoi le bouton est grisé.
    expect(within(decision()).getByText(/cochez.*pour activer ce bouton/i)).toBeInTheDocument();
    await user.click(within(decision()).getByRole('checkbox', { name: /signé par le curé et scellé/i }));
    expect(button).toBeEnabled();
    expect(within(decision()).queryByText(/pour activer ce bouton/i)).not.toBeInTheDocument();
  });

  it('indique qui a traité la demande rejetée, non la personne assignée (JB-WEB-029)', async () => {
    render(ACTE_IDS.rejected);
    const attribution = await screen.findByRole('region', { name: 'Attribution' });
    expect(within(attribution).getByText(/Traitée par Germaine Faye/)).toBeInTheDocument();
  });

  it.each([
    [ACTE_IDS.submitted, ['Commencer la vérification']],
    [ACTE_IDS.info, []],
    [ACTE_IDS.ready, ['Marquer comme retirée']],
    [ACTE_IDS.collected, []],
    [ACTE_IDS.rejected, []],
  ])('masque les transitions interdites (%s)', async (id, expected) => {
    render(id);
    await screen.findByRole('heading', { level: 1 });

    expect(within(decision()).queryAllByRole('button').map((b) => b.textContent)).toEqual(expected);
  });

  it('commence la vérification d’une demande soumise', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.submitted);

    await user.click(await screen.findByRole('button', { name: 'Commencer la vérification' }));

    expect(await within(decision()).findByRole('button', { name: 'Marquer prête à retirer' })).toBeInTheDocument();
    expect(actesState.lastTransition).toEqual({ id: ACTE_IDS.submitted, transition: 'start-verification', body: { message: '', pickup_hours: '' } });
  });

  it('exige un motif pour rejeter, puis transmet le rejet', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.verification);
    await user.click(await screen.findByRole('radio', { name: /rejetée/i }));
    await user.click(within(decision()).getByRole('button', { name: 'Rejeter la demande' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rejeter la demande' });
    await user.click(within(dialog).getByRole('button', { name: 'Rejeter la demande' }));
    expect(await within(dialog).findByText('Le motif du rejet est obligatoire.')).toBeInTheDocument();
    expect(actesState.lastTransition).toBeNull();

    await user.type(within(dialog).getByLabelText(/motif du rejet/i), 'Baptême célébré à Saint-Dominique.');
    await user.click(within(dialog).getByRole('button', { name: 'Rejeter la demande' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(actesState.lastTransition).toMatchObject({ transition: 'reject', body: { message: 'Baptême célébré à Saint-Dominique.' } });
    expect(await within(decision()).findByText(/demande close : rejetée/i)).toBeInTheDocument();
  });

  it('demande un complément au fidèle', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.verification);
    await user.click(await screen.findByRole('radio', { name: /complément demandé/i }));
    await user.click(within(decision()).getByRole('button', { name: 'Demander un complément' }));

    const dialog = await screen.findByRole('dialog', { name: 'Demander un complément' });
    await user.type(within(dialog).getByLabelText(/complément attendu/i), 'Nom de la marraine ?');
    await user.click(within(dialog).getByRole('button', { name: /envoyer la demande de complément/i }));

    await vi.waitFor(() => expect(actesState.lastTransition).toMatchObject({ transition: 'request-info', body: { message: 'Nom de la marraine ?' } }));
    expect(await within(decision()).findByText(/en attente du complément du fidèle/i)).toBeInTheDocument();
  });

  it('marque prête à retirer avec le lieu et les horaires de retrait', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.verification);
    await user.click(await screen.findByRole('checkbox', { name: /signé par le curé et scellé/i }));
    await user.click(within(decision()).getByRole('button', { name: 'Marquer prête à retirer' }));

    const dialog = await screen.findByRole('dialog', { name: 'Marquer comme prête à retirer' });
    await user.selectOptions(await within(dialog).findByLabelText('Lieu de retrait'), await within(dialog).findByRole('option', { name: 'Église Sainte-Thérèse' }));
    await user.type(within(dialog).getByLabelText('Horaires du secrétariat'), 'Lundi – vendredi, 9 h-12 h');
    await user.click(within(dialog).getByRole('button', { name: /confirmer : prête à retirer/i }));

    await vi.waitFor(() =>
      expect(actesState.lastTransition).toMatchObject({
        transition: 'mark-ready',
        body: { message: '', pickup_place_id: 11, pickup_hours: 'Lundi – vendredi, 9 h-12 h' },
      }),
    );
    expect(await within(decision()).findByRole('button', { name: 'Marquer comme retirée' })).toBeInTheDocument();
  });

  it('enregistre la référence du registre et ajoute une note interne', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.verification);
    const page = await screen.findByLabelText('Page');

    await user.clear(page);
    await user.type(page, '48');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la référence' }));
    await vi.waitFor(() => expect(actesState.requests.find((r) => r.id === ACTE_IDS.verification)?.register.page).toBe('48'));

    await user.type(screen.getByLabelText('Ajouter une note interne'), 'Acte retrouvé.');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('region', { name: /notes internes/i })).toHaveTextContent('Non visibles du fidèle');
    expect(await screen.findByText('Acte retrouvé.')).toBeInTheDocument();
  });

  it('liste les pièces du fidèle avec un lien de consultation, sans aucun fichier d’acte', async () => {
    render(ACTE_IDS.verification);

    const pieces = await screen.findByRole('list', { name: 'Pièces jointes du fidèle' });
    expect(within(pieces).getByText('carte-bapteme-1992.jpg')).toBeInTheDocument();
    expect(within(pieces).getByText(/412 Ko · déposée le 21\.09/)).toBeInTheDocument();
    const link = within(pieces).getByRole('link', { name: /ouvrir carte-bapteme-1992\.jpg/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('token='));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('nomme l’auteur de chaque étape de l’historique et de chaque note', async () => {
    render(ACTE_IDS.verification);

    const history = await screen.findByRole('region', { name: /historique des statuts/i });
    expect(within(history).getByText('Soumise depuis l’espace fidèle')).toBeInTheDocument();
    expect(within(history).getByText(/^Marie-Thérèse Diouf · /)).toBeInTheDocument();
    expect(within(history).getAllByText(/^Germaine Faye · /).length).toBeGreaterThan(0);
    expect(await screen.findByText(/^Germaine Faye · 22\.09/)).toBeInTheDocument();
  });

  it('assigne la demande à une personne de l’équipe, puis la remet à assigner', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.submitted);
    const section = await screen.findByRole('region', { name: 'Attribution' });
    expect(within(section).getByLabelText('Suivie par')).toHaveValue('');

    await user.selectOptions(within(section).getByLabelText('Suivie par'), await within(section).findByRole('option', { name: 'Germaine Faye' }));
    await user.click(within(section).getByRole('button', { name: 'Enregistrer l’attribution' }));

    await vi.waitFor(() => expect(actesState.lastAssign).toEqual({ id: ACTE_IDS.submitted, body: { assignee_id: '5f0c0000-0000-4000-8000-0000000000bb' } }));
    await vi.waitFor(() => expect(within(screen.getByRole('region', { name: 'Attribution' })).getByLabelText('Suivie par')).toHaveValue('5f0c0000-0000-4000-8000-0000000000bb'));

    const again = screen.getByRole('region', { name: 'Attribution' });
    await user.selectOptions(within(again).getByLabelText('Suivie par'), '');
    await user.click(within(again).getByRole('button', { name: 'Enregistrer l’attribution' }));
    await vi.waitFor(() => expect(actesState.lastAssign?.body).toEqual({ assignee_id: null }));
  });

  it('propose de se l’attribuer', async () => {
    const user = userEvent.setup();
    render(ACTE_IDS.submitted);

    await user.click(await screen.findByRole('button', { name: 'Me l’attribuer' }));

    await vi.waitFor(() => expect(actesState.lastAssign?.body).toEqual({ assignee_id: '5f0c0000-0000-4000-8000-0000000000aa' }));
  });

  it('signale une demande hors de la file', async () => {
    render('inconnue');

    expect(await screen.findByRole('alert')).toHaveTextContent('Cette demande n’est pas dans votre file.');
  });
});
