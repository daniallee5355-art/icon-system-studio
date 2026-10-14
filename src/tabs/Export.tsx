import { useRef, useState } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { Icon } from '../components/IconSvg';
import { FW_LABEL, LIB, LIBS, conceptById, iconKey, type Framework } from '../lib/data';
import { generate, iconMapFile, systemFile, systemRules } from '../lib/codegen';
import { copyText, downloadText } from '../lib/files';
import { SIZE_STEPS, SystemError, effectiveStroke, encodeSystem, parseSystem, staleCustom, strokeOverride, type CssBase } from '../lib/system';
import { useStore } from '../store';
import { useSetLib } from './shared';

const CSS_LABEL: Record<CssBase, string> = { tailwind: 'Tailwind', bootstrap: 'Bootstrap', material: 'Material', none: '해당 없음' };

export function Export() {
  const { sys, setSys, toast } = useStore();
  const setLib = useSetLib();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const sw = effectiveStroke(sys, sys.set);
  const blocks = generate(sys);
  const stale = staleCustom(sys);
  const customCount = Object.keys(sys.custom).length - stale.length;

  const shareUrl = () => `${location.origin}${location.pathname}#share=${encodeSystem(sys)}`;

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    setImportError('');
    try {
      const next = parseSystem(JSON.parse(await f.text()));
      setSys(() => next);
      toast(`‘${next.name}’을(를) 불러왔습니다`);
    } catch (e) {
      setImportError(e instanceof SystemError ? e.message : 'JSON 파일을 읽지 못했습니다. icon-system.json이 맞는지 확인하세요.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>디자인 시스템 코드로 내보내기</h2>
          <p>지금 고른 세트·크기·선 굵기·활성 색을 토큰과 래퍼 컴포넌트로 만듭니다. 팀원과는 icon-system.json 파일이나 공유 링크로 같은 결정을 나눕니다.</p>
        </div>
      </div>
      <div className="exp">
        <div className="exp-side">
          <div className="card pad team">
            <span className="label">팀 공유</span>
            <label className="field">
              <span>시스템 이름</span>
              <input id="sysName" value={sys.name} maxLength={80} onChange={(e) => setSys((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <div className="preview-row" aria-label="허용 세트 미리보기">
              {['home', 'search', 'bell', 'settings', 'user'].map((c) => (
                <Icon key={c} k={iconKey(conceptById[c], sys.set, 'base')} size={22} sw={strokeOverride(sys, sys.set)} />
              ))}
              <Icon k={iconKey(conceptById.heart, sys.set, 'active')} size={22} className="active-ic" />
            </div>
            <p className="tiny muted">
              {LIB[sys.set].label} · {sys.sizes.join('/')}px{sw ? ` · stroke ${sw}` : ''} · 팀 항목 {customCount}개
              {sys.updated && <> · {sys.updated} 수정</>}
            </p>
            <div className="btn-col">
              <button className="btn primary" onClick={() => { downloadText('icon-system.json', systemFile(sys)); toast('icon-system.json을 저장했습니다'); }}>icon-system.json 내려받기</button>
              <button className="btn" onClick={() => fileInput.current?.click()}>파일에서 불러오기</button>
              <button className="btn" onClick={async () => toast((await copyText(shareUrl())) ? '공유 링크를 복사했습니다. 받는 사람이 열면 적용 여부를 묻습니다.' : '복사할 수 없습니다')}>공유 링크 복사</button>
              <button className="btn" onClick={() => { downloadText('icon-map.json', iconMapFile(sys)); toast('icon-map.json을 저장했습니다'); }}>icon-map.json 내려받기</button>
            </div>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
            {importError && <p className="tiny warn-text" role="alert">{importError}</p>}
            <p className="tiny muted">팀 저장소에 icon-system.json을 함께 커밋해 두면, 누구든 이 앱에서 불러와 같은 화면과 코드를 볼 수 있습니다.</p>
          </div>

          <div className="card pad side-form">
            <div><span className="label">허용 세트</span>
              <select id="expLib" value={sys.set} onChange={(e) => setLib(e.target.value as typeof sys.set)}>
                {LIBS.map((q) => <option key={q} value={q}>{LIB[q].label} ({q})</option>)}
              </select>
            </div>
            <div><span className="label">프레임워크</span>
              <div className="chips">{(Object.keys(FW_LABEL) as Framework[]).map((k) => (
                <button key={k} className="chip" aria-pressed={sys.framework === k} onClick={() => setSys((s) => ({ ...s, framework: k }))}>{FW_LABEL[k]}</button>
              ))}</div>
            </div>
            <div><span className="label">CSS 기반</span>
              <div className="chips">{(Object.keys(CSS_LABEL) as CssBase[]).map((k) => (
                <button key={k} className="chip" aria-pressed={sys.css === k} onClick={() => setSys((s) => ({ ...s, css: k }))}>{CSS_LABEL[k]}</button>
              ))}</div>
            </div>
            <div><span className="label">크기 단계</span>
              <div className="chips">{SIZE_STEPS.map((n) => (
                <button key={n} className="chip" aria-pressed={sys.sizes.includes(n)} onClick={() => setSys((s) => {
                  const has = s.sizes.includes(n);
                  const sizes = has ? s.sizes.filter((x) => x !== n) : [...s.sizes, n].sort((a, b) => a - b);
                  return { ...s, sizes: sizes.length ? sizes : [24] };
                })}>{n}px</button>
              ))}</div>
            </div>
            <div className="row-c">
              <div><span className="label">활성 색</span>
                <div><input type="color" id="expColor" value={sys.activeColor} aria-label="활성 색" onChange={(e) => setSys((s) => ({ ...s, activeColor: e.target.value }))} /></div>
              </div>
              <div><span className="label">선 굵기</span><div className="mono">{sw ?? '해당 없음 (면 기반)'}</div></div>
            </div>
            <div><span className="label">이 시스템의 규칙</span>
              <ul className="rules">{systemRules(sys).map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
            {stale.length > 0 && (
              <p className="tiny warn-text">다른 세트에서 추가한 팀 항목 {stale.length}개({stale.join(', ')})는 내보내기에서 빠졌습니다. 전체 검색 탭에서 정리하세요.</p>
            )}
          </div>
        </div>
        <div className="codes">
          {blocks.map((b) => <CodeBlock key={b.file + b.title} {...b} downloadable />)}
          <CodeBlock title="팀 공유 파일" file="icon-system.json" code={systemFile(sys)} downloadable
            note="이 앱의 내보내기 · 공유 탭에서 ‘파일에서 불러오기’로 같은 시스템을 열 수 있습니다." />
        </div>
      </div>
    </section>
  );
}
