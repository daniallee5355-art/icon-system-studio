// 세트별 아이콘 이름 규칙. 데이터 빌드 스크립트(Node)와 앱(브라우저)이 함께 쓴다.

export const PREFIXES = ['lucide', 'heroicons', 'ph', 'tabler', 'ri', 'carbon', 'iconoir', 'material-symbols', 'bi'];

// 스타일 변형 접미사를 떼어 "고유 형태" 이름을 얻는다
export const STEM = {
  lucide: (n) => n,
  heroicons: (n) => n.replace(/-(20-solid|16-solid|solid)$/, ''),
  ph: (n) => n.replace(/-(thin|light|bold|fill|duotone)$/, ''),
  tabler: (n) => n.replace(/-filled$/, ''),
  ri: (n) => n.replace(/-(line|fill)$/, ''),
  carbon: (n) => n.replace(/-filled$/, ''),
  iconoir: (n) => n.replace(/-solid$/, ''),
  'material-symbols': (n) => n.replace(/-(outline|rounded|sharp)(-(rounded|sharp))?$/, '').replace(/-(outline|rounded|sharp)$/, ''),
  bi: (n) => n.replace(/-fill$/, ''),
};

// 고유 형태 이름 b에서 기본형(base)·활성형(active)과 추가 변형을 찾는다. has(name)은 세트에 이름이 있는지 알려 준다.
export function variants(p, b, has) {
  const pick = (...c) => c.find((n) => has(n)) || null;
  switch (p) {
    case 'heroicons': return { base: pick(b), active: pick(`${b}-solid`), mini: pick(`${b}-20-solid`), micro: pick(`${b}-16-solid`) };
    case 'ph': return { base: pick(b), active: pick(`${b}-fill`), thin: pick(`${b}-thin`), light: pick(`${b}-light`), bold: pick(`${b}-bold`), duotone: pick(`${b}-duotone`) };
    case 'tabler': return { base: pick(b), active: pick(`${b}-filled`) };
    case 'ri': return { base: pick(`${b}-line`, b), active: pick(`${b}-fill`) };
    case 'carbon': return { base: pick(b), active: pick(`${b}-filled`) };
    case 'iconoir': return { base: pick(b), active: pick(`${b}-solid`) };
    case 'material-symbols': {
      const outline = has(`${b}-outline`);
      return { base: pick(`${b}-outline`, b), active: outline ? pick(b) : null, ligature: b.replace(/-/g, '_') };
    }
    case 'bi': return { base: pick(b), active: pick(`${b}-fill`) };
    default: return { base: pick(b), active: null };
  }
}

// 검색에서 고른 아이콘 하나가 속한 변형 묶음
export function familyOf(p, name, has) {
  const stem = STEM[p](name);
  const v = variants(p, stem, has);
  if (!v.base) v.base = name;
  return { stem, ...v };
}
