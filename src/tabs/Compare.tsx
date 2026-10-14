import { useMemo, useState } from 'react';
import { Icon } from '../components/IconSvg';
import { COVER, DATA, LIB, LIBS, OBJECTS, STROKE_LIBS, conceptById, iconKey, type Concept, type Prefix } from '../lib/data';
import { copyText } from '../lib/files';
import { effectiveStroke, strokeOverride } from '../lib/system';
import { useStore } from '../store';
import { KeylineGrid, useSetLib } from './shared';

const VN: Record<string, string> = { base: '기본', active: '활성', mini: 'Mini 20', micro: 'Micro 16', thin: 'Thin', light: 'Light', bold: 'Bold', duotone: 'Duotone' };

export function Compare() {
  const { ui, setUi, sys, setSys } = useStore();
  const setLib = useSetLib();
  const q = ui.q.trim().toLowerCase();
  const list = useMemo(() => DATA.concepts.filter((c) => !q || c.ko.includes(q) || c.id.includes(q) ||
    LIBS.some((p) => c.v[p].base.includes(q))), [q]);

  const strokeLib = STROKE_LIBS.has(sys.set) ? sys.set : 'lucide';
  const custom = sys.stroke != null;

  const row = (c: Concept) => (
    <tr key={c.id}>
      <th className="rowh" scope="row"><span className="k">{c.ko}</span><span className="e">{c.id}</span></th>
      {LIBS.map((p) => {
        const noFill = ui.mode === 'active' && !c.v[p].active && c.kind === 'object';
        const picked = ui.pick.c === c.id && ui.pick.p === p;
        return (
          <td key={p} className={p === sys.set ? 'sel' : ''}>
            <button className={`cell${picked ? ' picked' : ''}`} aria-label={`${LIB[p].label} ${c.ko}`}
              onClick={() => setUi({ pick: { c: c.id, p } })}>
              <Icon k={iconKey(c, p, ui.mode)} size={ui.size} sw={strokeOverride(sys, p)} />
              {noFill && <i className="nf" title="Fill 변형 없음" />}
            </button>
          </td>
        );
      })}
    </tr>
  );
  const group = (kind: Concept['kind'], title: string) => {
    const rows = list.filter((c) => c.kind === kind);
    if (!rows.length) return null;
    return [<tr className="grp" key={kind}><th colSpan={LIBS.length + 1}>{title}</th></tr>, ...rows.map(row)];
  };

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>같은 의미, 9가지 그림</h2>
          <p>행은 UI에서 자주 쓰는 {DATA.concepts.length}개 의미, 열은 라이브러리입니다. 열 머리를 누르면 그 세트가 허용 세트가 되고, 칸을 누르면 오른쪽에서 24px 키라인 위에 확대해 봅니다.</p>
        </div>
      </div>
      <div className="cmp">
        <div className="minw0">
          <div className="card toolbar">
            <div className="ctl"><span className="label">크기</span>
              <div className="seg">{[16, 20, 24, 32].map((n) => <button key={n} aria-pressed={ui.size === n} onClick={() => setUi({ size: n })}>{n}</button>)}</div>
            </div>
            <div className="ctl"><span className="label">상태</span>
              <div className="seg">{([['base', '기본'], ['active', '활성']] as const).map(([v, t]) =>
                <button key={v} aria-pressed={ui.mode === v} onClick={() => setUi({ mode: v })}>{t}</button>)}</div>
            </div>
            <div className="ctl">
              <span className="label">선 굵기 <span className="mono">{custom ? sys.stroke!.toFixed(2) : '세트 기본값'}</span></span>
              <div className="row-c">
                <input type="range" id="sw" min={1} max={2.5} step={0.25} aria-label="선 굵기" disabled={!custom}
                  value={sys.stroke ?? LIB[strokeLib].stroke ?? 2}
                  onChange={(e) => setSys((s) => ({ ...s, stroke: +e.target.value }))} />
                <label className="check"><input type="checkbox" id="swDefault" checked={!custom}
                  onChange={(e) => setSys((s) => ({ ...s, stroke: e.target.checked ? null : (LIB[strokeLib].stroke ?? 2) }))} /> 세트 기본값</label>
              </div>
            </div>
            <div className="ctl"><label className="label" htmlFor="q">찾기</label>
              <input type="search" id="q" placeholder="예: 알림, share" value={ui.q} onChange={(e) => setUi({ q: e.target.value })} />
            </div>
          </div>
          <div className="card matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="rowh"><span className="label">의미</span></th>
                  {LIBS.map((p) => (
                    <th key={p} className={p === sys.set ? 'sel' : ''} scope="col">
                      <button onClick={() => setLib(p)} title={`${LIB[p].label}을(를) 허용 세트로 지정`}>
                        <span className="ln">{LIB[p].label}</span>
                        <span className="ls">Fill {COVER[p]}/{OBJECTS.length}{STROKE_LIBS.has(p) ? ' · 선' : ''}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group('object', '사물 · 내비게이션 (상태 전환 대상)')}
                {group('action', '동작')}
                {!list.length && (
                  <tr><td colSpan={LIBS.length + 1} className="muted" style={{ padding: 24 }}>
                    “{ui.q}”에 맞는 의미가 없습니다. 한글 의미나 영문 이름으로 찾거나, 전체 검색 탭에서 세트 전체를 찾아보세요.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span><i className="dot" />활성 상태에 Fill 변형이 없어 기본형을 그대로 씀</span>
            <span>선 굵기는 선(stroke)으로 그린 Lucide · Heroicons Outline · Tabler · Iconoir에만 적용됩니다</span>
          </div>
        </div>
        <Inspector key={`${ui.pick.c}:${ui.pick.p}:${ui.mode}`} />
      </div>
    </section>
  );
}

function Inspector() {
  const { ui, sys, toast } = useStore();
  const c = conceptById[ui.pick.c] ?? DATA.concepts[0];
  const p: Prefix = ui.pick.p;
  const [key, setKey] = useState(() => iconKey(c, p, ui.mode));
  const data = DATA.icons[key];
  if (!data) return null;
  const [w, h] = data;
  const v = c.v[p];
  const variants = Object.entries(v).filter(([k, n]) => n && k !== 'ligature') as [string, string][];
  const sw = strokeOverride(sys, p);
  const eff = effectiveStroke(sys, p);
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="24" height="24">${data[2]}</svg>`;

  return (
    <aside className="card pad insp">
      <div className="stage"><KeylineGrid w={w} /><Icon k={key} size="80%" sw={sw} /></div>
      <div className="insp-body">
        <div><span className="label">{LIB[p].label} · {c.ko}</span><h3>{key}</h3></div>
        <div className="sizes" aria-label="실제 크기">
          {[16, 20, 24, 32].map((n) => <figure key={n}><Icon k={key} size={n} sw={sw} /><figcaption>{n}</figcaption></figure>)}
        </div>
        <dl className="kv">
          <dt>viewBox</dt><dd>0 0 {w} {h}</dd>
          <dt>그리기</dt><dd>{eff ? `stroke ${eff}` : 'fill (면)'}</dd>
          <dt>라이선스</dt><dd>{DATA.sets[p].license}</dd>
        </dl>
        <div>
          <span className="label">이 아이콘의 변형</span>
          <div className="vchips">
            {variants.map(([k, n]) => (
              <button key={k} className="chip" aria-pressed={key === `${p}:${n}`} title={`${p}:${n}`} onClick={() => setKey(`${p}:${n}`)}>{VN[k] || k}</button>
            ))}
            {!v.active && c.kind === 'object' && <span className="pill warn">Fill 없음</span>}
          </div>
        </div>
        <div className="btns">
          <button className="btn" onClick={async () => toast((await copyText(key)) ? '이름을 복사했습니다' : '복사할 수 없습니다')}>이름 복사</button>
          <button className="btn" onClick={async () => toast((await copyText(svgText)) ? 'SVG를 복사했습니다' : '복사할 수 없습니다')}>SVG 복사</button>
        </div>
        <p className="tiny muted">분홍 선은 24px 기준 키라인입니다. 점선 사각형이 2px 여백 안쪽, 원과 실선 사각형이 기본 형태가 차지하는 영역입니다.</p>
      </div>
    </aside>
  );
}
