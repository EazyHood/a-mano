import { describe, it, expect } from 'vitest';
import { demoItems } from './domain';
import { mergeSearch } from './searchRanking';
describe('search preserves recorded facts', () => {
  it('retains exact recorded location when embeddings return no result', () => {
    const item = demoItems[0];
    expect(mergeSearch(demoItems, item.place, []).some(r=>r.id===item.id)).toBe(true);
  });
  it('never duplicates an exact match and retains lower-ranked candidates for later filters', () => {
    const item = demoItems[0];
    const all = demoItems.map((i,n)=>({id:i.id,score:1-n/100}));
    const result=mergeSearch(demoItems,item.title,all);
    expect(result[0].id).toBe(item.id);
    expect(new Set(result.map(r=>r.id)).size).toBe(demoItems.length);
    expect(result.length).toBe(demoItems.length);
  });
});
