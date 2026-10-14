import { Icon } from '../components/IconSvg';
import { COVER, DATA, LIB, LIBS, OBJECTS, STROKE_LIBS, conceptById, fmt, iconKey, type Prefix } from '../lib/data';
import { QUIZ, recommend, type Quiz } from '../lib/recommend';
import { useStore } from '../store';
import { useSetLib } from './shared';

const SAMPLE = ['home', 'bell', 'heart', 'settings', 'chart'];

export function Recommend() {
  const { ui, setUi, sys } = useStore();
  const setLib = useSetLib();
  const results = recommend(ui.quiz);
  const max = Math.max(...results.map((r) => r.s), 1);

  const choose = (p: Prefix) => setLib(p, { framework: ui.quiz.fw, css: ui.quiz.css });

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>프로젝트에 맞는 아이콘 세트 고르기</h2>
          <p>조건을 고르면 9개 라이브러리에 점수를 매깁니다. Fill 대응률과 고유 아이콘 수는 실제 아이콘 데이터에서 계산한 값입니다.</p>
        </div>
      </div>
      <div className="rec">
        <form className="card pad" onSubmit={(e) => e.preventDefault()}>
          {QUIZ.map((q) => (
            <div className="q" key={q.k}>
              <h3>{q.t}</h3>
              <div className="chips">
                {q.o.map(([v, t]) => (
                  <button type="button" key={v} className="chip" aria-pressed={ui.quiz[q.k] === v}
                    onClick={() => setUi((u) => ({ quiz: { ...u.quiz, [q.k]: v } as Quiz }))}>{t}</button>
                ))}
              </div>
            </div>
          ))}
        </form>
        <div className="results">
          {ui.quiz.product === 'ai' && (
            <div className="meta-note">
              <div className="ic"><Icon k="ph:star-fill" size={24} /></div>
              <div>
                <b>Iconify를 메타 코어로 두세요.</b>{' '}
                <span className="muted">여러 세트를 하나의 <code>prefix:name</code> 규칙으로 부를 수 있어 키워드→아이콘 매핑에 유리합니다. 다만 여러 세트가 한 화면에 섞이지 않도록 아래 1순위 세트를 허용 세트로 고정하고, 내보내기 탭의 icon-map.json을 모델에 넘기는 방식을 권합니다.</span>
              </div>
            </div>
          )}
          {results.map((r, i) => (
            <article key={r.p} className={`card res${i === 0 && !r.out ? ' top1' : ''}${r.out ? ' out' : ''}`}>
              <div className="rank">{r.out ? '—' : String(i + 1).padStart(2, '0')}</div>
              <div className="minw0">
                <h3>
                  {LIB[r.p].label} <span className="pill no">{DATA.sets[r.p].license}</span>
                  {r.p === sys.set && <span className="pill ok">현재 시스템</span>}
                </h3>
                <div className="res-icons">{SAMPLE.map((c) => <Icon key={c} k={iconKey(conceptById[c], r.p, 'base')} size={22} />)}</div>
                <ul>
                  {r.why.map((w) => <li key={w}>{w}</li>)}
                  {r.minus.map((w) => <li key={w} className="minus">{w}</li>)}
                </ul>
              </div>
              <div className="score">
                <b>{r.out ? '제외' : r.s}</b>
                {!r.out && <div className="bar"><i style={{ width: `${Math.max(4, (r.s / max) * 100)}%` }} /></div>}
                {!r.out && r.p !== sys.set && (
                  <button className={`btn${i === 0 ? ' primary' : ''}`} style={{ marginTop: 12 }} onClick={() => choose(r.p)}>이 세트로 지정</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="spec">
        <h2>라이브러리 사양</h2>
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          “변형 포함”은 패키지에 든 전체 아이콘 수, “고유 형태”는 Solid·Fill·굵기 같은 스타일 변형을 하나로 묶은 수입니다. 원 보고서의 수치는 대부분 변형 포함 기준이었습니다.
        </p>
        <div className="card scroll-x">
          <table>
            <thead>
              <tr>
                <th>라이브러리</th><th className="num">변형 포함</th><th className="num">고유 형태</th><th className="num">보고서 표기</th>
                <th>스타일</th><th>viewBox · 그리기</th><th className="num">Fill 대응</th><th>라이선스</th>
              </tr>
            </thead>
            <tbody>
              {LIBS.map((p) => {
                const s = DATA.sets[p], L = LIB[p];
                const home = DATA.icons[iconKey(conceptById.home, p, 'base')];
                return (
                  <tr key={p}>
                    <td><b>{L.label}</b><div className="tiny muted mono">{p}{s.version ? ` v${s.version}` : ''}</div></td>
                    <td className="num">{fmt(s.total)}</td>
                    <td className="num">{fmt(s.unique)}</td>
                    <td className="num">{L.report}{s.total !== s.unique && <span className="delta">변형 포함 기준</span>}</td>
                    <td>{L.style}</td>
                    <td className="mono tiny">{home[0]}×{home[1]} · {STROKE_LIBS.has(p) ? `${L.stroke}px 선` : '면(fill) 기반'}</td>
                    <td className="num">{COVER[p]}/{OBJECTS.length}</td>
                    <td>{s.license}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
