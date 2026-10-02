import { lexicalSearch } from './domain';
import type { Item } from './domain';
export function mergeSearch(items: Item[], query: string, semantic: {id: string; score: number}[]) {
  const literal = lexicalSearch(items, query);
  const seen = new Set(literal.map(r => r.id));
  return [...literal, ...semantic.filter(r => !seen.has(r.id))];
}
