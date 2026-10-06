import { broadcastLogout, onLogoutBroadcast } from '@/lib/logout-channel';

/**
 * La diffusion passe par BroadcastChannel (repli `storage`). On teste le chemin déterministe en
 * jsdom : l'événement `storage` d'un AUTRE onglet (préfixe d'onglet différent) déclenche le
 * handler, et le désabonnement y met fin.
 */
describe('logout-channel (JB-WEB-041)', () => {
  const otherTabEvent = () => new StorageEvent('storage', { key: 'jangubi-logout', newValue: 'autre-onglet:123' });

  it('prévient à la réception d’une déconnexion d’un autre onglet', () => {
    const handler = vi.fn();
    const unsubscribe = onLogoutBroadcast(handler);

    window.dispatchEvent(otherTabEvent());

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('ignore une clé storage étrangère et cesse après désabonnement', () => {
    const handler = vi.fn();
    const unsubscribe = onLogoutBroadcast(handler);

    window.dispatchEvent(new StorageEvent('storage', { key: 'autre-cle', newValue: 'x' }));
    expect(handler).not.toHaveBeenCalled();

    unsubscribe();
    window.dispatchEvent(otherTabEvent());
    expect(handler).not.toHaveBeenCalled();
  });

  it('broadcastLogout inscrit un marqueur dans le localStorage', () => {
    localStorage.removeItem('jangubi-logout');
    broadcastLogout();
    expect(localStorage.getItem('jangubi-logout')).toMatch(/:\d+$/);
  });
});
