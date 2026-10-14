import { Icon } from '../components/IconSvg';
import { COVER, DATA, LIB, LIBS, OBJECTS, conceptById, iconKey } from '../lib/data';
import { strokeOverride } from '../lib/system';
import { useStore } from '../store';
import { useSetLib } from './shared';

const NAV = [['dashboard', '대시보드'], ['chart', '리포트'], ['folder', '프로젝트'], ['inbox', '받은편지함'], ['calendar', '일정'], ['settings', '설정']];
const BAR = [['home', '홈'], ['search', '검색'], ['heart', '찜'], ['user', '내 정보']];
const TG = [['heart', '좋아요'], ['bookmark', '저장'], ['star', '즐겨찾기'], ['bell', '알림 받기']];

export function States() {
  const { ui, setUi, sys } = useStore();
  const setLib = useSetLib();
  const p = sys.set;
  const sw = strokeOverride(sys, p);
  const ic = (id: string, on: boolean, px = 20) => <Icon k={iconKey(conceptById[id], p, on ? 'active' : 'base')} size={px} sw={on ? null : sw} />;

  const foot = (ids: string[]) => {
    const m = ids.filter((id) => !conceptById[id].v[p].active);
    return m.length === 0
      ? <span className="pill ok">모든 항목이 Fill로 전환</span>
      : <><span className="pill warn">{m.length}/{ids.length}개는 Fill 없음</span> <span>{m.map((id) => conceptById[id].ko).join(', ')}: 색과 배경으로만 구분됩니다.</span></>;
  };

  const c = conceptById[ui.variant] ?? conceptById.home;
  const v = c.v[p];
  const order: [keyof typeof v, string, number?][] =
    p === 'heroicons' ? [['base', 'Outline', 24], ['active', 'Solid', 24], ['mini', 'Mini', 20], ['micro', 'Micro', 16]]
    : p === 'ph' ? [['thin', 'Thin'], ['light', 'Light'], ['base', 'Regular'], ['bold', 'Bold'], ['active', 'Fill'], ['duotone', 'Duotone']]
    : [['base', p === 'ri' ? 'Line' : '기본'], ['active', p === 'ri' ? 'Fill' : '활성(Fill)']];
  const note = ({
    heroicons: '크기마다 따로 그린 버전입니다. 20·16px은 축소가 아니라 다시 그린 형태라 작아도 뭉개지지 않습니다.',
    ph: '같은 형태를 6가지 굵기로 그렸습니다. 비활성 Light, 기본 Regular, 강조 Bold, 선택 Fill 식으로 나눠 쓸 수 있습니다.',
    'material-symbols': '아이콘 파일은 Outlined/Filled 두 가지이고, 굵기·Grade는 가변 폰트 탭에서 조절합니다.',
  } as Record<string, string>)[p] ?? `${LIB[p].label}은(는) 기본형과 ${v.active ? 'Fill 변형을 함께' : 'Fill 변형 없이 기본형만'} 제공합니다.`;

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>상태가 바뀔 때 어떻게 보이나</h2>
          <p>사이드바, 하단 탭바, 토글 버튼을 직접 눌러 보세요. 활성 상태에서 Fill 변형으로 바뀌는 세트와 색만 바뀌는 세트의 차이가 바로 보입니다.</p>
        </div>
      </div>
      <div className="chips lib-pick">
        {LIBS.map((q) => <button key={q} className="chip" aria-pressed={q === p} onClick={() => setLib(q)}>{LIB[q].label}</button>)}
      </div>

      <div className="mocks">
        <div className="card mock">
          <h3>사이드바 내비게이션 <span className="tiny muted">항목을 눌러 보세요</span></h3>
          <nav className="nav">
            {NAV.map(([id, t]) => (
              <button key={id} aria-current={ui.nav === id ? 'page' : undefined} onClick={() => setUi({ nav: id })}>{ic(id, ui.nav === id)}{t}</button>
            ))}
          </nav>
          <div className="foot">{foot(NAV.map((x) => x[0]))}</div>
        </div>
        <div className="card mock phone">
          <h3>모바일 하단 탭바</h3>
          <div className="feed"><i style={{ width: '70%' }} /><i /><i style={{ width: '85%' }} /><i style={{ width: '55%' }} /><i /></div>
          <div className="tabbar">
            {BAR.map(([id, t]) => (
              <button key={id} aria-current={ui.bar === id ? 'page' : undefined} onClick={() => setUi({ bar: id })}>{ic(id, ui.bar === id, 24)}{t}</button>
            ))}
          </div>
          <div className="foot">{foot(BAR.map((x) => x[0]))}</div>
        </div>
        <div className="card mock">
          <h3>토글 버튼</h3>
          <div className="toggles">
            {TG.map(([id, t]) => (
              <button key={id} className="tgl" aria-pressed={!!ui.toggles[id]}
                onClick={() => setUi((u) => ({ toggles: { ...u.toggles, [id]: !u.toggles[id] } }))}>{ic(id, !!ui.toggles[id])}{t}</button>
            ))}
          </div>
          <div className="foot">{foot(TG.map((x) => x[0]))}</div>
        </div>
      </div>

      <div className="two">
        <div className="card pad">
          <div className="strip-head">
            <div><h3>이 세트의 변형</h3><p className="muted tiny">{note}</p></div>
            <select aria-label="아이콘 선택" value={c.id} onChange={(e) => setUi({ variant: e.target.value })}>
              {DATA.concepts.map((x) => <option key={x.id} value={x.id}>{x.ko} ({x.id})</option>)}
            </select>
          </div>
          <div className="strip">
            {order.map(([k, t, px]) => {
              const n = v[k] as string | null | undefined;
              if (!n) return (
                <figure key={String(k)} className="none"><div className="muted tiny">없음</div><figcaption>{t}</figcaption></figure>
              );
              return (
                <figure key={String(k)}>
                  <Icon k={`${p}:${n}`} size={40} />
                  <Icon k={`${p}:${n}`} size={px || 24} />
                  <figcaption>{t}<span className="mono">{n}{px ? ` · ${px}px` : ''}</span></figcaption>
                </figure>
              );
            })}
          </div>
        </div>
        <div className="card pad">
          <h3>Fill 대응률</h3>
          <p className="muted tiny" style={{ marginBottom: 14 }}>사물 아이콘 {OBJECTS.length}개(홈·알림·폴더 등) 중 활성용 Fill 변형이 있는 수. 더하기·닫기 같은 동작 아이콘은 뺐습니다.</p>
          <div className="cov">
            {[...LIBS].sort((a, b) => COVER[b] - COVER[a]).map((q) => (
              <button key={q} className={`cov-row${q === p ? ' on' : ''}`} onClick={() => setLib(q)}>
                <span>{LIB[q].label}</span>
                <span className="track"><i style={{ width: `${(COVER[q] / OBJECTS.length) * 100}%` }} /></span>
                <span className="v">{COVER[q]}/{OBJECTS.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
