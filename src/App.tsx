import { useEffect, useState, type ComponentType } from 'react';
import { Icon } from './components/IconSvg';
import { DATA, LIB, LIBS, conceptById, fmt, iconKey } from './lib/data';
import { SystemError, decodeSystem, effectiveStroke, type IconSystem } from './lib/system';
import { TABS, isTab, useStore, type Tab } from './store';
import { Compare } from './tabs/Compare';
import { Export } from './tabs/Export';
import { Licenses } from './tabs/Licenses';
import { Recommend } from './tabs/Recommend';
import { Search } from './tabs/Search';
import { States } from './tabs/States';
import { VariableFont } from './tabs/VariableFont';

// public/manual.pdf (scripts/build-manual.ps1로 다시 만든다)
const MANUAL_URL = `${import.meta.env.BASE_URL}manual.pdf`;

const PANELS: Record<Tab, ComponentType> = {
  recommend: Recommend, compare: Compare, states: States, variable: VariableFont, search: Search, export: Export, licenses: Licenses,
};

export function App() {
  const { ui, setUi, sys, setSys, toast, toastMsg } = useStore();
  const [incoming, setIncoming] = useState<IconSystem | null>(null);
  const [linkError, setLinkError] = useState('');

  // 주소의 #탭 또는 #share=… 처리
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1);
      if (h.startsWith('share=')) {
        try { setIncoming(decodeSystem(h.slice(6))); setLinkError(''); }
        catch (e) { setLinkError(e instanceof SystemError ? e.message : '공유 링크를 읽지 못했습니다.'); }
        setUi({ tab: 'export' });
      } else if (isTab(h)) setUi({ tab: h });
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [setUi]);

  useEffect(() => {
    if (!location.hash.startsWith('#share=') && location.hash.slice(1) !== ui.tab) history.replaceState(null, '', `#${ui.tab}`);
  }, [ui.tab]);

  const clearShare = () => { setIncoming(null); setLinkError(''); history.replaceState(null, '', `#${ui.tab}`); };
  const applyShare = () => {
    if (!incoming) return;
    setSys(() => incoming);
    toast(`‘${incoming.name}’을(를) 적용했습니다`);
    clearShare();
  };

  const Panel = PANELS[ui.tab];
  const sw = effectiveStroke(sys, sys.set);

  return (
    <div className="wrap">
      <header className="top">
        <div className="top-row">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 34 34" aria-hidden="true">
              <rect x="1" y="1" width="32" height="32" rx="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 1v32M29 1v32M1 5h32M1 29h32" stroke="currentColor" strokeWidth=".75" opacity=".45" />
              <circle cx="17" cy="17" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="8" width="18" height="18" fill="none" stroke="currentColor" strokeWidth=".75" opacity=".6" />
            </svg>
            <div>
              <h1>Icon System Studio</h1>
              <p>{LIBS.length}개 라이브러리 · {DATA.concepts.length}개 의미 · 아이콘 {fmt(Object.keys(DATA.icons).length)}개 실측</p>
            </div>
          </div>
          <div className="top-actions">
            <a className="manual-link" href={MANUAL_URL} target="_blank" rel="noreferrer" title="사용설명서 PDF를 새 탭에서 엽니다">
              <Icon k="lucide:file-text" size={16} />사용설명서
            </a>
            <button className="sys-chip" onClick={() => setUi({ tab: 'export' })} title="내보내기 · 공유 탭으로 이동">
              <span className="ic"><Icon k={iconKey(conceptById.settings, sys.set, 'base')} size={16} /></span>
              <span className="sys-name">{sys.name}</span>
              <span className="mono">{LIB[sys.set].label} · {ui.size}px{sw ? ` · stroke ${sw}` : ''}</span>
            </button>
          </div>
        </div>
        <nav className="tabs" role="tablist" aria-label="작업 단계">
          {TABS.map((t) => (
            <button key={t.id} className="tab" role="tab" aria-selected={ui.tab === t.id} onClick={() => setUi({ tab: t.id })}>
              {t.n && <span className="n">{t.n}</span>}{t.t}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {(incoming || linkError) && (
          <div className={`banner${linkError ? ' bad' : ''}`} role="status">
            {incoming ? (
              <>
                <div className="minw0">
                  <b>공유된 아이콘 시스템 ‘{incoming.name}’</b>
                  <span className="muted"> · {LIB[incoming.set].label} · {incoming.sizes.join('/')}px · 팀 항목 {Object.keys(incoming.custom).length}개{incoming.updated && ` · ${incoming.updated} 수정`}</span>
                  <p className="tiny muted">적용하면 이 브라우저에 저장된 지금의 시스템(‘{sys.name}’)을 바꿉니다. 필요하면 먼저 icon-system.json으로 내려받아 두세요.</p>
                </div>
                <div className="btns"><button className="btn primary" onClick={applyShare}>적용</button><button className="btn" onClick={clearShare}>무시</button></div>
              </>
            ) : (
              <>
                <div className="minw0"><b>공유 링크를 열지 못했습니다.</b> <span className="muted">{linkError}</span></div>
                <div className="btns"><button className="btn" onClick={clearShare}>닫기</button></div>
              </>
            )}
          </div>
        )}
        <Panel />
        <footer>
          <span>데이터: @iconify-json 패키지, {DATA.generated} 빌드</span>
          <a className="linkish" href={MANUAL_URL} target="_blank" rel="noreferrer">사용설명서 (PDF)</a>
          <button className="linkish" onClick={() => setUi({ tab: 'licenses' })}>아이콘 라이선스</button>
        </footer>
      </main>
      <div className={`toast${toastMsg ? ' on' : ''}`} role="status" aria-live="polite">{toastMsg}</div>
    </div>
  );
}
