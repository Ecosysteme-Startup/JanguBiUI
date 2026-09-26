import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import FideleHomePage from '@/app/app/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { liturgyToday } from '@/testing/mocks/db';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetF5bState());

describe('Accueil fidèle (/app)', () => {
  it('salue la personne et compose Parole, messes, demande, confession, annonces, prêtre et chapelet', async () => {
    renderApp(<FideleHomePage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Bonjour Marie-Thérèse' })).toBeInTheDocument();
    expect(await screen.findByText('Paroisse Saint-Dominique')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /demander un acte/i })).toHaveAttribute('href', '/app/demandes/nouvelle');

    const parole = screen.getByRole('region', { name: /la parole du jour|semaine du temps ordinaire/i });
    expect(await within(parole).findByText('Lc 9, 7-9')).toBeInTheDocument();
    expect(within(parole).getByRole('link', { name: /lire la parole du jour/i })).toHaveAttribute('href', '/app/parole');

    const messes = screen.getByRole('region', { name: /prochaines messes/i });
    expect(within(messes).getByRole('link', { name: 'Horaires' })).toHaveAttribute('href', '/app/paroisse#horaires');

    const demande = screen.getByRole('region', { name: /ma demande en cours/i });
    expect(await within(demande).findByText(/JB-2026-00412/)).toBeInTheDocument();
    expect(within(demande).getByText('Sainte-Thérèse de Grand-Dakar')).toBeInTheDocument();
    expect(within(demande).getByRole('img', { name: /étape 2 sur 4/i })).toBeInTheDocument();
    expect(within(demande).getByText(/original papier, à retirer au secrétariat/i)).toBeInTheDocument();

    const annonces = screen.getByRole('region', { name: /dernières annonces/i });
    expect(await within(annonces).findByRole('link', { name: /quête impérée/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/app\/paroisse\/annonces\//),
    );

    const confession = screen.getByRole('region', { name: /rendez-vous de confession/i });
    expect(await within(confession).findByText(/aucun motif n.est demandé/i)).toBeInTheDocument();

    const pretre = screen.getByRole('region', { name: /parler à un prêtre/i });
    expect(await within(pretre).findByText('Emmanuel Tine')).toBeInTheDocument();

    expect(await screen.findByText('Mystères lumineux')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /journée de récollection|répétition de la chorale/i })).toBeInTheDocument();
  });

  it('met un verset en exergue et propose « Écouter » quand le jour a un texte et un audio', async () => {
    server.use(
      http.get(apiUrl('/liturgy/today/'), () =>
        HttpResponse.json({
          ...liturgyToday,
          readings: [
            { type: 'lecture_1', citation: 'Ec 1, 2-11', text: null, verses: [{ book: 'Ecclésiaste', chapter: 1, number: 2, text: 'Vanité des vanités.' }] },
            { type: 'evangile', citation: 'Lc 9, 7-9', text: null, verses: [{ book: 'Luc', chapter: 9, number: 7, text: 'Hérode apprit tout ce qui se passait.' }] },
          ],
          audio_url: 'https://audio.example.org/lectures.mp3',
        }),
      ),
    );
    renderApp(<FideleHomePage />);

    const parole = await screen.findByRole('region', { name: /semaine du temps ordinaire/i });
    const verse = await within(parole).findByText(/Hérode apprit tout ce qui se passait/);
    expect(verse.closest('blockquote')).toHaveTextContent('Luc 9, 7');
    expect(within(parole).getByRole('button', { name: /écouter les lectures du jour/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sans texte ni audio : ni verset en exergue ni « Écouter »', async () => {
    renderApp(<FideleHomePage />);

    const parole = await screen.findByRole('region', { name: /semaine du temps ordinaire/i });
    expect(await within(parole).findByText('Lc 9, 7-9')).toBeInTheDocument();
    expect(parole.querySelector('blockquote')).toBeNull();
    expect(within(parole).queryByRole('button', { name: /écouter/i })).not.toBeInTheDocument();
  });

  it('propose de demander un acte quand aucune demande n’est en cours', async () => {
    server.use(
      http.get(apiUrl('/documents/requests/'), () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [] }),
      ),
    );
    renderApp(<FideleHomePage />);

    const demande = screen.getByRole('region', { name: /ma demande en cours/i });
    expect(await within(demande).findByText('Aucune demande en cours.')).toBeInTheDocument();
    expect(within(demande).getByRole('link', { name: /demander un extrait d.acte/i })).toHaveAttribute('href', '/app/demandes/nouvelle');
  });

  it('propose la prise de rendez-vous de confession quand aucun n’est prévu', async () => {
    renderApp(<FideleHomePage />);

    const confession = screen.getByRole('region', { name: /rendez-vous de confession/i });
    expect(await within(confession).findByText('Aucun rendez-vous prévu.')).toBeInTheDocument();
    expect(within(confession).getByRole('link', { name: /prendre rendez-vous/i })).toHaveAttribute('href', '/app/confession');
  });
});
