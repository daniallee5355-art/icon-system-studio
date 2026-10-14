// 프로젝트 조건 → 라이브러리 점수. 정성 판단은 원 보고서의 결론부, 수치는 실제 아이콘 데이터에서 온다.
import { COVER, DATA, FW_LABEL, LIB, LIBS, OBJECTS, fmt, type Framework, type Prefix } from './data';
import type { CssBase } from './system';

export interface Quiz {
  fw: Framework;
  css: CssBase;
  product: 'minimal' | 'interactive' | 'enterprise' | 'ai';
  fill: 'need' | 'color';
  density: 'single' | 'mixed';
  vocab: 'general' | 'rich';
  license: 'any' | 'permissive';
}

export const DEFAULT_QUIZ: Quiz = { fw: 'react', css: 'tailwind', product: 'minimal', fill: 'need', density: 'single', vocab: 'general', license: 'any' };

export const QUIZ: { k: keyof Quiz; t: string; o: [string, string][] }[] = [
  { k: 'fw', t: '프레임워크', o: [['react', 'React'], ['vue', 'Vue'], ['svelte', 'Svelte'], ['angular', 'Angular'], ['flutter', 'Flutter'], ['html', 'HTML / 기타']] },
  { k: 'css', t: 'CSS 기반', o: [['tailwind', 'Tailwind'], ['bootstrap', 'Bootstrap'], ['material', 'Material (MUI · Angular Material)'], ['none', '해당 없음']] },
  { k: 'product', t: '제품 성격', o: [['minimal', '미니멀 SaaS · 웹/모바일'], ['interactive', '상태 전환이 많은 앱'], ['enterprise', '엔터프라이즈 · 데이터 대시보드'], ['ai', 'AI 생성 UI · 노코드 빌더']] },
  { k: 'fill', t: '활성 상태 표현', o: [['need', '선→면(Fill) 전환이 필요'], ['color', '색 변화로 충분']] },
  { k: 'density', t: '아이콘 크기', o: [['single', '24px 위주'], ['mixed', '16 · 20 · 24px 혼용 (고밀도)']] },
  { k: 'vocab', t: '필요한 어휘', o: [['general', '일반 UI 위주'], ['rich', '특수 도메인 많음 (금융 · 지도 · 개발도구)']] },
  { k: 'license', t: '라이선스 조건', o: [['any', '오픈소스면 무관'], ['permissive', 'MIT · ISC만']] },
];

const FIT: Record<Quiz['product'], Record<Prefix, number>> = {
  minimal: { lucide: 3, iconoir: 3, heroicons: 2, tabler: 1, ph: 1, ri: 1, bi: 1, carbon: 0, 'material-symbols': 0 },
  interactive: { ph: 3, ri: 3, heroicons: 2, 'material-symbols': 2, bi: 1, tabler: 1, lucide: 0, iconoir: 0, carbon: 0 },
  enterprise: { tabler: 3, carbon: 3, 'material-symbols': 2, ri: 1, ph: 1, lucide: 1, bi: 1, heroicons: 0, iconoir: 0 },
  ai: { tabler: 2, 'material-symbols': 2, ph: 2, lucide: 1, ri: 1, carbon: 1, iconoir: 1, bi: 1, heroicons: 0 },
};

const FIT_WHY: Record<Prefix, string> = {
  lucide: 'Feather를 이은 2px 라인 스타일, 미니멀 SaaS에서 가장 흔한 선택',
  iconoir: '기하학적 단일 라인 스타일, React Native·Flutter까지 패키지가 넓음',
  heroicons: '크기별 전용 버전(Outline/Solid 24, Mini 20, Micro 16)',
  ph: '한 아이콘에 6단계 굵기(Thin~Duotone)가 있어 상태 표현이 유연',
  ri: 'Line/Fill이 1:1로 짝지어져 있어 활성 상태 전환이 확실',
  tabler: '고유 형태가 가장 많아 도메인 어휘가 넓음',
  carbon: 'IBM 엔터프라이즈 시스템용, 16/20/24/32 그리드 규격',
  'material-symbols': '가변 폰트 4축으로 상태를 CSS만으로 조절',
  bi: 'Bootstrap과 일반 HTML 환경에 바로 붙는 범용 세트',
};

export interface Result { p: Prefix; s: number; why: string[]; minus: string[]; out: boolean }

export function recommend(a: Quiz): Result[] {
  return LIBS.map((p): Result => {
    const set = DATA.sets[p], L = LIB[p];
    let s = 0;
    const why: string[] = [], minus: string[] = [];

    const fit = FIT[a.product][p];
    s += fit * 2;
    if (fit >= 2) why.push(FIT_WHY[p]);

    const cov = COVER[p] / OBJECTS.length;
    if (a.fill === 'need') {
      s += Math.round(cov * 4);
      if (cov >= 0.9) why.push(`사물 아이콘 ${OBJECTS.length}개 중 ${COVER[p]}개에 Fill 변형`);
      else if (cov < 0.6) minus.push(`Fill 변형이 ${COVER[p]}/${OBJECTS.length}개뿐이라 활성 상태를 색으로만 구분해야 함`);
    }
    if (a.density === 'mixed') {
      const d: Partial<Record<Prefix, [number, string]>> = {
        heroicons: [3, '20·16px 전용 Mini/Micro 버전'],
        carbon: [2, '16/20/24/32 픽셀 그리드 규격'],
        'material-symbols': [2, 'Optical size 축이 크기에 맞춰 획을 보정'],
      };
      const x = d[p];
      if (x) { s += x[0]; why.push(x[1]); }
    }
    if (a.vocab === 'rich') {
      const u = set.unique, v = u >= 3500 ? 3 : u >= 2000 ? 2 : u >= 1000 ? 1 : -1;
      s += v;
      if (v >= 2) why.push(`고유 형태 ${fmt(u)}개`);
      if (v < 0) minus.push(`고유 형태 ${fmt(u)}개로 특수 도메인 아이콘이 부족`);
    }
    if (a.css === 'tailwind' && p === 'heroicons') { s += 3; why.push('Tailwind CSS 제작진이 만든 세트'); }
    if (a.css === 'tailwind' && p === 'lucide') { s += 1; why.push('shadcn/ui의 기본 아이콘 세트'); }
    if (a.css === 'bootstrap' && p === 'bi') { s += 3; why.push('Bootstrap 공식 아이콘'); }
    if (a.css === 'material' && p === 'material-symbols') { s += 3; why.push('Material 생태계의 공식 심볼'); }

    const pkg = L.pkg[a.fw];
    if (pkg) { s += 2; why.push(`공식 ${FW_LABEL[a.fw]} 패키지 ${pkg}`); }
    else if (a.fw === 'flutter') { s -= 3; minus.push('Flutter용 공식 패키지 없음'); }
    else minus.push(`공식 ${FW_LABEL[a.fw]} 패키지 없음 → Iconify 컴포넌트로 사용`);

    const out = a.license === 'permissive' && set.spdx === 'Apache-2.0';
    if (out) minus.unshift('Apache 2.0이라 라이선스 조건에서 제외');
    return { p, s, why, minus, out };
  }).sort((x, y) => Number(x.out) - Number(y.out) || y.s - x.s);
}
