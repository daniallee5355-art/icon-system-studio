import { useEffect, useMemo, useState } from 'react';
import { IconSvg } from '../components/IconSvg';
import { DATA, LIB, LIBS, conceptById, fmt, type Prefix } from '../lib/data';
import { useIconSet, type LoadedSet } from '../lib/iconSets';
import { familyOf } from '../lib/naming.js';
import { KEY_RE, staleCustom, strokeOverride } from '../lib/system';
import { useStore } from '../store';

const PAGE = 240;

export function Search() {
  const { ui, setUi, sys } = useStore();
  const prefix: Prefix = ui.searchSet ?? sys.set;
  const state = useIconSet(prefix);
  const [limit, setLimit] = useState(PAGE);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => { setLimit(PAGE); setPicked(null); }, [prefix, ui.searchQ]);

  const q = ui.searchQ.trim().toLowerCase();
  const results = useMemo(() => {
    if (state.status !== 'ready') return [];
    const { names } = state.set;
    if (!q) return names;
    // 한글로 찾으면 의미 사전에서 영문 이름을 찾아 앞에 둔다
    const fromKo = DATA.concepts.filter((c) => c.ko.includes(q)).map((c) => c.v[prefix].base);
    const words = q.split(/\s+/).filter(Boolean);
    const hits = names.filter((n) => words.every((w) => n.includes(w)));
    return [...new Set([...fromKo.filter((n) => state.set.has(n)), ...hits])];
  }, [state, q, prefix]);

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>세트 전체에서 찾기</h2>
          <p>의미 사전에 없는 아이콘을 세트 전체에서 찾습니다. 허용 세트의 아이콘은 팀 icon-map에 의미 키를 붙여 추가하거나, 기존 의미의 아이콘을 바꿀 수 있습니다.</p>
        </div>
      </div>
      <div className="chips lib-pick">
        {LIBS.map((p) => (
          <button key={p} className="chip" aria-pressed={p === prefix} onClick={() => setUi({ searchSet: p === sys.set ? null : p })}>
            {LIB[p].label}{p === sys.set ? ' · 허용 세트' : ''}
          </button>
        ))}
      </div>
      <div className="cmp">
        <div className="minw0">
          <div className="card toolbar">
            <div className="ctl grow">
              <label className="label" htmlFor="sq">찾기 (영문 이름 또는 한글 의미)</label>
              <input type="search" id="sq" placeholder="예: invoice, chart pie, 영수증" value={ui.searchQ} onChange={(e) => setUi({ searchQ: e.target.value })} />
            </div>
            <div className="ctl"><span className="label">결과</span>
              <span className="mono">{state.status === 'ready' ? `${fmt(results.length)} / ${fmt(state.set.names.length)}` : '—'}</span>
            </div>
          </div>
          {state.status === 'loading' && <div className="card pad muted">{LIB[prefix].label} 세트를 불러오는 중입니다. 처음 한 번만 받으며, 세트에 따라 수 MB입니다.</div>}
          {state.status === 'error' && <div className="card pad warn-box">{state.message}</div>}
          {state.status === 'ready' && (
            <div className="card pad">
              {results.length === 0
                ? <p className="muted">“{ui.searchQ}”에 맞는 아이콘이 없습니다. 다른 낱말이나 다른 세트로 찾아보세요.</p>
                : (
                  <div className="sgrid">
                    {results.slice(0, limit).map((n) => (
                      <button key={n} className={`scell${picked === n ? ' picked' : ''}`} title={n} onClick={() => setPicked(n)}>
                        <IconSvg data={state.set.get(n)} size={24} sw={strokeOverride(sys, prefix)} />
                        <small>{n}</small>
                      </button>
                    ))}
                  </div>
                )}
              {results.length > limit && (
                <div className="more"><button className="btn" onClick={() => setLimit((l) => l + PAGE)}>{fmt(Math.min(PAGE, results.length - limit))}개 더 보기</button></div>
              )}
            </div>
          )}
        </div>
        <div className="side-stack">
          {state.status === 'ready' && picked && <Detail key={`${prefix}:${picked}`} set={state.set} name={picked} />}
          {!picked && <div className="card pad muted tiny">아이콘을 누르면 여기서 크게 보고, 팀 icon-map에 추가할 수 있습니다.</div>}
          <TeamEntries />
        </div>
      </div>
    </section>
  );
}

