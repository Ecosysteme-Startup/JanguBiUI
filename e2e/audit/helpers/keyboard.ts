import type { Page } from '@playwright/test';

export interface FocusInfo {
  desc: string;
  visible: boolean; // indicateur de focus perceptible
  indicator: string;
  inDialog: boolean;
  top: number;
  left: number;
}

/** Décrit l'élément actif et son indicateur de focus (outline, box-shadow, ring). */
export async function focusInfo(page: Page): Promise<FocusInfo> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { desc: 'body', visible: false, indicator: 'aucun', inDialog: false, top: 0, left: 0 };
    const cs = getComputedStyle(el);
    const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? `outline ${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : '';
    const shadow = cs.boxShadow && cs.boxShadow !== 'none' ? `box-shadow ${cs.boxShadow.slice(0, 60)}` : '';
    // Indicateur porté par un pseudo-élément ou un parent (ex. focus-within).
    const after = getComputedStyle(el, '::after');
    const pseudo = after.content !== 'none' && (after.outlineStyle !== 'none' || (after.boxShadow && after.boxShadow !== 'none')) ? 'pseudo ::after' : '';
    const r = el.getBoundingClientRect();
    const name = (el.getAttribute('aria-label') ?? el.innerText ?? el.getAttribute('placeholder') ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
    return {
      desc: `${role}${name ? ` « ${name} »` : ''}`,
      visible: Boolean(outline || shadow || pseudo),
      indicator: outline || shadow || pseudo || 'aucun',
      inDialog: Boolean(el.closest('[role=dialog], [role=alertdialog]')),
      top: Math.round(r.top + window.scrollY),
      left: Math.round(r.left),
    };
  });
}

/** Appuie N fois sur Tab en relevant chaque arrêt. */
export async function tabWalk(page: Page, n: number, key: 'Tab' | 'Shift+Tab' = 'Tab'): Promise<FocusInfo[]> {
  const out: FocusInfo[] = [];
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press(key);
    out.push(await focusInfo(page));
  }
  return out;
}

/** Tabule jusqu'à un élément correspondant au prédicat (sur le libellé), au plus `max` fois. */
export async function tabTo(page: Page, match: RegExp, max = 60): Promise<{ steps: number; trail: FocusInfo[] } | null> {
  const trail: FocusInfo[] = [];
  for (let i = 1; i <= max; i += 1) {
    await page.keyboard.press('Tab');
    const f = await focusInfo(page);
    trail.push(f);
    if (match.test(f.desc)) return { steps: i, trail };
  }
  return null;
}
