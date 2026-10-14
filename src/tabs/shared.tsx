import { LIB, type Prefix } from '../lib/data';
import { staleCustom, type IconSystem } from '../lib/system';
import { useStore } from '../store';

/** 허용 세트를 바꾼다. 다른 세트에서 추가한 팀 항목이 있으면 알려 준다. */
export function useSetLib() {
  const { setSys, setUi, toast, sys } = useStore();
  return (p: Prefix, extra: Partial<IconSystem> = {}) => {
    const next = { ...sys, ...extra, set: p };
    setSys((s) => ({ ...s, ...extra, set: p }));
    setUi((u) => ({ pick: { c: u.pick.c, p } }));
    const stale = staleCustom(next).length;
    toast(stale
      ? `${LIB[p].label}을(를) 허용 세트로 지정했습니다. 다른 세트에서 추가한 팀 항목 ${stale}개는 내보내기에서 빠집니다.`
      : `${LIB[p].label}을(를) 허용 세트로 지정했습니다`);
  };
}

/** 24px 키라인 그리드 (viewBox 단위로 맞춘다) */
export function KeylineGrid({ w }: { w: number }) {
  const div = w === 256 ? 16 : w;
  const step = w / div, k = w / 24;
  const lines = [];
  for (let i = 1; i < div; i++) {
    const v = +(i * step).toFixed(2);
    lines.push(<path key={i} d={`M${v} 0V${w}M0 ${v}H${w}`} stroke={`var(${i % 4 === 0 ? '--grid-strong' : '--grid'})`} strokeWidth={w / 240} />);
  }
  const kl = { stroke: 'var(--keyline)', strokeWidth: w / 160, fill: 'none' };
  return (
    <svg viewBox={`0 0 ${w} ${w}`} aria-hidden="true">
      <rect x={0} y={0} width={w} height={w} fill="none" stroke="var(--grid-strong)" strokeWidth={w / 120} />
      {lines}
      <rect x={2 * k} y={2 * k} width={20 * k} height={20 * k} {...kl} strokeDasharray={`${w / 60} ${w / 80}`} />
      <circle cx={w / 2} cy={w / 2} r={10 * k} {...kl} />
      <rect x={3 * k} y={3 * k} width={18 * k} height={18 * k} {...kl} />
    </svg>
  );
}