function Detail({ set, name }: { set: LoadedSet; name: string }) {
  const { sys, setSys, toast } = useStore();
  const p = set.prefix;
  const fam = familyOf(p, name, set.has);
  const allowed = p === sys.set;
  const [key, setKey] = useState(fam.stem);
  const [ko, setKo] = useState('');
  const [useName, setUseName] = useState<'family' | 'exact'>('family');
  const sw = strokeOverride(sys, p);

  const base = useName === 'exact' ? name : fam.base;
  const active = useName === 'exact' ? null : fam.active;
  const keyOk = KEY_RE.test(key);
  const concept = conceptById[key];
  const exists = sys.custom[key];

  const add = () => {
    if (!keyOk) return;
    setSys((s) => ({ ...s, custom: { ...s.custom, [key]: { base: `${p}:${base}`, active: active ? `${p}:${active}` : null, ...(ko.trim() ? { ko: ko.trim() } : {}) } } }));
    toast(concept ? `‘${concept.ko}’의 아이콘을 ${base}(으)로 바꿨습니다` : `‘${key}’를 팀 icon-map에 추가했습니다`);
  };

  return (
    <div className="card pad detail">
      <div className="detail-top">
        <div className="stage small"><IconSvg data={set.get(base)} size="80%" sw={sw} /></div>
        <div className="minw0">
          <span className="label">{LIB[p].label}</span>
          <h3 className="mono">{p}:{name}</h3>
          <div className="sizes compact">
            {[16, 20, 24, 32].map((n) => <figure key={n}><IconSvg data={set.get(base)} size={n} sw={sw} /><figcaption>{n}</figcaption></figure>)}
          </div>
        </div>
      </div>
      <dl className="kv">
        <dt>기본형</dt><dd>{fam.base}</dd>
        <dt>활성형</dt><dd>{fam.active ?? '없음 (색으로만 구분)'}</dd>
      </dl>
      {fam.active && (
        <div className="pair">
          <figure><IconSvg data={set.get(fam.base)} size={28} sw={sw} /><figcaption>기본</figcaption></figure>
          <span aria-hidden="true">→</span>
          <figure className="on"><IconSvg data={set.get(fam.active)} size={28} /><figcaption>활성</figcaption></figure>
        </div>
      )}

      {allowed ? (
        <form className="add" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <span className="label">팀 icon-map에 추가</span>
          {name !== fam.base && (
            <div className="seg small">
              <button type="button" aria-pressed={useName === 'family'} onClick={() => setUseName('family')}>기본형+활성형 묶음</button>
              <button type="button" aria-pressed={useName === 'exact'} onClick={() => setUseName('exact')}>이 아이콘만</button>
            </div>
          )}
          <label className="field">
            <span>의미 키</span>
            <input value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="예: invoice" aria-invalid={!keyOk} />
          </label>
          {!keyOk && <p className="tiny warn-text">영문 소문자·숫자와 하이픈만 씁니다 (예: credit-card).</p>}
          {!concept && (
            <label className="field"><span>한글 이름 (선택)</span><input value={ko} onChange={(e) => setKo(e.target.value)} placeholder="예: 청구서" /></label>
          )}
          {concept && <p className="tiny warn-text">의미 사전의 ‘{concept.ko}’({concept.v[p].base}) 대신 이 아이콘을 씁니다.</p>}
          {!concept && exists && <p className="tiny warn-text">이미 있는 팀 항목 ‘{key}’({exists.base})를 덮어씁니다.</p>}
          <button className="btn primary" type="submit" disabled={!keyOk}>{concept ? '이 아이콘으로 바꾸기' : exists ? '덮어쓰기' : '추가'}</button>
        </form>
      ) : (
        <p className="tiny muted note-box">허용 세트가 {LIB[sys.set].label}이라 이 아이콘은 비교용으로만 볼 수 있습니다. 세트를 섞지 않도록 추가는 막아 두었습니다.</p>
      )}
    </div>
  );
}

function TeamEntries() {
  const { sys, setSys, toast } = useStore();
  const state = useIconSet(sys.set);
  const entries = Object.entries(sys.custom);
  const stale = new Set(staleCustom(sys));
  const remove = (k: string) => {
    setSys((s) => { const c = { ...s.custom }; delete c[k]; return { ...s, custom: c }; });
    toast(`‘${k}’를 팀 icon-map에서 뺐습니다`);
  };
  return (
    <div className="card pad">
      <h3 className="h-small">팀이 바꾸거나 더한 항목 <span className="mono muted">{entries.length}</span></h3>
      {entries.length === 0 && <p className="tiny muted">아직 없습니다. 의미 사전 {DATA.concepts.length}개만 icon-map에 들어갑니다.</p>}
      <ul className="team-list">
        {entries.map(([k, e]) => {
          const [ep, en] = e.base.split(':');
          const data = state.status === 'ready' && ep === sys.set ? state.set.get(en) : null;
          return (
            <li key={k} className={stale.has(k) ? 'stale' : ''}>
              <span className="ti">{data ? <IconSvg data={data} size={20} sw={strokeOverride(sys, sys.set)} /> : <span className="ph" />}</span>
              <span className="minw0">
                <b>{k}</b>{conceptById[k] ? <span className="pill no">사전 대체</span> : e.ko ? <span className="muted"> {e.ko}</span> : null}
                <span className="mono tiny muted block">{e.base}{e.active ? ` / ${e.active.split(':')[1]}` : ''}</span>
                {stale.has(k) && <span className="tiny warn-text block">허용 세트가 아니라 내보내기에서 빠짐</span>}
              </span>
              <button className="btn ghost" onClick={() => remove(k)} aria-label={`${k} 빼기`}>빼기</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
