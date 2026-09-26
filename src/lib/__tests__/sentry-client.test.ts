const sdk = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn(), captureRouterTransitionStart: vi.fn() }));
vi.mock('@/lib/sentry-sdk', () => sdk);

describe('Sentry chargé à la demande', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(sdk).forEach((fn) => fn.mockClear());
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://cle@exemple.test/1');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('ne charge pas le SDK au démarrage, mais après le chargement de la page', async () => {
    vi.useFakeTimers();
    const { startSentry } = await import('@/lib/sentry-client');

    startSentry();
    expect(sdk.init).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledOnce());
    expect(sdk.init).toHaveBeenCalledWith(expect.objectContaining({ replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0 }));
    vi.useRealTimers();
  });

  it('une erreur signalée avant le chargement est envoyée une fois le SDK prêt', async () => {
    const { captureException } = await import('@/lib/sentry-client');
    const error = new Error('incident');

    captureException(error);

    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(error));
    expect(sdk.init).toHaveBeenCalledOnce();
  });

  it('une erreur non rattrapée avant le chargement déclenche le chargement et n’est pas perdue', async () => {
    const { startSentry } = await import('@/lib/sentry-client');
    startSentry();
    const error = new Error('précoce');

    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));

    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(error));
  });
});
