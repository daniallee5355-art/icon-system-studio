import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isPrefix, type Mode, type Prefix } from './lib/data';
import { DEFAULT_QUIZ, type Quiz } from './lib/recommend';
import { DEFAULT_SYSTEM, parseSystem, type IconSystem } from './lib/system';

export const TABS = [
  { id: 'recommend', n: '01', t: '추천' },
  { id: 'compare', n: '02', t: '비교' },
  { id: 'states', n: '03', t: '상태 미리보기' },
  { id: 'variable', n: '04', t: '가변 폰트' },
  { id: 'search', n: '05', t: '전체 검색' },
  { id: 'export', n: '06', t: '내보내기 · 공유' },
  { id: 'licenses', n: '', t: '라이선스' },
] as const;
export type Tab = (typeof TABS)[number]['id'];
export const isTab = (x: string): x is Tab => TABS.some((t) => t.id === x);

// 이 브라우저에서만 기억하는 화면 상태 (팀 공유 대상 아님)
export interface Ui {
  tab: Tab;
  size: number;
  mode: Mode;
  q: string;
  pick: { c: string; p: Prefix };
  variant: string;
  nav: string;
  bar: string;
  toggles: Record<string, boolean>;
  axes: { fill: number; wght: number; grad: number; opsz: number; px: number };
  vfIcon: string;
  quiz: Quiz;
  searchSet: Prefix | null; // null이면 허용 세트
  searchQ: string;
}

const DEFAULT_UI: Ui = {
  tab: 'recommend', size: 24, mode: 'base', q: '', pick: { c: 'home', p: 'lucide' }, variant: 'home',
  nav: 'dashboard', bar: 'home', toggles: { heart: true, bookmark: false, star: true, bell: false },
  axes: { fill: 0, wght: 400, grad: 0, opsz: 24, px: 72 }, vfIcon: 'home', quiz: DEFAULT_QUIZ,
  searchSet: null, searchQ: '',
};

function load<T>(key: string, fallback: T, revive: (v: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? revive(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
function persist(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* 저장소를 쓸 수 없으면 이번 세션만 기억 */ }
}

const reviveUi = (v: unknown): Ui => {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Ui>;
  const ui: Ui = { ...DEFAULT_UI, ...o, quiz: { ...DEFAULT_QUIZ, ...(o.quiz || {}) }, axes: { ...DEFAULT_UI.axes, ...(o.axes || {}) }, toggles: { ...DEFAULT_UI.toggles, ...(o.toggles || {}) } };
  if (!isPrefix(ui.pick?.p)) ui.pick = DEFAULT_UI.pick;
  if (ui.searchSet != null && !isPrefix(ui.searchSet)) ui.searchSet = null;
  return ui;
};
const reviveSystem = (v: unknown): IconSystem => {
  try { return parseSystem(v); } catch { return DEFAULT_SYSTEM; }
};

interface Store {
  sys: IconSystem;
  setSys: (fn: (s: IconSystem) => IconSystem) => void;
  ui: Ui;
  setUi: (patch: Partial<Ui> | ((u: Ui) => Partial<Ui>)) => void;
  toast: (msg: string) => void;
  toastMsg: string;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [sys, setSysState] = useState(() => load('iss-system', DEFAULT_SYSTEM, reviveSystem));
  const [ui, setUiState] = useState(() => load('iss-ui', DEFAULT_UI, reviveUi));
  const [toastMsg, setToastMsg] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => persist('iss-system', sys), [sys]);
  useEffect(() => persist('iss-ui', ui), [ui]);

  const setSys = useCallback((fn: (s: IconSystem) => IconSystem) => {
    setSysState((s) => ({ ...fn(s), updated: new Date().toISOString().slice(0, 10) }));
  }, []);
  const setUi = useCallback((patch: Partial<Ui> | ((u: Ui) => Partial<Ui>)) => {
    setUiState((u) => ({ ...u, ...(typeof patch === 'function' ? patch(u) : patch) }));
  }, []);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const value = useMemo(() => ({ sys, setSys, ui, setUi, toast, toastMsg }), [sys, setSys, ui, setUi, toast, toastMsg]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 밖에서 useStore를 썼습니다');
  return s;
}
