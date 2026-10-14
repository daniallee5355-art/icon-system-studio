import { describe, expect, it } from 'vitest';
import { generate, defaultSizeKey, iconMapFile } from './codegen';
import { COVER, DATA, LIBS, OBJECTS } from './data';
import { familyOf, variants } from './naming.js';
import { DEFAULT_QUIZ, recommend } from './recommend';
import { DEFAULT_SYSTEM, SystemError, decodeSystem, encodeSystem, iconMap, parseSystem, staleCustom, type IconSystem } from './system';

const sys = (patch: Partial<IconSystem> = {}): IconSystem => ({ ...DEFAULT_SYSTEM, ...patch });

describe('데이터', () => {
  it('모든 의미가 9개 세트 모두에 기본형과 SVG를 가진다', () => {
    for (const c of DATA.concepts) {
      for (const p of LIBS) {
        expect(c.v[p].base, `${c.id} / ${p}`).toBeTruthy();
        expect(DATA.icons[`${p}:${c.v[p].base}`], `${p}:${c.v[p].base}`).toBeDefined();
      }
    }
  });
  it('Lucide에는 Fill 변형이 없고 Heroicons·Phosphor는 모두 있다', () => {
    expect(COVER.lucide).toBe(0);
    expect(COVER.heroicons).toBe(OBJECTS.length);
    expect(COVER.ph).toBe(OBJECTS.length);
  });
  it('고유 형태 수는 변형 포함 수보다 크지 않다', () => {
    for (const p of LIBS) expect(DATA.sets[p].unique).toBeLessThanOrEqual(DATA.sets[p].total);
  });
});

describe('이름 규칙', () => {
  const has = (set: string[]) => (n: string) => set.includes(n);
  it('Remix는 -line/-fill 쌍을 찾는다', () => {
    expect(variants('ri', 'home', has(['home-line', 'home-fill']))).toEqual({ base: 'home-line', active: 'home-fill' });
  });
  it('검색에서 고른 활성형 이름으로도 같은 묶음을 찾는다', () => {
    const f = familyOf('heroicons', 'bell-solid', has(['bell', 'bell-solid', 'bell-20-solid']));
    expect(f.stem).toBe('bell');
    expect(f.base).toBe('bell');
    expect(f.active).toBe('bell-solid');
    expect(f.mini).toBe('bell-20-solid');
  });
  it('Material Symbols는 outline이 기본형, 이름 그대로가 활성형', () => {
    expect(familyOf('material-symbols', 'home-outline', has(['home', 'home-outline']))).toMatchObject({ base: 'home-outline', active: 'home' });
  });
});

describe('추천', () => {
  it('Tailwind + Fill 필요 조건에서는 Heroicons가 1순위', () => {
    expect(recommend(DEFAULT_QUIZ)[0].p).toBe('heroicons');
  });
  it('MIT·ISC만 고르면 Apache 2.0 세트는 맨 뒤로 빠진다', () => {
    const r = recommend({ ...DEFAULT_QUIZ, license: 'permissive' });
    const out = r.filter((x) => x.out).map((x) => x.p).sort();
    expect(out).toEqual(['carbon', 'material-symbols', 'ri']);
    expect(r.slice(-3).every((x) => x.out)).toBe(true);
  });
  it('엔터프라이즈 + 특수 도메인이면 Tabler가 상위', () => {
    const r = recommend({ ...DEFAULT_QUIZ, css: 'none', product: 'enterprise', vocab: 'rich', fill: 'color' });
    expect(r[0].p).toBe('tabler');
  });
});

describe('아이콘 시스템', () => {
  it('공유 링크로 왕복해도 같다 (한글 이름 포함)', () => {
    const s = sys({ name: '디자인팀 아이콘', set: 'ph', custom: { invoice: { base: 'ph:receipt', active: 'ph:receipt-fill', ko: '청구서' } } });
    expect(decodeSystem(encodeSystem(s))).toEqual(s);
  });
  it('망가진 링크와 잘못된 파일은 이유와 함께 거절한다', () => {
    expect(() => decodeSystem('not-a-valid-token')).toThrow(SystemError);
    expect(() => parseSystem({ version: 2 })).toThrow(/버전/);
    expect(() => parseSystem({ ...DEFAULT_SYSTEM, set: 'fontawesome' })).toThrow(/세트/);
    expect(() => parseSystem({ ...DEFAULT_SYSTEM, sizes: [13] })).toThrow(/크기/);
    expect(() => parseSystem({ ...DEFAULT_SYSTEM, custom: { 'Bad Key': { base: 'lucide:x' } } })).toThrow(/custom/);
  });
  it('팀 항목은 사전 의미를 바꾸거나 새 키를 더하고, 다른 세트 항목은 뺀다', () => {
    const s = sys({ set: 'lucide', custom: {
      settings: { base: 'lucide:cog', active: null },
      invoice: { base: 'lucide:receipt', active: null, ko: '청구서' },
      stray: { base: 'ph:receipt', active: null },
    } });
    const m = iconMap(s);
    expect(m.settings.base).toBe('lucide:cog');
    expect(m.invoice).toEqual({ base: 'lucide:receipt', active: null, ko: '청구서' });
    expect(m.stray).toBeUndefined();
    expect(staleCustom(s)).toEqual(['stray']);
    expect(Object.keys(m)).toHaveLength(DATA.concepts.length + 1);
  });
});

describe('코드 생성', () => {
  it('기본 크기 키는 24px이 있으면 md, 없으면 가장 작은 단계', () => {
    expect(defaultSizeKey([16, 20, 24])).toBe('md');
    expect(defaultSizeKey([20, 32])).toBe('sm');
  });
  it('선 세트만 --icon-stroke 토큰을 만든다', () => {
    const tokens = (s: IconSystem) => generate(s).find((b) => b.file === 'tokens.css')!.code;
    expect(tokens(sys({ set: 'lucide' }))).toContain('--icon-stroke: 2;');
    expect(tokens(sys({ set: 'lucide', stroke: 1.5 }))).toContain('--icon-stroke: 1.5;');
    expect(tokens(sys({ set: 'ph' }))).not.toContain('--icon-stroke:');
  });
  it('프레임워크에 맞는 래퍼를 만든다', () => {
    const files = (fw: IconSystem['framework']) => generate(sys({ framework: fw })).map((b) => b.file);
    expect(files('react')).toContain('Icon.tsx');
    expect(files('vue')).toContain('Icon.vue');
    expect(files('svelte')).toContain('Icon.svelte');
    expect(files('angular')).toContain('index.html');
  });
  it('icon-map.json은 올바른 JSON이다', () => {
    const m = JSON.parse(iconMapFile(sys({ set: 'ri' })));
    expect(m.home).toEqual({ base: 'ri:home-line', active: 'ri:home-fill' });
  });
});
