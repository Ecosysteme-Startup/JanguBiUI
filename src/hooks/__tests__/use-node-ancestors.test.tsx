import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { useNodeParentName } from '@/hooks/use-node-ancestors';
import { apiUrl } from '@/testing/mocks/api-url';
import { server } from '@/testing/mocks/server';
import { createTestQueryClient } from '@/testing/test-utils';

const node = (id: string, name: string, code: string) => ({ id, name, code: id.toUpperCase(), type: { code, label: code } });
const province = node('dakp', 'Province ecclésiastique de Dakar', 'province');
const diocese = node('dak', 'Archidiocèse de Dakar', 'diocese');
const doyenne = node('plateau', 'Doyenné Plateau-Médina', 'doyenne');

// L'API renvoie les ancêtres de la racine au parent (`node_ancestors`, tri par profondeur).
const serve = (chain: unknown[]) => server.use(http.get(apiUrl('/hierarchy/nodes/:nodeId/ancestors/'), () => HttpResponse.json(chain)));

const parentName = async () => {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useNodeParentName('paroisse'), { wrapper });
  await waitFor(() => expect(result.current).toBeDefined());
  return result.current;
};

describe('Rattachement affiché dans le sélecteur de contexte', () => {
  it('une paroisse dans un doyenné affiche son doyenné (parent immédiat), puis son diocèse', async () => {
    serve([province, diocese, doyenne]);
    expect(await parentName()).toBe('Doyenné Plateau-Médina · Archidiocèse de Dakar');
  });

  it('une paroisse rattachée directement au diocèse affiche le diocèse seul', async () => {
    serve([province, diocese]);
    expect(await parentName()).toBe('Archidiocèse de Dakar');
  });

  it('un diocèse affiche sa province', async () => {
    serve([province]);
    expect(await parentName()).toBe('Province ecclésiastique de Dakar');
  });
});
