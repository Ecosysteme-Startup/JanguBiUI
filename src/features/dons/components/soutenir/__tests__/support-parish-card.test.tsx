import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { SupportParishCard } from '@/features/dons/components/soutenir/support-parish-card';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { publicParish } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

describe('Soutenir la paroisse', () => {
  it('invite sobrement au don quand la collecte est ouverte, avec la mention d’autorisation', async () => {
    renderApp(
      <SupportParishCard nodeId={ids.saintDominique} href="/app/dons" />,
    );

    const bloc = await screen.findByRole('region', {
      name: 'Soutenir la paroisse',
    });
    expect(bloc).toHaveTextContent(
      'Quête, campagne ou contribution annuelle : votre don est affecté au fonds que vous choisissez.',
    );
    expect(bloc).toHaveTextContent(
      /Collecte autorisée par l’Archevêché de Dakar, décision du 1er juin 2026 \(réf\. ARCH-DAK-2026-041\)\./,
    );
    expect(screen.getByRole('link', { name: 'Faire un don' })).toHaveAttribute(
      'href',
      '/app/dons',
    );
  });

  it('n’apparaît pas quand la collecte de la paroisse n’est pas ouverte', async () => {
    let served = false;
    server.use(
      http.get(apiUrl('/public/dons/paroisses/:nodeId/'), () => {
        served = true;
        return HttpResponse.json({
          ...publicParish(),
          enabled: false,
          funds: [],
        });
      }),
    );
    const { container } = renderApp(
      <SupportParishCard
        nodeId={ids.saintDominique}
        href="/paroisses/SD/don"
        variant="public"
      />,
    );

    await vi.waitFor(() => expect(served).toBe(true));
    expect(
      screen.queryByRole('region', { name: 'Soutenir la paroisse' }),
    ).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
