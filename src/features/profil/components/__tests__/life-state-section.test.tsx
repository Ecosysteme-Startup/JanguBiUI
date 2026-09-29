import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfilePage } from '@/features/profil/components/profile-page';
import { f5bState, laicDeclaration, resetF5bState } from '@/testing/mocks/db-f5b';
import { declarationHandlers, declarationNodes, declarationState, resetDeclarationState } from '@/testing/mocks/handlers/declaration';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent les mêmes routes avec d’autres données.
beforeEach(() => {
  server.use(...declarationHandlers, ...f5bHandlers);
  resetF5bState();
  resetDeclarationState();
});

const { dakar } = declarationNodes;
const dakarRef = { id: dakar.id, name: dakar.name, code: dakar.code, type: dakar.type };
const pdf = (name: string, size = 1024) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });

const renderSection = async () => {
  renderApp(<ProfilePage accountUrl={null} />);
  const section = await screen.findByRole('region', { name: /mon état de vie/i });
  await vi.waitFor(() => expect(within(section).queryByText('Chargement de votre déclaration…')).not.toBeInTheDocument());
  return section;
};

describe('Mon état de vie (/app/profil#etat-de-vie)', () => {
  it('rappelle qu’une déclaration n’ouvre aucun droit et qu’un laïc n’a rien à faire vérifier', async () => {
    const section = await renderSection();

    expect(section).toHaveAttribute('id', 'etat-de-vie');
    expect(within(section).getByText(/n’ouvre aucun droit tant qu’elle n’est pas vérifiée/i)).toBeInTheDocument();
    expect(within(section).getByText('Fidèle laïc')).toBeInTheDocument();
    expect(within(section).getByText('Aucune vérification nécessaire')).toBeInTheDocument();
  });

  it('déclare un état de clerc avec degré, diocèse d’incardination et justificatif', async () => {
    const user = userEvent.setup();
    const section = await renderSection();

    await user.click(within(section).getByRole('button', { name: 'Déclarer un autre état de vie' }));
    await user.click(within(section).getByRole('radio', { name: /clerc/i }));
    await user.selectOptions(within(section).getByLabelText(/degré d.ordre/i), 'pretre');
    await user.type(within(section).getByLabelText(/diocèse d.incardination/i), 'dakar');
    await user.click(await within(section).findByRole('button', { name: `Choisir ${dakar.name}` }));
    await user.upload(within(section).getByLabelText('Justificatif'), pdf('celebret.pdf'));
    expect(within(section).getByText('celebret.pdf')).toBeInTheDocument();
    await user.click(within(section).getByRole('button', { name: 'Envoyer ma déclaration' }));

    expect(await within(section).findByText('Déclaré · en attente de vérification')).toBeInTheDocument();
    expect(declarationState.uploads).toBe(1);
    expect(declarationState.submissions).toEqual([
      { etat_de_vie: 'clerc', degre_ordre: 'pretre', incardination_node_id: dakar.id, institut_node_id: null, attachment_file_ids: [701] },
    ]);
    const joints = within(section).getByRole('list', { name: 'Justificatifs joints' });
    expect(within(joints).getByRole('link', { name: 'justificatif-701.pdf' })).toHaveAttribute('href', 'https://fichiers.example.sn/701');
    expect(within(section).queryByRole('form', { name: /déclaration d.état de vie/i })).not.toBeInTheDocument();
  });

  it('exige le degré d’ordre et le diocèse d’un clerc, l’institut d’un consacré', async () => {
    const user = userEvent.setup();
    const section = await renderSection();

    await user.click(within(section).getByRole('button', { name: 'Déclarer un autre état de vie' }));
    await user.click(within(section).getByRole('radio', { name: /clerc/i }));
    await user.click(within(section).getByRole('button', { name: 'Envoyer ma déclaration' }));
    expect(await within(section).findByText('Indiquez votre degré d’ordre.')).toBeInTheDocument();
    expect(within(section).getByText('Choisissez votre diocèse d’incardination.')).toBeInTheDocument();

    await user.click(within(section).getByRole('radio', { name: /consacré/i }));
    await user.click(within(section).getByRole('button', { name: 'Envoyer ma déclaration' }));
    expect(await within(section).findByText('Choisissez votre institut de vie consacrée.')).toBeInTheDocument();
    expect(declarationState.submissions).toEqual([]);
  });

  it('complète la déclaration après une demande de la chancellerie : motif affiché, justificatif ajouté', async () => {
    const user = userEvent.setup();
    f5bState.declaration = laicDeclaration({
      etat_de_vie: 'clerc',
      degre_ordre: 'pretre',
      statut_verification: 'complement',
      verification_note: 'Joindre la lettre de l’évêque.',
      declared_at: '2026-09-20T09:00:00+00:00',
      incardination_node: dakarRef,
      attachments: [{ id: 42, file_name: 'celebret.pdf', file_type: 'application/pdf', url: null, created_at: '2026-09-20T09:00:00+00:00' }],
    });
    const section = await renderSection();

    expect(screen.getByRole('link', { name: 'Compléter ma déclaration' })).toHaveAttribute('href', '#etat-de-vie');
    expect(within(section).getByText('Complément demandé')).toBeInTheDocument();
    expect(within(section).getByText(/joindre la lettre de l.évêque/i)).toBeInTheDocument();
    // Le formulaire est ouvert d’office, prérempli.
    expect(within(section).getByText(dakar.name)).toBeInTheDocument();
    expect(within(section).getByLabelText(/degré d.ordre/i)).toHaveValue('pretre');

    await user.upload(within(section).getByLabelText('Justificatif'), pdf('lettre-eveque.pdf'));
    await user.click(within(section).getByRole('button', { name: 'Envoyer ma déclaration' }));

    expect(await within(section).findByText('Déclaré · en attente de vérification')).toBeInTheDocument();
    expect(declarationState.submissions[0]).toMatchObject({ incardination_node_id: dakar.id, attachment_file_ids: [701] });
    const joints = within(section).getByRole('list', { name: 'Justificatifs joints' });
    expect(within(joints).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Complément demandé pour votre déclaration')).not.toBeInTheDocument();
  });

  it('affiche le motif d’un refus', async () => {
    f5bState.declaration = laicDeclaration({
      etat_de_vie: 'consacre',
      statut_verification: 'rejete',
      verification_note: 'Aucune trace dans nos registres.',
      institut_node: { ...dakarRef, id: declarationNodes.spiritains.id, name: declarationNodes.spiritains.name, type: 'institut' },
    });
    const section = await renderSection();

    expect(within(section).getByText('Refusé')).toBeInTheDocument();
    expect(within(section).getByText('Aucune trace dans nos registres.')).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Modifier ma déclaration' })).toBeInTheDocument();
  });

  it('affiche l’erreur du serveur et refuse un fichier trop lourd ou qui n’est pas un justificatif', async () => {
    const user = userEvent.setup({ applyAccept: false });
    f5bState.declaration = laicDeclaration({ etat_de_vie: 'clerc', degre_ordre: 'diacre_permanent', incardination_node: dakarRef });
    declarationState.submitError = { status: 400, body: { error: { code: 'too_many_attachments', message: '5 justificatifs au plus.' } } };
    const section = await renderSection();

    await user.click(within(section).getByRole('button', { name: 'Modifier ma déclaration' }));
    const input = within(section).getByLabelText('Justificatif');
    await user.upload(input, pdf('enorme.pdf', 6 * 1024 * 1024));
    expect(await within(section).findByText('« enorme.pdf » dépasse 5 Mo.')).toBeInTheDocument();
    await user.upload(input, new File(['x'], 'voix.mp3', { type: 'audio/mpeg' }));
    expect(await within(section).findByText('« voix.mp3 » n’est ni un PDF ni une image.')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: 'Envoyer ma déclaration' }));
    expect(await within(section).findByText('La déclaration n’a pas pu être envoyée.')).toBeInTheDocument();
    expect(within(section).getByText('5 justificatifs au plus.')).toBeInTheDocument();
    expect(declarationState.uploads).toBe(0);
  });
});
