import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import ExportPage from '@/app/espace/[nodeId]/dons/export/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { donsState, grantsEconome, grantsSecretaireDons } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const nodeId = ids.saintDominique;
const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:export');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  URL.createObjectURL = original.create;
  URL.revokeObjectURL = original.revoke;
});

const renderPage = async (capacites = grantsEconome) => renderApp(await ExportPage({ params: Promise.resolve({ nodeId }) }), { capacites });

describe('Exporter et rapprocher (WEB-PAR-Dons-Export)', () => {
  it('exporte au format Excel sur la période choisie', async () => {
    const user = userEvent.setup();
    let params: URLSearchParams | null = null;
    server.use(
      http.get(apiUrl('/staff/dons/export/'), ({ request }) => {
        params = new URL(request.url).searchParams;
        donsState.exports.push(params.get('fichier') ?? '');
        return new HttpResponse(new Blob(['x']), { headers: { 'Content-Type': 'application/octet-stream' } });
      }),
    );
    await renderPage();

    fireEvent.change(await screen.findByLabelText(/^Du/), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/^Au/), { target: { value: '2026-09-30' } });
    await user.click(screen.getByRole('button', { name: 'Excel' }));
    expect(screen.getByRole('button', { name: 'Excel' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Exporter' }));

    await vi.waitFor(() => expect(donsState.exports).toContain('xlsx'));
    expect(params!.get('date_from')).toBe('2026-09-01');
    expect(params!.get('date_to')).toBe('2026-09-30');
    expect(params!.get('fund')).toBeNull();
    expect(screen.getByText('L’export est inscrit au journal d’audit.')).toBeInTheDocument();
  });

  it('bloque une période inversée', async () => {
    await renderPage();

    fireEvent.change(await screen.findByLabelText(/^Du/), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText(/^Au/), { target: { value: '2026-09-01' } });

    expect(await screen.findByText('La fin doit suivre le début.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeDisabled();
  });

  it('présente le rapprochement, les écarts et les reversements', async () => {
    await renderPage();

    const reco = await screen.findByRole('region', { name: 'Rapprochement' });
    await within(reco).findByText('Payé en ligne');
    const value = (label: string) => within(reco).getByText(label).closest('div')!.querySelector('dd')!.textContent;
    expect(value('Payé en ligne')).toMatch(/356\s330\sFCFA/);
    expect(value('Frais')).toMatch(/−\s7\s120\sFCFA/);
    expect(value('Affecté en ligne')).toMatch(/349\s210\sFCFA/);
    expect(value('Espèces')).toMatch(/858\s500\sFCFA/);
    expect(value('Reversé (archidiocèse)')).toMatch(/301\s480\sFCFA/);
    expect(value('En attente de reversement')).toMatch(/47\s730\sFCFA/);

    const ecarts = screen.getByRole('region', { name: /Écarts signalés/ });
    expect(await within(ecarts).findByText('Paiement en attente depuis plus de 24 h')).toBeInTheDocument();
    expect(within(ecarts).getByRole('link', { name: /Voir les opérations/ })).toHaveAttribute('href', `/espace/${nodeId}/dons?mois=2026-09`);
    expect(within(ecarts).getByRole('link', { name: /Valider la saisie/ })).toHaveAttribute('href', `/espace/${nodeId}/dons/quetes`);
    expect(within(ecarts).getByRole('link', { name: /Voir le reversement/ })).toHaveAttribute('href', `/espace/${nodeId}/dons/export#reversements`);
    expect(await within(ecarts).findByText(/−\s2\s940\sFCFA/)).toBeInTheDocument();

    const reversements = screen.getByRole('region', { name: 'Reversements' });
    expect(within(reversements).getByText('PO-2026-0914')).toBeInTheDocument();
    expect(within(reversements).getAllByText('Rapproché')).toHaveLength(2);
  });

  it('dit quand il n’y a aucun écart', async () => {
    server.use(
      http.get(apiUrl('/staff/dons/rapprochement/'), () =>
        HttpResponse.json({ date_from: '2026-09-01', date_to: '2026-09-30', online_charged: 0, online_fees: 0, online_net: 0, cash: 0, paid_out: 0, awaiting_payout: 0, issues: [] }),
      ),
    );
    await renderPage();

    expect(await screen.findByText('Aucun écart sur la période')).toBeInTheDocument();
  });

  it('est réservé à dons.exporter', async () => {
    await renderPage(grantsSecretaireDons);

    expect(await screen.findByText('Export des dons : accès réservé')).toBeInTheDocument();
  });
});
