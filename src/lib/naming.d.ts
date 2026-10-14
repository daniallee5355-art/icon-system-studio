export type Prefix = 'lucide' | 'heroicons' | 'ph' | 'tabler' | 'ri' | 'carbon' | 'iconoir' | 'material-symbols' | 'bi';

export interface Variants {
  base: string | null;
  active: string | null;
  mini?: string | null;
  micro?: string | null;
  thin?: string | null;
  light?: string | null;
  bold?: string | null;
  duotone?: string | null;
  ligature?: string;
}

export const PREFIXES: Prefix[];
export const STEM: Record<Prefix, (name: string) => string>;
export function variants(p: Prefix, base: string, has: (name: string) => boolean): Variants;
export function familyOf(p: Prefix, name: string, has: (name: string) => boolean): Variants & { stem: string; base: string };
