import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export const WIDTHS = [320, 375, 768, 1024, 1440, 1920] as const;
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export interface AxeFinding {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string; summary: string }[];
}

export async function runAxe(page: Page): Promise<AxeFinding[]> {
  const res = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return res.violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? null,
    help: v.help,
    nodes: v.nodes.slice(0, 8).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary ?? '').split('\n').slice(1, 3).join(' ').slice(0, 220) })),
  }));
}

export interface LayoutFinding {
  kind: 'overflow' | 'offscreen' | 'truncated' | 'target<24' | 'target<44' | 'text<12' | 'overlap' | 'masked-bottom';
  el: string;
  detail: string;
}

/**
 * Mesures de mise en page exécutées dans la page (voir plan §3 du rapport 03).
 * Retourne une liste dédupliquée de constats.
 */
export async function measureLayout(page: Page): Promise<{ scrollWidth: number; clientWidth: number; findings: LayoutFinding[] }> {
  return page.evaluate(async () => {
    const findings: { kind: string; el: string; detail: string }[] = [];
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const seen = new Set<string>();
    const push = (kind: string, el: Element, detail: string) => {
      const d = describe(el);
      const key = `${kind}|${d}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({ kind, el: d, detail });
    };
    function describe(el: Element): string {
      const parts: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; cur && i < 3; i += 1) {
        let s = cur.tagName.toLowerCase();
        if (cur.id) s += `#${cur.id}`;
        const role = cur.getAttribute('role');
        if (role) s += `[role=${role}]`;
        const cls = (cur.getAttribute('class') ?? '').split(/\s+/).filter((c) => c && !c.includes(':') && c.length < 24).slice(0, 2);
        if (cls.length) s += `.${cls.join('.')}`;
        parts.unshift(s);
        cur = cur.parentElement;
      }
      const name = (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? el.getAttribute('placeholder') ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50);
      return `${parts.join(' > ')}${name ? ` « ${name} »` : ''}`;
    }
    const isVisible = (el: Element) => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false; // sr-only et assimilés
      if (el.closest('[aria-hidden="true"], [inert], nextjs-portal')) return false;
      if (el.classList.contains('jb-skip') || /skip/.test(el.className.toString()) && el.tagName === 'A') return false; // liens d'évitement masqués hors écran
      return true;
    };
    // Un ancêtre qui défile ou coupe horizontalement : un débordement dedans n'est pas un débordement de page.
    const clippedByAncestor = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
      }
      return false;
    };

    const all = Array.from(document.body.querySelectorAll('*'));
    const interactiveSel =
      'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=option], [role=combobox], [role=treeitem], [tabindex]:not([tabindex="-1"])';
    const interactive = Array.from(document.querySelectorAll(interactiveSel)).filter(isVisible);

    // 1. Éléments hors écran (horizontalement).
    for (const el of all) {
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el)) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && r.left >= vw) continue; // tiroir fermé
        // On ne remonte que les « feuilles » significatives : texte direct ou élément interactif.
        const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
        if (hasText || el.matches(interactiveSel) || el.tagName === 'IMG' || el.tagName === 'svg') {
          push('offscreen', el, `left=${Math.round(r.left)} right=${Math.round(r.right)} (vw=${vw})`);
        }
      }
    }
    // 2. Texte tronqué (overflow caché + contenu plus large/haut que la boîte).
    for (const el of all) {
      if (!isVisible(el)) continue;
      const cs = getComputedStyle(el);
      const hidden = ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY);
      if (!hidden) continue;
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 2);
      if (!hasText) continue;
      const h = el as HTMLElement;
      const clampedLines = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if (h.scrollWidth > h.clientWidth + 2) push('truncated', el, `${cs.textOverflow === 'ellipsis' ? 'ellipsis' : 'coupé'} ${h.clientWidth}/${h.scrollWidth}px`);
      else if (h.scrollHeight > h.clientHeight + 3 && !clampedLines) push('truncated', el, `hauteur coupée ${h.clientHeight}/${h.scrollHeight}px`);
    }
    // 3. Cibles tactiles.
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      const tag = el.tagName;
      // Exception 2.5.8 : lien dans une phrase (texte frère dans le même bloc).
      const inline =
        tag === 'A' &&
        getComputedStyle(el).display === 'inline' &&
        Array.from(el.parentElement?.childNodes ?? []).some((n) => n !== el && n.nodeType === 3 && (n.textContent ?? '').trim().length > 1);
      if (inline) continue;
      if ((el as HTMLInputElement).type === 'checkbox' || (el as HTMLInputElement).type === 'radio') {
        // Case/radio avec libellé cliquable englobant : on mesure le label.
        const lab = el.closest('label');
        if (lab) {
          const lr = lab.getBoundingClientRect();
          if (lr.height >= 44) continue;
        }
      }
      // Zone d'impact élargie par pseudo-élément (utilitaire `.hit` : ::after de 44 px mini).
      let w = Math.round(r.width);
      let h = Math.round(r.height);
      for (const pseudo of ['::after', '::before']) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content !== 'none' && ps.position === 'absolute') {
          w = Math.max(w, Math.round(parseFloat(ps.width) || 0));
          h = Math.max(h, Math.round(parseFloat(ps.height) || 0));
        }
      }
      if (w < 24 || h < 24) push('target<24', el, `${w}×${h}px`);
      else if (w < 44 || h < 44) push('target<44', el, `${w}×${h}px`);
    }
    // 4. Texte < 12 px.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!(n.textContent ?? '').trim()) continue;
      const p = n.parentElement;
      if (!p || !isVisible(p)) continue;
      const fs = parseFloat(getComputedStyle(p).fontSize);
      if (fs < 12) push('text<12', p, `${fs}px`);
    }
    // 5. Chevauchements : une cible interactive recouverte par un autre élément (hors descendants/ancêtres).
    const docH = document.documentElement.scrollHeight;
    // Élément défilé hors de la zone visible d'un conteneur à défilement interne : pas un chevauchement.
    const hiddenInScroller = (el: Element, r: DOMRect) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowY) || ['auto', 'scroll', 'hidden', 'clip'].includes(cs.overflowX)) {
          const pr = p.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const cx = r.left + r.width / 2;
          if (cy < pr.top || cy > pr.bottom || cx < pr.left || cx > pr.right) return true;
        }
      }
      return false;
    };
    const covered = (el: Element, r: DOMRect) => {
      if (hiddenInScroller(el, r)) return null;
      const cx = r.left + Math.min(r.width / 2, Math.max(4, r.width - 4));
      const cy = r.top + r.height / 2;
      if (cx < 0 || cx > vw) return null;
      const top = document.elementFromPoint(cx, cy);
      if (!top || el.contains(top) || top.contains(el)) return null;
      if (top.closest('nextjs-portal') || top.tagName === 'NEXTJS-PORTAL') return null; // overlay du serveur de dev
      // Les libellés associés et les calques d'un même contrôle ne comptent pas.
      if (top.closest('label') && top.closest('label')?.contains(el)) return null;
      return top;
    };
    const steps = Math.max(1, Math.ceil(docH / (vh * 0.5)));
    for (let s = 0; s <= steps; s += 1) {
      const y = Math.min(s * vh * 0.5, docH - vh);
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const last = y >= docH - vh - 1;
      for (const el of interactive) {
        const r = el.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        const inMiddle = cy > vh * 0.25 && cy < vh * 0.75;
        const inBottom = last && cy >= vh * 0.75 && cy < vh;
        if (!inMiddle && !inBottom) continue;
        const top = covered(el, r);
        if (top) push(inBottom ? 'masked-bottom' : 'overlap', el, `recouvert par ${describe(top)}`);
      }
    }
    window.scrollTo(0, 0);
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, findings };
  }) as Promise<{ scrollWidth: number; clientWidth: number; findings: LayoutFinding[] }>;
}
