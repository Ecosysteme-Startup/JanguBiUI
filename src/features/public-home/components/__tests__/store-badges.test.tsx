import { render, screen } from '@testing-library/react';

const renderBadges = async () => {
  vi.resetModules();
  const { StoreBadges } = await import(
    '@/features/public-home/components/store-badges'
  );
  return render(<StoreBadges />);
};

describe('Accueil : badges App Store et Google Play', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('renvoie vers l’App Store et Google Play quand les fiches sont configurées', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_APP_STORE_URL',
      'https://apps.apple.com/app/jangubi/id123',
    );
    vi.stubEnv(
      'NEXT_PUBLIC_PLAY_STORE_URL',
      'https://play.google.com/store/apps/details?id=sn.jangubi',
    );
    const { container } = await renderBadges();

    expect(container.querySelector('#application')).not.toBeNull();
    expect(screen.getByRole('link', { name: /app store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/app/jangubi/id123',
    );
    expect(screen.getByRole('link', { name: /google play/i })).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=sn.jangubi',
    );
  });

  it('annonce « Bientôt » sans lien tant que l’application n’est pas publiée', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', '');
    await renderBadges();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByText(/bientôt sur/i)).toHaveLength(2);
  });

  it('montre les logos des deux boutiques', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_APP_STORE_URL',
      'https://apps.apple.com/app/jangubi/id123',
    );
    vi.stubEnv(
      'NEXT_PUBLIC_PLAY_STORE_URL',
      'https://play.google.com/store/apps/details?id=sn.jangubi',
    );
    await renderBadges();

    for (const link of screen.getAllByRole('link')) {
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });
});
