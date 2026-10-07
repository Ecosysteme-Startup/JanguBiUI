import { GET } from '@/app/inscription/route';

const signIn = vi.fn();
vi.mock('@/lib/auth', () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

describe('Route /inscription (JB-WEB-004)', () => {
  beforeEach(() => signIn.mockReset());

  it('ouvre le formulaire d’inscription Keycloak avec prompt=create (et non « Se connecter »)', async () => {
    signIn.mockResolvedValue(new Response(null, { status: 302 }));
    await GET();
    expect(signIn).toHaveBeenCalledWith('keycloak', { redirectTo: '/bienvenue' }, { prompt: 'create' });
  });
});
