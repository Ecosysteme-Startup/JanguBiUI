import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import {
  choisirNoeud,
  type Capacite,
} from '@/features/dons-analyse/api/get-mes-capacites';
import { clearSession, getAccessToken } from '@/lib/api-client';
import { buildAuthorizationUrl, oidcEndpoints } from '@/lib/oidc';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor } from '@/testing/test-utils';

import { AuthCallback } from '../auth-callback';
import { KeycloakRedirect } from '../keycloak-redirect';

const original = window.location;
let assign: ReturnType<typeof vi.fn>;

const poserLocation = (search = '') => {
  assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      origin: original.origin,
      href: `${original.origin}/auth/callback${search}`,
      pathname: '/auth/callback',
      search,
      assign,
    },
  });
};

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: original,
  });
  clearSession();
  sessionStorage.clear();
});

describe('KeycloakRedirect', () => {
  test('connexion : envoie le navigateur sur Keycloak (PKCE)', async () => {
    poserLocation();
    renderApp(<KeycloakRedirect action="login" />);
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const url = new URL(assign.mock.calls[0][0] as string);
    expect(`${url.origin}${url.pathname}`).toBe(oidcEndpoints().authorization);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(
      screen.getByRole('link', { name: /créer un compte/i }),
    ).toHaveAttribute('href', '/auth/register');
  });

  test('inscription : page d’inscription Keycloak', async () => {
    poserLocation();
    renderApp(<KeycloakRedirect action="register" />);
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const url = new URL(assign.mock.calls[0][0] as string);
    expect(url.searchParams.get('prompt')).toBe('create');
  });
});

describe('AuthCallback', () => {
  test('échange le code, lit /v1/me/ et revient à la page demandée', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    const url = new URL(
      await buildAuthorizationUrl({ redirectTo: '/app/ecouter' }),
    );
    const nonce = url.searchParams.get('nonce')!;
    server.use(
      http.post(oidcEndpoints().token, () =>
        HttpResponse.json({
          access_token: 'acces-rappel',
          expires_in: 600,
          refresh_token: 'refresh-rappel',
          id_token: `e30.${btoa(JSON.stringify({ nonce }))}.s`,
        }),
      ),
    );
    poserLocation(`?code=abc&state=${url.searchParams.get('state')}`);
    renderApp(<AuthCallback />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/app/ecouter'));
    expect(getAccessToken()).toBe('acces-rappel');
  });

  test('refus Keycloak : message et bouton pour recommencer', async () => {
    poserLocation('?error=access_denied&state=x');
    renderApp(<AuthCallback />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /connexion a été annulée/i,
    );
    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeInTheDocument();
  });
});

describe('choisirNoeud (réponse réelle de /v1/me/capacites/)', () => {
  const cap = (over: Partial<Capacite>): Capacite => ({
    capacite: 'dons.voir_fonds',
    node_id: 'p-1',
    node_name: 'Paroisse Saint-Dominique',
    node_type: 'paroisse',
    // Le backend renvoie herite=true pour l'économe : l'office s'étend aux
    // nœuds enfants. Ce n'est pas un droit venu du diocèse.
    herite: true,
    office: 'econome_paroissial',
    office_label: 'Économe paroissial',
    ...over,
  });

  test('économe paroissial : la paroisse de sa nomination', () => {
    expect(choisirNoeud([cap({})], 'paroisse')?.id).toBe('p-1');
  });

  test('un droit tenu au diocèse ne donne pas d’analyse paroissiale', () => {
    expect(
      choisirNoeud([cap({ node_type: 'diocese', node_id: 'd-1' })], 'paroisse'),
    ).toBeNull();
  });
});
