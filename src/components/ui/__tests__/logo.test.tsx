import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { BRAND_BLUE, Logo, LOGO_PATHS, LOGO_VIEWBOX } from '@/components/ui/logo';

describe('Logo', () => {
  it('reproduit le logo officiel (cadrage et deux tracés du mobile), annoncé « Jàngu Bi »', () => {
    render(<Logo />);
    const logo = screen.getByRole('img', { name: 'Jàngu Bi' });
    expect(logo).toHaveAttribute('viewBox', '86 71 203 233');
    expect(logo.querySelectorAll('path')).toHaveLength(2);
    expect(logo).toHaveAttribute('height', '32');
    expect(logo).toHaveAttribute('width', '27.88');
    expect(logo).toHaveClass('fill-brand');
    expect(logo).toMatchSnapshot();
  });

  it('suit la taille demandée en gardant le ratio', () => {
    render(<Logo size={233} />);
    expect(screen.getByRole('img')).toHaveAttribute('width', '203');
  });

  it('variante monochrome : couleur du texte courant, pour les fonds sombres ou colorés', () => {
    render(<Logo tone="mono" className="text-on-primary" />);
    expect(screen.getByRole('img')).toHaveClass('fill-current', 'text-on-primary');
    expect(screen.getByRole('img')).not.toHaveClass('fill-brand');
  });

  it('accepte une couleur explicite et un libellé', () => {
    render(<Logo color="currentColor" label="Jàngu Bi, accueil" />);
    const logo = screen.getByRole('img', { name: 'Jàngu Bi, accueil' });
    expect(logo).toHaveStyle({ fill: 'currentColor' });
  });

  it('décoratif à côté du nom écrit : masqué aux lecteurs d’écran', () => {
    const { container } = render(<Logo decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('garde le tracé, le cadrage et la couleur du fichier officiel du mobile', () => {
    expect(BRAND_BLUE).toBe('#70CBFF');
    expect(LOGO_VIEWBOX).toBe('86 71 203 233');
    expect(LOGO_PATHS).toHaveLength(2);
    const tokens = readFileSync(path.resolve(__dirname, '../../../styles/tokens.css'), 'utf8');
    expect(tokens.match(/--jb-brand: (#[0-9A-F]{6})/gi)).toEqual([`--jb-brand: ${BRAND_BLUE}`, `--jb-brand: ${BRAND_BLUE}`]);
  });

  it('l’icône du site est générée depuis le même tracé', () => {
    const icon = readFileSync(path.resolve(__dirname, '../../../app/icon.svg'), 'utf8');
    for (const d of LOGO_PATHS) expect(icon).toContain(d);
    expect(icon).toContain(BRAND_BLUE);
  });
});
