// 아이콘 시스템 → 팀 저장소에 넣을 코드 조각
import { COVER, DATA, LIB, OBJECTS } from './data';
import { SIZE_KEY, effectiveStroke, iconMap, type IconSystem } from './system';

export interface Block { title: string; file: string; code: string; note?: string }

const lines = (...xs: (string | false | null | undefined)[]) => xs.filter((x) => x !== false && x != null).join('\n');

export function defaultSizeKey(sizes: number[]): string {
  return sizes.includes(24) ? 'md' : SIZE_KEY[sizes[0]];
}

export function activeRule(sys: IconSystem): string {
  const c = COVER[sys.set];
  if (c >= OBJECTS.length * 0.9) return 'Fill 변형과 활성 색으로';
  if (c === 0) return '활성 색과 배경으로만 (이 세트에는 Fill 변형이 없음)';
  return 'Fill 변형이 있으면 쓰고, 없으면 활성 색으로만';
}

export function systemRules(sys: IconSystem): string[] {
  const sw = effectiveStroke(sys, sys.set);
  return [
    `아이콘은 ${LIB[sys.set].label} (${sys.set}) 세트에서만 가져옵니다.`,
    `크기는 ${sys.sizes.join(' · ')}px 단계만 씁니다.`,
    `활성 상태는 ${activeRule(sys)} 표시합니다.`,
    ...(sw ? [`선 굵기는 --icon-stroke: ${sw} 하나로 통일합니다.`] : []),
    '텍스트 없는 아이콘 버튼에는 label을 꼭 넣습니다.',
  ];
}

export function systemFile(sys: IconSystem): string {
  return JSON.stringify(sys, null, 2) + '\n';
}

export function iconMapFile(sys: IconSystem): string {
  return JSON.stringify(iconMap(sys), null, 2) + '\n';
}

export function noticeText(sys: IconSystem): string {
  const s = DATA.sets[sys.set];
  return lines(
    `Icons: ${s.name}${s.version ? ' v' + s.version : ''}`,
    `Copyright (c) ${s.author}`,
    `License: ${s.license} (${s.spdx})`,
    s.licenseUrl,
    s.spdx === 'Apache-2.0' && 'Apache 2.0: 배포물에 라이선스 전문을 포함하고, 원본에 NOTICE 파일이 있으면 그 내용도 함께 고지합니다.',
    s.spdx !== 'Apache-2.0' && `${s.spdx}: 배포물에 위 저작권 표시와 라이선스 전문을 포함합니다.`,
  );
}

