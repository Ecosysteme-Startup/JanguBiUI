import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createLiturgyDay, createRosaryDay } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { TodayTab } from '../today-tab';

describe('TodayTab', () => {
  test('shows the current date', async () => {
    renderApp(<TodayTab />);

    // The date should be visible as formatted text (capitalize locale)
    const today = new Date();
    const monthName = today.toLocaleDateString('fr-FR', { month: 'long' });
    await screen.findByText(new RegExp(monthName, 'i'));
  });

  test('shows liturgical readings after loading', async () => {
    const liturgyDay = createLiturgyDay({
      readings: [
        {
          type: 'lecture_1',
          citation: 'Is 55, 10-11',
          text: '<p>Comme la pluie...</p>',
          verses: [],
        },
        {
          type: 'evangile',
          citation: 'Mt 6, 7-15',
          text: '<p>Notre Père...</p>',
          verses: [],
        },
      ],
    });
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(liturgyDay),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // ReadingsSwiper renders tab buttons with normalized labels
    await screen.findByRole('tab', { name: 'Première Lecture' });
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
    expect(screen.getByText('Is 55, 10-11')).toBeInTheDocument();
    expect(screen.getByText('Mt 6, 7-15')).toBeInTheDocument();
  });

  test('shows "Aucune lecture disponible" when readings array is empty', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(createLiturgyDay({ readings: [] })),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    await screen.findByText(/aucune lecture disponible/i);
  });

  test('affiche le temps liturgique et la mention des droits', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(createLiturgyDay()),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    await screen.findByText(/Temps ordinaire — 26e dimanche/);
    expect(screen.getByText(/Textes liturgiques © AELF/)).toBeInTheDocument();
  });

  test('un autre jour appelle GET /v1/liturgy/<date>/', async () => {
    let appele = '';
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/:day/`, ({ params }) => {
        appele = String(params.day);
        if (appele === 'today') return;
        return HttpResponse.json(createLiturgyDay({ date: appele }));
      }),
    );

    renderApp(<TodayTab />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Jour suivant' }),
    );
    await waitFor(() => expect(appele).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });

  test('shows swipeable tab buttons for each reading', async () => {
    const liturgyDay = createLiturgyDay({
      readings: [
        {
          type: 'lecture1',
          citation: 'Is 6, 1-8',
          text: null,
          verses: [
            { book: 'Isaïe', chapter: 6, number: 1, text: 'Contenu local.' },
          ],
        },
        {
          type: 'gospel',
          citation: 'Lc 5, 1-11',
          text: '<p>Contenu évangile.</p>',
          verses: [],
        },
      ],
    });
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(liturgyDay),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // ReadingsSwiper renders tab buttons with normalized labels
    await screen.findByRole('tab', { name: 'Première Lecture' });
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
    // Citations are rendered in the panels (all panels are in the DOM)
    expect(screen.getByText('Is 6, 1-8')).toBeInTheDocument();
    expect(screen.getByText('Lc 5, 1-11')).toBeInTheDocument();
  });

  test('clicking a tab button does not throw', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(createLiturgyDay()),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // Wait for swiper tabs to appear then click the second one
    const psaumeTab = await screen.findByRole('tab', { name: 'Psaume' });
    await userEvent.click(psaumeTab);
    // scrollTo is not supported in jsdom but the click must not throw
    expect(psaumeTab).toBeInTheDocument();
  });
});
