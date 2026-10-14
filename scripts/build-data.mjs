// 아이콘 데이터 빌드
// node_modules/@iconify-json/<prefix>의 실제 아이콘 데이터와 data/concepts.json(의미 사전)을 합쳐
//   src/generated/core.json   앱에 번들되는 데이터 (세트 정보 + 의미별 변형 + 해당 SVG)
//   public/sets/<prefix>.json 전체 검색용 세트 데이터 (필요할 때만 내려받음)
// 를 만든다. 의미 사전의 이름이 세트에 없으면 비슷한 이름을 제안하고 실패로 끝난다.
//
// 실행: npm run data   (세트를 최신으로: npm update 후 다시 실행)
//       --if-missing 을 붙이면 결과물이 이미 있을 때 건너뛴다 (dev/test 시작 시 사용)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREFIXES, STEM, variants } from '../src/lib/naming.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJSON = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v)); };

const corePath = path.join(root, 'src', 'generated', 'core.json');
if (process.argv.includes('--if-missing') && fs.existsSync(corePath) &&
    PREFIXES.every((p) => fs.existsSync(path.join(root, 'public', 'sets', `${p}.json`)))) {
  process.exit(0);
}

const sets = {}, raw = {}, lookups = {};
for (const p of PREFIXES) {
  const dir = path.join(root, 'node_modules', '@iconify-json', p);
  if (!fs.existsSync(dir)) throw new Error(`@iconify-json/${p}가 없습니다. npm install을 먼저 실행하세요.`);
  const info = readJSON(path.join(dir, 'info.json'));
  const j = readJSON(path.join(dir, 'icons.json'));
  const pkg = readJSON(path.join(dir, 'package.json'));
  raw[p] = j;
  const visible = Object.entries(j.icons).filter(([, i]) => !i.hidden).map(([n]) => n);
  const all = new Set([...Object.keys(j.icons), ...Object.keys(j.aliases || {})]);
  lookups[p] = { visible, all };
  sets[p] = {
    name: info.name, version: info.version || null, pkgVersion: pkg.version,
    total: visible.length, unique: new Set(visible.map(STEM[p])).size,
    license: info.license?.title, spdx: info.license?.spdx, licenseUrl: info.license?.url,
    author: info.author?.name, authorUrl: info.author?.url, height: info.height,
    width: j.width || 16,
  };
}

function resolver(p) {
  const j = raw[p], W = j.width || 16, H = j.height || 16;
  const resolve = (n) => {
    if (j.icons[n]) return { ...j.icons[n] };
    const a = j.aliases?.[n];
    if (a) { const { parent, ...rest } = a; const r = resolve(parent); return r && { ...r, ...rest }; }
    return null;
  };
  return (n) => { const ic = resolve(n); return ic && [ic.width || W, ic.height || H, ic.body]; };
}

// ---- 의미 사전 검증 ----
const concepts = readJSON(path.join(root, 'data', 'concepts.json'));
const ids = new Set();
const problems = [];
const need = Object.fromEntries(PREFIXES.map((p) => [p, new Set()]));
const out = concepts.map((c) => {
  if (ids.has(c.id)) problems.push(`중복 id: ${c.id}`);
  ids.add(c.id);
  if (!['object', 'action'].includes(c.kind)) problems.push(`${c.id}: kind는 object 또는 action이어야 합니다`);
  const v = {};
  for (const p of PREFIXES) {
    const b = c.names?.[p];
    const has = (n) => lookups[p].all.has(n);
    const entry = variants(p, b, has);
    if (!b || !entry.base) {
      const word = (b || c.id).split('-')[0];
      const sug = lookups[p].visible.filter((n) => n.includes(word)).slice(0, 8);
      problems.push(`${c.id} → ${p}:${b} 없음. 후보: ${sug.join(', ') || '(없음)'}`);
      continue;
    }
    for (const [k, n] of Object.entries(entry)) if (n && k !== 'ligature') need[p].add(n);
    v[p] = entry;
  }
  return { id: c.id, ko: c.ko, kind: c.kind, v };
});
if (problems.length) {
  console.error('의미 사전 오류:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ---- 출력 ----
const icons = {};
for (const p of PREFIXES) {
  const get = resolver(p);
  for (const n of need[p]) icons[`${p}:${n}`] = get(n);
}
const generated = new Date().toISOString().slice(0, 10);
writeJSON(corePath, { generated, sets, concepts: out, icons });

for (const p of PREFIXES) {
  const get = resolver(p);
  const list = {};
  for (const n of lookups[p].visible) {
    const [w, h, body] = get(n);
    list[n] = w === sets[p].width && h === (raw[p].height || 16) ? body : [w, h, body];
  }
  writeJSON(path.join(root, 'public', 'sets', `${p}.json`), { prefix: p, width: raw[p].width || 16, height: raw[p].height || 16, icons: list });
}

console.log(`의미 ${out.length}개, 번들 아이콘 ${Object.keys(icons).length}개 → src/generated/core.json`);
for (const p of PREFIXES) {
  const cov = out.filter((c) => c.kind === 'object' && c.v[p].active).length;
  const objs = out.filter((c) => c.kind === 'object').length;
  console.log(`  ${p.padEnd(17)} 전체 ${String(sets[p].total).padStart(6)}  고유 ${String(sets[p].unique).padStart(5)}  Fill ${cov}/${objs}  ${sets[p].license}`);
}
