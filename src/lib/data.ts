import core from '../generated/core.json';
import { PREFIXES, type Prefix, type Variants } from './naming.js';

export type { Prefix };
export type IconData = [number, number, string];
export type Mode = 'base' | 'active';

export interface Concept {
  id: string;
  ko: string;
  kind: 'object' | 'action';
  v: Record<Prefix, Variants & { base: string }>;
}

export interface SetMeta {
  name: string;
  version: string | null;
  pkgVersion: string;
  total: number;
  unique: number;
  license: string;
  spdx: string;
  licenseUrl: string;
  author: string;
  authorUrl: string;
  height: number;
  width: number;
}

export const DATA = core as unknown as {
  generated: string;
  sets: Record<Prefix, SetMeta>;
  concepts: Concept[];
  icons: Record<string, IconData>;
};

export const LIBS: Prefix[] = PREFIXES;

export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'flutter' | 'html';
export const FW_LABEL: Record<Framework, string> = { react: 'React', vue: 'Vue', svelte: 'Svelte', angular: 'Angular', flutter: 'Flutter', html: 'HTML' };

export interface LibInfo {
  label: string;
  style: string;
  stroke: number | null; // 선으로 그린 세트의 기본 선 굵기
  report: string; // 원 보고서의 표기 수치
  pkg: Partial<Record<Framework, string>>;
}

// 라이브러리별 정성 정보 (수치는 DATA.sets에서 가져온다)
export const LIB: Record<Prefix, LibInfo> = {
  lucide: { label: 'Lucide', style: 'Outline 단일', stroke: 2, report: '~1,870',
    pkg: { react: 'lucide-react', vue: 'lucide-vue-next', svelte: 'lucide-svelte', angular: 'lucide-angular', html: 'lucide' } },
  heroicons: { label: 'Heroicons', style: 'Outline · Solid · Mini 20 · Micro 16', stroke: 1.5, report: '~1,260',
    pkg: { react: '@heroicons/react', vue: '@heroicons/vue' } },
  ph: { label: 'Phosphor', style: 'Thin · Light · Regular · Bold · Fill · Duotone', stroke: null, report: '~9,000',
    pkg: { react: '@phosphor-icons/react', vue: '@phosphor-icons/vue', html: '@phosphor-icons/web', flutter: 'phosphor_flutter' } },
  tabler: { label: 'Tabler', style: 'Outline + 일부 Filled', stroke: 2, report: '~6,200',
    pkg: { react: '@tabler/icons-react', vue: '@tabler/icons-vue', svelte: '@tabler/icons-svelte', html: '@tabler/icons-webfont' } },
  ri: { label: 'Remix Icon', style: 'Line · Fill 쌍', stroke: null, report: '~3,200',
    pkg: { react: '@remixicon/react', vue: '@remixicon/vue', html: 'remixicon' } },
  carbon: { label: 'IBM Carbon', style: '단일 유틸리티 + 일부 Filled', stroke: null, report: '~2,000',
    pkg: { react: '@carbon/icons-react', vue: '@carbon/icons-vue', svelte: 'carbon-icons-svelte', html: '@carbon/icons' } },
  iconoir: { label: 'Iconoir', style: '기하학 라인 + 일부 Solid', stroke: 1.5, report: '~1,670',
    pkg: { react: 'iconoir-react', vue: '@iconoir/vue', flutter: 'iconoir_flutter', html: 'iconoir' } },
  'material-symbols': { label: 'Material Symbols', style: 'Outlined/Filled · 가변 폰트 4축', stroke: null, report: '3,000+',
    pkg: { flutter: '(내장) Icons' } },
  bi: { label: 'Bootstrap Icons', style: 'Outline · Fill', stroke: null, report: '~2,000',
    pkg: { html: 'bootstrap-icons' } },
};

export const STROKE_LIBS = new Set<Prefix>(['lucide', 'heroicons', 'tabler', 'iconoir']);
export const OBJECTS = DATA.concepts.filter((c) => c.kind === 'object');
export const COVER = Object.fromEntries(LIBS.map((p) => [p, OBJECTS.filter((c) => c.v[p].active).length])) as Record<Prefix, number>;
export const conceptById: Record<string, Concept> = Object.fromEntries(DATA.concepts.map((c) => [c.id, c]));

export function iconKey(c: Concept, p: Prefix, mode: Mode): string {
  const v = c.v[p];
  return `${p}:${mode === 'active' && v.active ? v.active : v.base}`;
}

export const isPrefix = (x: unknown): x is Prefix => typeof x === 'string' && (LIBS as string[]).includes(x);
export const fmt = (n: number) => n.toLocaleString('en-US');
