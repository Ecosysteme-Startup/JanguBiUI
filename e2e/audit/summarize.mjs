// Agrège les résultats JSON de 10-ecrans.spec.ts : node e2e/audit/summarize.mjs [--detail id]
import { readdirSync, readFileSync } from 'node:fs';

const OUT =
  process.env.AUDIT_OUT ?? '/tmp/claude-1000/-home-sosza-PycharmProjects-Numerisen/15b0994d-7ed2-4a0a-9ec6-96e5f7bf90f7/scratchpad/audit03';
const dir = `${OUT}/results`;
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const detail = process.argv.indexOf('--detail') > -1 ? process.argv[process.argv.indexOf('--detail') + 1] : null;

const axeGlobal = new Map(); // id -> {help, screens:Set, variants:Set}
for (const f of files) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const id = r.screen.id;
  if (detail && id !== detail) continue;
  const overflow = Object.entries(r.layout).filter(([, v]) => v.overflow).map(([w, v]) => `${w}(${v.scrollWidth})`);
  const counts = {};
  for (const [w, v] of Object.entries(r.layout)) for (const x of v.findings) counts[x.kind] = (counts[x.kind] ?? 0) + 1;
  const axeIds = {};
  for (const [variant, list] of Object.entries(r.axe))
    for (const v of list) {
      (axeIds[v.id] ??= []).push(`${variant}:${v.nodes.length}`);
      const g = axeGlobal.get(v.id) ?? { help: v.help, impact: v.impact, screens: new Set(), variants: new Set() };
      g.screens.add(id);
      g.variants.add(variant);
      axeGlobal.set(v.id, g);
    }
  console.log(`\n## ${id} → ${r.finalUrl.replace('http://localhost:3000', '')} | h1=${(r.h1 ?? '').trim().slice(0, 50)}`);
  if (r.apiErrors.length) console.log(`  API: ${r.apiErrors.join(' ; ')}`);
  console.log(`  overflow: ${overflow.join(', ') || '—'} | ${JSON.stringify(counts)}`);
  console.log(`  axe: ${Object.entries(axeIds).map(([k, v]) => `${k} [${v.join(' ')}]`).join(' ; ') || '—'}`);
  if (detail) {
    for (const [variant, list] of Object.entries(r.axe))
      for (const v of list) {
        console.log(`   · ${variant} ${v.id} (${v.impact}) ${v.help}`);
        for (const n of v.nodes) console.log(`       ${n.target} :: ${n.summary}`);
      }
    for (const [w, v] of Object.entries(r.layout)) for (const x of v.findings) console.log(`   · ${w} ${x.kind} ${x.el} :: ${x.detail}`);
  }
}
if (!detail) {
  console.log('\n# axe global');
  for (const [k, g] of axeGlobal) console.log(`- ${k} (${g.impact}) ${g.help} — ${g.screens.size} écrans [${[...g.variants].join(',')}]: ${[...g.screens].join(', ')}`);
}