export function generate(sys: IconSystem): Block[] {
  const p = sys.set, L = LIB[p], fw = sys.framework, sw = effectiveStroke(sys, p);
  const sizes = sys.sizes;
  const def = defaultSizeKey(sizes);
  const sizeObj = sizes.map((n) => `${SIZE_KEY[n]}: ${n}`).join(', ');
  const blocks: Block[] = [];

  // 설치
  const pkg = L.pkg[fw];
  const iconifyPkg = ({ react: '@iconify/react', vue: '@iconify/vue', svelte: '@iconify/svelte' } as Record<string, string>)[fw];
  if (fw === 'flutter') {
    blocks.push({ title: '설치', file: 'pubspec', code: pkg?.startsWith('(')
      ? `# ${L.label}: Flutter 기본 Icons 위젯 사용 (설치 불필요)`
      : pkg ? `flutter pub add ${pkg}` : `# ${L.label}은(는) Flutter 공식 패키지가 없습니다. 추천 탭에서 Phosphor·Iconoir·Material을 검토하세요.` });
  } else {
    blocks.push({ title: '설치', file: 'npm', code: lines(
      iconifyPkg ? '# 래퍼 컴포넌트용 (아래 Icon 컴포넌트가 사용)' : '# 웹 컴포넌트 방식 (Angular · 일반 HTML)',
      iconifyPkg ? `npm i ${iconifyPkg}` : 'npm i iconify-icon',
      '',
      '# 폐쇄망·오프라인 빌드: 세트 데이터를 번들에 포함',
      `npm i -D @iconify-json/${p}`,
      pkg && '',
      pkg && '# 참고: 세트 전용 공식 패키지 (래퍼 없이 직접 import할 때)',
      pkg && `npm i ${pkg}`,
      p === 'material-symbols' && '',
      p === 'material-symbols' && '# 참고: 가변 폰트 방식은 Google Fonts <link> 한 줄 (가변 폰트 탭 참고)',
    ) });
  }

  // 토큰
  blocks.push({ title: '디자인 토큰', file: 'tokens.css', code: lines(
    `/* Icon tokens — ${L.label} (${p}) */`,
    ':root {',
    ...sizes.map((n) => `  --icon-size-${SIZE_KEY[n]}: ${n}px;`),
    sw ? `  --icon-stroke: ${sw};` : `  /* ${L.label}은(는) 면(fill)으로 그린 세트라 선 굵기 토큰이 없습니다 */`,
    '  --icon-color: currentColor;',
    `  --icon-color-active: ${sys.activeColor};`,
    '}',
    '',
    '.ds-icon { flex: none; color: var(--icon-color); vertical-align: middle; }',
    '.ds-icon.is-active { color: var(--icon-color-active); }',
    sw ? '/* 선 굵기 통일: CSS 속성이 SVG의 stroke-width 속성보다 우선합니다 */' : null,
    sw ? '.ds-icon [stroke], .ds-icon [stroke-width] { stroke-width: var(--icon-stroke); }' : null,
  ) });

  if (sys.css === 'tailwind') {
    blocks.push({ title: 'Tailwind v4 테마', file: 'app.css', code: lines(
      '@import "tailwindcss";', '', '@theme {',
      ...sizes.map((n) => `  --spacing-icon-${SIZE_KEY[n]}: ${n}px;  /* size-icon-${SIZE_KEY[n]} */`),
      `  --color-icon-active: ${sys.activeColor};  /* text-icon-active */`,
      '}',
    ) });
  }

  // 래퍼 컴포넌트
  const head = `허용 세트: ${L.label} (${p}). 화면에 쓰는 아이콘은 모두 이 컴포넌트를 거칩니다.`;
  if (fw === 'react') {
    blocks.push({ title: 'Icon 컴포넌트', file: 'Icon.tsx', code: lines(
      "import { Icon as Iconify } from '@iconify/react';",
      "import iconMap from './icon-map.json';",
      '',
      `// ${head}`,
      `const SIZE = { ${sizeObj} } as const;`,
      '',
      'export type IconName = keyof typeof iconMap;',
      '',
      'type Props = {',
      '  name: IconName;',
      '  size?: keyof typeof SIZE;',
      '  active?: boolean;',
      '  label?: string; // 아이콘만 있는 버튼일 때 스크린리더용 이름',
      '  className?: string;',
      '};',
      '',
      `export function Icon({ name, size = '${def}', active = false, label, className = '' }: Props) {`,
      '  const { base, active: filled } = iconMap[name];',
      '  return (',
      '    <Iconify',
      '      icon={active && filled ? filled : base}',
      '      width={SIZE[size]}',
      '      height={SIZE[size]}',
      "      className={`ds-icon${active ? ' is-active' : ''} ${className}`}",
      "      role={label ? 'img' : undefined}",
      '      aria-label={label}',
      '      aria-hidden={label ? undefined : true}',
      '    />',
      '  );',
      '}',
      '',
      '// 오프라인 빌드일 때 앱 진입점에서 한 번:',
      "// import { addCollection } from '@iconify/react';",
      `// import icons from '@iconify-json/${p}/icons.json';`,
      '// addCollection(icons);  // 세트 전체가 번들에 들어가므로, 쓰는 아이콘만 추린 JSON을 권장',
      '',
      '// 사용 예',
      "// <Icon name=\"home\" active={pathname === '/'} />",
      '// <button><Icon name="trash" label="삭제" /></button>',
    ) });
  } else if (fw === 'vue') {
    blocks.push({ title: 'Icon 컴포넌트', file: 'Icon.vue', code: lines(
      '<script setup lang="ts">',
      "import { computed } from 'vue';",
      "import { Icon as Iconify } from '@iconify/vue';",
      "import iconMap from './icon-map.json';",
      '',
      `// ${head}`,
      `const SIZE = { ${sizeObj} } as const;`,
      '',
      'const props = withDefaults(defineProps<{',
      '  name: keyof typeof iconMap;',
      '  size?: keyof typeof SIZE;',
      '  active?: boolean;',
      '  label?: string;',
      `}>(), { size: '${def}', active: false });`,
      '',
      'const id = computed(() => {',
      '  const { base, active } = iconMap[props.name];',
      '  return props.active && active ? active : base;',
      '});',
      '</script>',
      '',
      '<template>',
      '  <Iconify',
      '    :icon="id" :width="SIZE[size]" :height="SIZE[size]"',
      "    class=\"ds-icon\" :class=\"{ 'is-active': active }\"",
      "    :role=\"label ? 'img' : undefined\" :aria-label=\"label\" :aria-hidden=\"label ? undefined : true\"",
      '  />',
      '</template>',
    ) });
  } else if (fw === 'svelte') {
    blocks.push({ title: 'Icon 컴포넌트', file: 'Icon.svelte', code: lines(
      '<script lang="ts">',
      "  import Iconify from '@iconify/svelte';",
      "  import iconMap from './icon-map.json';",
      '',
      `  // ${head}`,
      `  const SIZE = { ${sizeObj} } as const;`,
      '',
      `  let { name, size = '${def}', active = false, label }: {`,
      '    name: keyof typeof iconMap; size?: keyof typeof SIZE; active?: boolean; label?: string;',
      '  } = $props();',
      '',
      '  const id = $derived(active && iconMap[name].active ? iconMap[name].active : iconMap[name].base);',
      '</script>',
      '',
      '<Iconify icon={id} width={SIZE[size]} height={SIZE[size]}',
      "  class=\"ds-icon {active ? 'is-active' : ''}\"",
      "  role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />",
    ) });
  } else if (fw !== 'flutter') {
    const ex = iconMap(sys).home;
    blocks.push({ title: '웹 컴포넌트 사용', file: 'index.html', code: lines(
      '<script type="module">import "iconify-icon";</script>',
      fw === 'angular' && '<!-- Angular: 모듈 또는 standalone 컴포넌트에 schemas: [CUSTOM_ELEMENTS_SCHEMA] 추가 -->',
      '',
      `<!-- ${head} 이름은 icon-map.json에서 가져옵니다 -->`,
      `<iconify-icon class="ds-icon" icon="${ex.base}" width="24" height="24" aria-hidden="true"></iconify-icon>`,
      ex.active
        ? `<iconify-icon class="ds-icon is-active" icon="${ex.active}" width="24" height="24" aria-hidden="true"></iconify-icon>`
        : '<!-- 이 세트는 Fill 변형이 없어 활성 상태는 is-active 색으로만 표시합니다 -->',
    ) });
  }

  blocks.push({ title: '의미 → 아이콘 이름표', file: 'icon-map.json', code: iconMapFile(sys),
    note: 'AI나 노코드 빌더에 “쓸 수 있는 아이콘 목록”으로 넘기기에도 좋습니다. 모델은 의미 키만 고르고, 실제 아이콘 이름은 이 표가 정합니다.' });
  blocks.push({ title: '라이선스 고지', file: 'ICON-LICENSE.txt', code: noticeText(sys) });
  return blocks;
}
