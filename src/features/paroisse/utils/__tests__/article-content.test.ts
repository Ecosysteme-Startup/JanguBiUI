import { articleBody, readingMinutes, sanitizeArticleHtml } from '@/features/paroisse/utils/article-content';

describe('articleBody', () => {
  it('nettoie le HTML : scripts, gestionnaires, URL javascript et balises hors liste', () => {
    const html = sanitizeArticleHtml('<p onclick="x()">A</p><script>x()</script><a href="javascript:x()">B</a><img src=x onerror=x()><h2 style="color:red">T</h2>');
    expect(html).toBe('<p>A</p><a rel="noopener noreferrer" target="_blank">B</a><h2>T</h2>');
  });

  it('traite comme du HTML nettoyé une ancienne annonce « text » qui contient des balises', () => {
    expect(articleBody('<p>Bonjour</p><script>x()</script>', 'text')).toEqual({ kind: 'html', html: '<p>Bonjour</p>' });
  });

  it('découpe un texte brut en paragraphes', () => {
    expect(articleBody('Un.\n\nDeux.\n', 'text')).toEqual({ kind: 'text', paragraphs: ['Un.', 'Deux.'] });
  });

  it('compte au moins une minute de lecture', () => {
    expect(readingMinutes('<p>court</p>')).toBe(1);
    expect(readingMinutes(Array.from({ length: 600 }, () => 'mot').join(' '))).toBe(3);
  });
});
