import { useEffect, type CSSProperties } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { DATA, conceptById } from '../lib/data';
import { useStore, type Ui } from '../store';

type AxisKey = keyof Ui['axes'];
const AXES: { k: AxisKey; tag: string; t: string; min: number; max: number; step: number; d: string }[] = [
  { k: 'fill', tag: 'FILL', t: 'Fill', min: 0, max: 1, step: 0.01, d: '0은 외곽선, 1은 면. 값 사이를 부드럽게 오갈 수 있어 활성 전환 애니메이션에 씁니다.' },
  { k: 'wght', tag: 'wght', t: 'Weight', min: 100, max: 700, step: 1, d: '획 굵기. 옆에 놓인 글자의 font-weight와 맞추면 텍스트와 무게가 어울립니다.' },
  { k: 'grad', tag: 'GRAD', t: 'Grade', min: -50, max: 200, step: 1, d: '크기를 바꾸지 않고 굵기만 미세 보정. 어두운 배경에서는 획이 번져 보이므로 -25 정도로 낮춥니다.' },
  { k: 'opsz', tag: 'opsz', t: 'Optical size', min: 20, max: 48, step: 1, d: '표시 크기에 맞춘 획·디테일 보정. 보통 실제 px 크기와 같게 둡니다.' },
  { k: 'px', tag: 'px', t: '미리보기 크기', min: 20, max: 120, step: 1, d: '' },
];
const PRESETS: [string, Partial<Ui['axes']>][] = [
  ['기본', { fill: 0, wght: 400, grad: 0, opsz: 24 }],
  ['활성 (Fill 1)', { fill: 1, wght: 400, grad: 0, opsz: 24 }],
  ['강조 (wght 600)', { fill: 0, wght: 600, grad: 0, opsz: 24 }],
  ['다크 모드 보정', { fill: 0, wght: 400, grad: -25, opsz: 24 }],
  ['작은 크기 (opsz 20)', { fill: 0, wght: 400, grad: 0, opsz: 20 }],
];

const LIGATURES = [...new Set(DATA.concepts.map((c) => c.v['material-symbols'].ligature!))].sort();

/** Material Symbols 가변 폰트를 이 앱에서 쓰는 이름만 담아 한 번 불러온다 */
function useSymbolsFont() {
  useEffect(() => {
    if (document.getElementById('ms-font')) return;
    const l = document.createElement('link');
    l.id = 'ms-font';
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${LIGATURES.join(',')}&display=block`;
    document.head.appendChild(l);
  }, []);
}

export function VariableFont() {
  useSymbolsFont();
  const { ui, setUi } = useStore();
  const a = ui.axes;
  const lig = (conceptById[ui.vfIcon] ?? conceptById.home).v['material-symbols'].ligature!;
  const vars = { '--fill': a.fill, '--wght': a.wght, '--grad': a.grad, '--opsz': a.opsz } as CSSProperties;
  const settings = (fill: number) => `'FILL' ${fill}, 'wght' ${a.wght}, 'GRAD' ${a.grad}, 'opsz' ${a.opsz}`;
  const css = [
    '/* <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" /> */',
    '.material-symbols-outlined {',
    `  font-size: ${a.opsz}px;`,
    `  font-variation-settings: ${settings(a.fill)};`,
    '  transition: font-variation-settings .2s ease;',
    '}',
    '/* 활성 상태: 외곽선 → 면 */',
    `.is-active > .material-symbols-outlined { font-variation-settings: ${settings(1)}; }`,
    '/* 어두운 배경 보정 */',
    `@media (prefers-color-scheme: dark) { .material-symbols-outlined { font-variation-settings: 'FILL' ${a.fill}, 'wght' ${a.wght}, 'GRAD' -25, 'opsz' ${a.opsz}; } }`,
    '',
    `<!-- 사용: <span class="material-symbols-outlined">${lig}</span> -->`,
  ].join('\n');

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>Material Symbols 가변 폰트 4축</h2>
          <p>폰트 하나로 Fill·Weight·Grade·Optical size를 CSS에서 바꿉니다. 아래 격자의 아이콘에 마우스를 올리면 FILL 0→1 전환을 애니메이션으로 볼 수 있습니다.</p>
        </div>
        <div className="chips">
          {PRESETS.map(([t, v]) => <button key={t} className="chip" onClick={() => setUi((u) => ({ axes: { ...u.axes, ...v } }))}>{t}</button>)}
        </div>
      </div>
      <div className="vf">
        <div className="card pad axes">
          {AXES.map((x) => (
            <div className="axis" key={x.k}>
              <label htmlFor={`ax-${x.k}`}>{x.t}<span className="mono">{x.tag} {x.min}~{x.max}</span></label>
              <output>{a[x.k]}</output>
              <input type="range" id={`ax-${x.k}`} min={x.min} max={x.max} step={x.step} value={a[x.k]}
                onChange={(e) => setUi((u) => ({ axes: { ...u.axes, [x.k]: +e.target.value } }))} />
              {x.d && <p>{x.d}</p>}
            </div>
          ))}
        </div>
        <div className="minw0">
          <div className="vf-hero" style={vars}>
            <div className="lt"><span className="ms" style={{ fontSize: a.px }}>{lig}</span><span className="cap">밝은 배경 · GRAD {a.grad}</span></div>
            <div className="dk"><span className="ms" style={{ fontSize: a.px }}>{lig}</span>
              <span className="cap">어두운 배경 · GRAD {a.grad}{a.grad >= 0 ? ' (번져 보이면 -25 권장)' : ''}</span></div>
          </div>
          <div className="card pad" style={{ marginTop: 16 }}>
            <div className="vf-grid" style={vars}>
              {DATA.concepts.map((c) => {
                const l = c.v['material-symbols'].ligature!;
                return (
                  <button key={c.id} aria-pressed={c.id === ui.vfIcon} title={l} onClick={() => setUi({ vfIcon: c.id })}>
                    <span className="ms" style={{ fontSize: 32 }}>{l}</span><small>{l}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 16 }}><CodeBlock title="CSS" file="현재 축 값 그대로" code={css} /></div>
        </div>
      </div>
    </section>
  );
}
