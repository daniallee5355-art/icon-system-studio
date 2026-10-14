import type { CSSProperties } from 'react';
import { DATA, type IconData } from '../lib/data';

interface Props {
  data: IconData | null | undefined;
  size: number | string;
  /** 선 굵기를 덮어쓸 값. null이면 SVG에 적힌 값 그대로 */
  sw?: number | null;
  className?: string;
}

/** Iconify 형식의 [width, height, body]를 인라인 SVG로 그린다. body는 빌드 때 아이콘 패키지에서 가져온 신뢰된 데이터다. */
export function IconSvg({ data, size, sw = null, className = '' }: Props) {
  if (!data) return null;
  const [w, h, body] = data;
  const style = sw != null ? ({ '--sw': sw } as CSSProperties) : undefined;
  return (
    <svg
      className={`i${sw != null ? ' swx' : ''}${className ? ' ' + className : ''}`}
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={size}
      aria-hidden="true"
      style={style}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** 앱에 번들된 아이콘을 "prefix:name" 키로 그린다 */
export function Icon({ k, ...rest }: Omit<Props, 'data'> & { k: string }) {
  return <IconSvg data={DATA.icons[k]} {...rest} />;
}
