import { DEFAULT_REDIRECT, safeRedirect } from '../safe-redirect';

describe('safeRedirect', () => {
  describe('destinations internes légitimes', () => {
    it('conserve un chemin interne simple', () => {
      expect(safeRedirect('/app/documents')).toBe('/app/documents');
    });

    it('conserve un chemin encodé, tel qu’il transite dans l’URL', () => {
      expect(safeRedirect(encodeURIComponent('/app/messages/12'))).toBe(
        '/app/messages/12',
      );
    });

    it('conserve les paramètres de requête et l’ancre', () => {
      expect(safeRedirect('/app/actus?page=2#article-3')).toBe(
        '/app/actus?page=2#article-3',
      );
    });
  });

  describe('renvois hors du domaine — le cœur de la faille', () => {
    it('refuse une URL absolue', () => {
      // Le scénario d'attaque : un lien vers NOTRE domaine, une connexion
      // réelle, puis un atterrissage sur un site tiers qui redemande le mot de
      // passe au prétexte d'une session expirée.
      expect(safeRedirect('https://exemple-piege.test')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse une URL absolue encodée', () => {
      expect(safeRedirect(encodeURIComponent('https://exemple-piege.test'))).toBe(
        DEFAULT_REDIRECT,
      );
    });

    it('refuse une URL protocol-relative', () => {
      // `//hote` ressemble à un chemin mais désigne bien un autre serveur.
      expect(safeRedirect('//exemple-piege.test')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse les variantes à antislash que les navigateurs normalisent', () => {
      // Contournement classique d'un contrôle naïf du double slash.
      expect(safeRedirect('/\\exemple-piege.test')).toBe(DEFAULT_REDIRECT);
      expect(safeRedirect('\\\\exemple-piege.test')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse le schéma javascript:', () => {
      expect(safeRedirect('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse un chemin relatif sans slash initial', () => {
      expect(safeRedirect('exemple-piege.test')).toBe(DEFAULT_REDIRECT);
    });
  });

  describe('cas limites', () => {
    it('retombe sur le défaut quand le paramètre est absent', () => {
      expect(safeRedirect(null)).toBe(DEFAULT_REDIRECT);
      expect(safeRedirect(undefined)).toBe(DEFAULT_REDIRECT);
      expect(safeRedirect('')).toBe(DEFAULT_REDIRECT);
    });

    it('retombe sur le défaut quand l’encodage est invalide', () => {
      expect(safeRedirect('%zz')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse de reboucler sur l’authentification', () => {
      // Sinon une connexion réussie renverrait vers l'écran de connexion.
      expect(safeRedirect('/auth/login')).toBe(DEFAULT_REDIRECT);
    });

    it('honore le repli fourni par l’appelant', () => {
      expect(safeRedirect(null, '/app/clerge')).toBe('/app/clerge');
      expect(safeRedirect('https://exemple-piege.test', '/app/clerge')).toBe(
        '/app/clerge',
      );
    });
  });
});
