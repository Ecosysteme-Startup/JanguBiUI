import { htmlToText, readingStats, sanitizeArticleHtml, textToHtml } from '../sanitize-html';
import { isSunday, nextSundays } from '../sundays';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

describe('sanitizeArticleHtml', () => {
  it('retire scripts, gestionnaires d’événements et liens dangereux', () => {
    const dirty =
      '<p onclick="x()">Bonjour <strong>à tous</strong></p><script>alert(1)</script><a href="javascript:alert(1)">piège</a><img src=x onerror="y()"><a href="https://jangubi.sn">site</a>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).toBe('<p>Bonjour <strong>à tous</strong></p><a>piège</a><a href="https://jangubi.sn">site</a>');
  });

  it('garde la structure produite par l’éditeur', () => {
    const html = '<h3>Horaires</h3><ul><li>7 h 30</li></ul><blockquote><p>Mt 9, 37</p></blockquote>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });
});

describe('outils de texte', () => {
  it('convertit un contenu texte ancien sans interpréter de HTML', () => {
    expect(textToHtml('Ligne <b>1</b>\nsuite\n\nSecond bloc')).toBe('<p>Ligne &lt;b&gt;1&lt;/b&gt;<br>suite</p><p>Second bloc</p>');
  });

  it('compte les mots visibles', () => {
    expect(htmlToText('<p>Un&nbsp;deux</p><p>trois</p>')).toBe('Un deux trois');
    expect(readingStats('<p>Un deux trois</p>')).toBe('3 mots · 1 min de lecture');
  });

  it('propose les prochains dimanches', () => {
    expect(nextSundays('2026-09-24', 3)).toEqual(['2026-09-27', '2026-10-04', '2026-10-11']);
    expect(nextSundays('2026-09-27', 1)).toEqual(['2026-09-27']);
    expect(isSunday('2026-09-27')).toBe(true);
    expect(isSunday('2026-09-26')).toBe(false);
  });
});
