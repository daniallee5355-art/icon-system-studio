// 전체 검색용 세트 데이터 (public/sets/<prefix>.json)를 필요할 때만 받아 둔다
import { useEffect, useState } from 'react';
import type { IconData, Prefix } from './data';

interface SetFile { prefix: Prefix; width: number; height: number; icons: Record<string, string | IconData> }

export interface LoadedSet {
  prefix: Prefix;
  names: string[];
  has: (name: string) => boolean;
  get: (name: string) => IconData | null;
}

const cache = new Map<Prefix, Promise<LoadedSet>>();

export function loadSet(p: Prefix): Promise<LoadedSet> {
  let pr = cache.get(p);
  if (!pr) {
    pr = fetch(`${import.meta.env.BASE_URL}sets/${p}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`세트 파일을 받지 못했습니다 (${r.status}). npm run data를 실행했는지 확인하세요.`);
        return r.json() as Promise<SetFile>;
      })
      .then((f) => ({
        prefix: p,
        names: Object.keys(f.icons),
        has: (n) => n in f.icons,
        get: (n) => {
          const v = f.icons[n];
          if (v == null) return null;
          return typeof v === 'string' ? [f.width, f.height, v] : v;
        },
      }));
    pr.catch(() => cache.delete(p));
    cache.set(p, pr);
  }
  return pr;
}

export type SetState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; set: LoadedSet };

export function useIconSet(p: Prefix | null): SetState {
  const [state, setState] = useState<SetState>({ status: 'loading' });
  useEffect(() => {
    if (!p) return;
    let alive = true;
    setState({ status: 'loading' });
    loadSet(p).then(
      (set) => alive && setState({ status: 'ready', set }),
      (e: Error) => alive && setState({ status: 'error', message: e.message }),
    );
    return () => { alive = false; };
  }, [p]);
  return state;
}
