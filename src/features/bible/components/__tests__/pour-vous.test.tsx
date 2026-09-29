import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import {
  pourVousMarieTherese,
  pourVousRepli,
} from '@/testing/mocks/handlers/personnalisation';
import { server } from '@/testing/mocks/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToasts } from '@/components/ui/toast';
import { renderApp } from '@/testing/test-utils';

import {
  reinitialiserSignaux,
  signauxCoupes,
} from '../../utils/signaux-lecture';
import { PourVousAujourdhui } from '../pour-vous';

const POUR_VOUS_URL = `${env.API_URL}/bible/pour-vous/`;

describe('PourVousAujourdhui', () => {
  beforeEach(() => localStorage.clear());

  test('verset et sa raison, lecture à continuer, livre suggéré', async () => {
    renderApp(<PourVousAujourdhui />);
    const bloc = await screen.findByRole('region', {
      name: "Pour vous aujourd'hui",
    });
    expect(
      within(bloc).getByText(/En lien avec l'évangile du jour/),
    ).toBeInTheDocument();
    expect(within(bloc).getByText(/Seigneur, Seigneur/)).toBeInTheDocument();
    expect(
      within(bloc).getByRole('link', { name: 'Matthieu 7, 21' }),
    ).toHaveAttribute('href', '/app/bible/matthieu/7#v21');
    expect(within(bloc).getByText('Continuer Luc 9')).toBeInTheDocument();
    expect(within(bloc).getByText('Au verset 27')).toBeInTheDocument();
    expect(
      within(bloc).getByRole('link', { name: 'Reprendre Luc 9' }),
    ).toHaveAttribute('href', '/app/bible/luc/9#v27');
    expect(within(bloc).getByText('Actes')).toBeInTheDocument();
    expect(
      within(bloc).getByRole('link', { name: 'Commencer Actes' }),
    ).toHaveAttribute('href', '/app/bible/actes/1');
    expect(
      within(bloc).getByText(/visible uniquement par vous/),
    ).toBeInTheDocument();
    // Aucun score ni pourcentage d'affinité.
    expect(bloc.textContent).not.toMatch(/%|score/i);
  });

  test('« Ne plus proposer » retire le livre et s’en souvient', async () => {
    const { unmount } = renderApp(<PourVousAujourdhui />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ne plus proposer' }),
    );
    expect(screen.queryByText('Actes')).not.toBeInTheDocument();
    unmount();
    renderApp(<PourVousAujourdhui />);
    await screen.findByText('Continuer Luc 9');
    expect(screen.queryByText('Actes')).not.toBeInTheDocument();
  });

  test('repli : le verset des lectures du jour seul', async () => {
    server.use(http.get(POUR_VOUS_URL, () => HttpResponse.json(pourVousRepli)));
    renderApp(<PourVousAujourdhui />);
    expect(
      await screen.findByText(/Tiré de l'évangile du jour/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Continuer/)).not.toBeInTheDocument();
    expect(screen.getByText(/Tiré des lectures du jour\./)).toBeInTheDocument();
  });

  test('suggestions désactivées : le bloc disparaît', async () => {
    let lu = false;
    server.use(
      http.get(POUR_VOUS_URL, () => {
        lu = true;
        return HttpResponse.json({
          ...pourVousRepli,
          personnalisation_parole: false,
        });
      }),
    );
    renderApp(<PourVousAujourdhui />);
    await waitFor(() => expect(lu).toBe(true));
    // Le réglage lu coupe aussi l'envoi des signaux de lecture.
    await waitFor(() => expect(signauxCoupes()).toBe(true));
    reinitialiserSignaux();
    expect(
      screen.queryByRole('region', { name: "Pour vous aujourd'hui" }),
    ).not.toBeInTheDocument();
  });

  test('ajoute un signet sur le verset', async () => {
    let corps: unknown = null;
    server.use(
      http.post(`${env.API_URL}/bible/signets/`, async ({ request }) => {
        corps = await request.json();
        return HttpResponse.json(
          {
            id: 1,
            verset_id: 23412,
            reference: 'Matthieu 7, 21',
            livre_id: 47,
            chapitre: 7,
            numero: 21,
            texte: pourVousMarieTherese.verset.texte,
            type: 'signet',
            couleur: '',
            note: '',
            created_at: '2026-09-27T09:41:00Z',
            updated_at: '2026-09-27T09:41:00Z',
          },
          { status: 201 },
        );
      }),
    );
    renderApp(<PourVousAujourdhui />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ajouter un signet' }),
    );
    await waitFor(() =>
      expect(useToasts.getState().toasts.map((t) => t.message)).toContain(
        'Signet ajouté.',
      ),
    );
    expect(corps).toEqual({ couleur: '', verset_id: 23412 });
  });

  test('« Pourquoi ? » : signaux, interrupteur et effacement de l’historique', async () => {
    let reglage: unknown = null;
    let efface = false;
    server.use(
      http.put(`${env.API_URL}/bible/reglages/`, async ({ request }) => {
        const corps = (await request.json()) as {
          personnalisation_parole: boolean;
        };
        reglage = corps;
        return HttpResponse.json(corps);
      }),
      http.delete(`${env.API_URL}/bible/evenements/`, () => {
        efface = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp(<PourVousAujourdhui />);
    await userEvent.click(
      await screen.findByRole('button', { name: /^Pourquoi/ }),
    );
    const dialogue = await screen.findByRole('dialog', {
      name: 'Pourquoi ces suggestions ?',
    });
    expect(
      within(dialogue).getByText(
        /Vos messages, vos confessions, vos demandes et vos dons/,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialogue).getByText(/Parce que vous lisez Luc/),
    ).toBeInTheDocument();

    const interrupteur = within(dialogue).getByRole('switch', {
      name: 'Suggestions de lecture',
    });
    await waitFor(() => expect(interrupteur).toBeEnabled());
    expect(interrupteur).toBeChecked();
    await userEvent.click(interrupteur);
    await waitFor(() =>
      expect(reglage).toEqual({ personnalisation_parole: false }),
    );

    await userEvent.click(
      within(dialogue).getByRole('button', {
        name: "Effacer l'historique de lecture",
      }),
    );
    const confirmation = await screen.findByRole('dialog');
    expect(
      within(confirmation).getByText(
        'Vos signets et surlignages sont conservés.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(
      within(confirmation).getByRole('button', { name: 'Effacer' }),
    );
    await waitFor(() =>
      expect(useToasts.getState().toasts.map((t) => t.message)).toContain(
        'Historique effacé.',
      ),
    );
    expect(efface).toBe(true);
  });
});
