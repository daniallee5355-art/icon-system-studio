// 팀이 공유하는 "아이콘 시스템" 결정 사항과 그 직렬화
import { DATA, FW_LABEL, LIB, STROKE_LIBS, isPrefix, type Framework, type Prefix } from './data';

export type CssBase = 'tailwind' | 'bootstrap' | 'material' | 'none';
export const SIZE_STEPS = [16, 20, 24, 32] as const;
export const SIZE_KEY: Record<number, string> = { 16: 'xs', 20: 'sm', 24: 'md', 32: 'lg' };

export interface CustomEntry {
  base: string; // "prefix:name"
  active: string | null;
  ko?: string;
}

export interface IconSystem {
  version: 1;
  name: string;
  set: Prefix;
  sizes: number[];
  stroke: number | null; // null이면 세트 기본값
  activeColor: string;
  framework: Framework;
  css: CssBase;
  // 의미 사전의 id와 같으면 그 의미의 아이콘을 바꾸고, 새 키면 항목을 더한다
  custom: Record<string, CustomEntry>;
  updated: string;
}

export const DEFAULT_SYSTEM: IconSystem = {
  version: 1,
  name: '우리 팀 아이콘 시스템',
  set: 'lucide',
  sizes: [16, 20, 24],
  stroke: null,
  activeColor: '#C2185B',
  framework: 'react',
  css: 'tailwind',
  custom: {},
  updated: '',
};

export const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 선으로 그린 세트일 때 실제로 쓰는 선 굵기, 아니면 null */
export function effectiveStroke(sys: Pick<IconSystem, 'stroke'>, p: Prefix): number | null {
  if (!STROKE_LIBS.has(p)) return null;
  return sys.stroke ?? LIB[p].stroke;
}
/** 렌더링에서 SVG 속성을 덮어쓸 값 (세트 기본값이면 덮어쓰지 않는다) */
export function strokeOverride(sys: Pick<IconSystem, 'stroke'>, p: Prefix): number | null {
  return STROKE_LIBS.has(p) && sys.stroke != null ? sys.stroke : null;
}

const prefixOf = (id: string) => id.split(':')[0];

/** 허용 세트와 다른 세트에서 온 사용자 항목 (세트를 바꾼 뒤 남은 것) */
export function staleCustom(sys: IconSystem): string[] {
  return Object.entries(sys.custom).filter(([, e]) => prefixOf(e.base) !== sys.set).map(([k]) => k);
}

export type IconMap = Record<string, { base: string; active: string | null; ko?: string }>;

/** 의미 키 → 아이콘 이름표. 의미 사전 + 팀이 바꾸거나 더한 항목 (허용 세트 것만) */
export function iconMap(sys: IconSystem): IconMap {
  const m: IconMap = {};
  for (const c of DATA.concepts) {
    const v = c.v[sys.set];
    m[c.id] = { base: `${sys.set}:${v.base}`, active: v.active ? `${sys.set}:${v.active}` : null };
  }
  for (const [k, e] of Object.entries(sys.custom)) {
    if (prefixOf(e.base) !== sys.set) continue;
    m[k] = { base: e.base, active: e.active, ...(e.ko && !DATA.concepts.some((c) => c.id === k) ? { ko: e.ko } : {}) };
  }
  return m;
}

// ---- 검증 ----
export class SystemError extends Error {}

export function parseSystem(input: unknown): IconSystem {
  if (!input || typeof input !== 'object') throw new SystemError('아이콘 시스템 파일이 아닙니다.');
  const o = input as Record<string, unknown>;
  if (o.version !== 1) throw new SystemError(`지원하지 않는 버전입니다 (version: ${String(o.version)}).`);
  if (!isPrefix(o.set)) throw new SystemError(`알 수 없는 세트입니다: ${String(o.set)}`);
  const sizes = Array.isArray(o.sizes) ? o.sizes.filter((n): n is number => (SIZE_STEPS as readonly number[]).includes(n as number)) : [];
  if (!sizes.length) throw new SystemError('크기 단계(sizes)가 비어 있습니다. 16·20·24·32 중에서 고르세요.');
  const stroke = o.stroke == null ? null : Number(o.stroke);
  if (stroke != null && !(stroke >= 0.5 && stroke <= 4)) throw new SystemError('선 굵기(stroke)는 0.5~4 사이여야 합니다.');
  const color = typeof o.activeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(o.activeColor) ? o.activeColor : DEFAULT_SYSTEM.activeColor;
  const framework = (Object.keys(FW_LABEL) as Framework[]).includes(o.framework as Framework) ? (o.framework as Framework) : DEFAULT_SYSTEM.framework;
  const css = (['tailwind', 'bootstrap', 'material', 'none'] as CssBase[]).includes(o.css as CssBase) ? (o.css as CssBase) : 'none';
  const custom: Record<string, CustomEntry> = {};
  if (o.custom && typeof o.custom === 'object') {
    for (const [k, v] of Object.entries(o.custom as Record<string, unknown>)) {
      const e = v as Partial<CustomEntry> | null;
      if (!KEY_RE.test(k) || !e || typeof e.base !== 'string' || !e.base.includes(':')) {
        throw new SystemError(`custom 항목 "${k}"의 형식이 잘못됐습니다.`);
      }
      custom[k] = { base: e.base, active: typeof e.active === 'string' ? e.active : null, ...(typeof e.ko === 'string' ? { ko: e.ko } : {}) };
    }
  }
  return {
    version: 1,
    name: typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 80) : DEFAULT_SYSTEM.name,
    set: o.set,
    sizes: [...new Set(sizes)].sort((a, b) => a - b),
    stroke,
    activeColor: color,
    framework,
    css,
    custom,
    updated: typeof o.updated === 'string' ? o.updated : '',
  };
}

// ---- 공유 링크 (UTF-8 JSON → base64url) ----
export function encodeSystem(sys: IconSystem): string {
  const bytes = new TextEncoder().encode(JSON.stringify(sys));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSystem(token: string): IconSystem {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    return parseSystem(JSON.parse(json));
  } catch (e) {
    if (e instanceof SystemError) throw e;
    throw new SystemError('공유 링크가 손상됐습니다. 링크 전체가 복사됐는지 확인하세요.');
  }
}
