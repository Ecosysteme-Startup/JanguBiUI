import { aelfField, aelfParts, sourceLine } from '@/utils/aelf';
import { sanitizeAelfHtml } from '@/utils/sanitize-aelf';

describe('AELF tel quel', () => {
  it('lit les clés AELF défensivement : texte seulement, sinon rien', () => {
    expect(aelfField({ titre: 'Lecture du livre' }, 'titre')).toBe('Lecture du livre');
    expect(aelfField({ titre: 3 }, 'titre')).toBeNull();
    expect(aelfField({ titre: '  ' }, 'titre')).toBeNull();
    expect(aelfField(null, 'titre')).toBeNull();
    expect(aelfField(undefined, 'titre')).toBeNull();
    expect(aelfParts({})).toEqual({ titre: null, intro: null, refrain: null, refRefrain: null, acclamation: null, refAcclamation: null });
  });

  it('indique la source servie, sans édition codée en dur', () => {
    expect(sourceLine('aelf')).toMatch(/AELF/);
    expect(sourceLine('crampon_refs', { label: 'Bible Crampon (1923)' })).toMatch(/Bible Crampon \(1923\)/);
    expect(sourceLine('crampon_refs', null)).not.toMatch(/Crampon/);
    expect(sourceLine(undefined, null)).toBeNull();
  });

  it('assainit le HTML AELF : garde le balisage de texte et verse_number, retire scripts et attributs', () => {
    const out = sanitizeAelfHtml(
      '<p onclick="x()" style="color:red"><span class="verse_number evil">1</span> Texte<script>alert(1)</script><img src=x onerror=y><a href="javascript:z">lien</a></p>',
    );
    expect(out).toBe('<p><span class="verse_number">1</span> Textelien</p>');
    expect(sanitizeAelfHtml('<span class="autre">a</span>')).toBe('<span>a</span>');
  });
});
