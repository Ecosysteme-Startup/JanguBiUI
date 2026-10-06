import { waitFor } from '@testing-library/react';

import { preferFideleSpace, StaffHomeRedirect } from '@/components/layouts/staff-home-redirect';
import { grantsSecretaire } from '@/testing/mocks/db';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

describe('StaffHomeRedirect (JB-WEB-033/037/043)', () => {
  beforeEach(() => {
    navigation.replace.mockClear();
    sessionStorage.clear();
  });

  it('renvoie un responsable de l’espace fidèle vers /espace', async () => {
    renderApp(<StaffHomeRedirect />, { capacites: grantsSecretaire });
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/espace'));
  });

  it('ne redirige pas un fidèle sans nomination', async () => {
    renderApp(<StaffHomeRedirect />, { capacites: [] });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('respecte le choix de rester côté fidèle', async () => {
    preferFideleSpace();
    renderApp(<StaffHomeRedirect />, { capacites: grantsSecretaire });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
