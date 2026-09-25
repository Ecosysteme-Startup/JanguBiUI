import { render, screen } from '@testing-library/react';

import { Field } from '../field';
import { Input } from '../input';

describe('Field', () => {
  it('relie le libellé, l’aide et l’erreur au contrôle', () => {
    render(
      <Field id="annee" label="Année du baptême" required hint="Quatre chiffres" error="Quatre chiffres, par exemple 1992.">
        <Input defaultValue="199" />
      </Field>,
    );
    const input = screen.getByLabelText(/Année du baptême/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Quatre chiffres, par exemple 1992\./);
    expect(screen.getByRole('alert')).toHaveTextContent('Quatre chiffres, par exemple 1992.');
    expect(screen.getByText('(obligatoire)')).toBeInTheDocument();
  });
});
