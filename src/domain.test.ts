import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoItems, exportItems, importItems, lexicalSearch, loadItems, makeItem, MAX_IMPORT_BYTES, saveItems, STORAGE_KEY } from './domain';
import type { Item } from './domain';

const first = (): Item => structuredClone(demoItems[0]);
const envelope = (items: unknown = [first()]) => ({
  format: 'amano-inventory', version: 1, exportedAt: '2026-10-02T00:00:00.000Z', items,
});

function memoryStorage(initial: string | null = null) {
  const data = new Map<string, string>();
  if (initial !== null) data.set(STORAGE_KEY, initial);
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
    clear: vi.fn(() => { data.clear(); }),
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('inventory format', () => {
  it('round-trips every demo item without sharing mutable tags', () => {
    const restored = importItems(exportItems(demoItems));
    expect(restored).toEqual(demoItems);
    expect(restored[0].tags).not.toBe(demoItems[0].tags);
  });

  it('accepts an intentionally empty inventory', () => {
    expect(importItems(exportItems([]))).toEqual([]);
  });

  it('creates an item with a generated id, ISO date and its own tags array', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-10-02T10:20:30.000Z'));
    const uuid = 'e7f4a18d-2e4e-426e-90f5-38335f219f00';
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => uuid) });
    const { id: _id, updatedAt: _updatedAt, ...input } = first();
    const made = makeItem(input);
    expect(made.id).toBe(uuid);
    expect(made.updatedAt).toBe('2026-10-02T10:20:30.000Z');
    expect(made.tags).not.toBe(input.tags);
  });

  it.each([
    ['invalid JSON', '{'],
    ['legacy array', '[]'],
    ['null', 'null'],
    ['unknown version', JSON.stringify({ ...envelope(), version: 2 })],
    ['wrong format', JSON.stringify({ ...envelope(), format: 'other-app' })],
    ['missing date', JSON.stringify({ format: 'amano-inventory', version: 1, items: [] })],
    ['unknown top-level key', JSON.stringify({ ...envelope(), overwrite: true })],
    ['invalid export date', JSON.stringify({ ...envelope(), exportedAt: 'yesterday' })],
    ['impossible calendar date', JSON.stringify({ ...envelope(), exportedAt: '2026-02-30T00:00:00.000Z' })],
    ['items object', JSON.stringify(envelope({ length: 0 }))],
  ])('rejects %s', (_label, json) => {
    expect(() => importItems(json)).toThrow();
  });

  it.each([
    ['id', ''], ['title', '   '], ['place', ''], ['title', 'x'.repeat(121)],
    ['description', 'x'.repeat(1201)], ['place', 'x'.repeat(161)], ['id', 'x'.repeat(129)],
    ['room', 'bano'], ['category', 'comida'], ['favorite', 'false'], ['favorite', 0],
    ['tags', [true]], ['tags', ['']], ['tags', ['x'.repeat(61)]], ['tags', Array(21).fill('tag')],
    ['tags', 'cables'], ['updatedAt', '2026-02-30T00:00:00.000Z'], ['updatedAt', 'tomorrow'],
    ['description', null],
  ])('rejects invalid item field %s (%j)', (field, value) => {
    expect(() => importItems(JSON.stringify(envelope([{ ...first(), [field]: value }])))).toThrow();
  });

  it('rejects duplicate IDs instead of silently overwriting one item', () => {
    expect(() => importItems(JSON.stringify(envelope([first(), { ...first(), title: 'Otro' }])))).toThrow(/duplicado/);
  });

  it('rejects prototype-pollution fields without modifying Object.prototype', () => {
    const bad = JSON.stringify(envelope()).replace('"title":', '"__proto__":{"polluted":true},"title":');
    expect(() => importItems(bad)).toThrow(/campos/);
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
  });

  it('rejects missing and unexpected item keys', () => {
    const { tags: _tags, ...withoutTags } = first();
    expect(() => importItems(JSON.stringify(envelope([withoutTags])))).toThrow(/campos/);
    expect(() => importItems(JSON.stringify(envelope([{ ...first(), constructor: 'malicious' }])))).toThrow(/campos/);
  });

  it('accepts 200 items and rejects 201, including on export', () => {
    const items = Array.from({ length: 200 }, (_, i) => ({ ...first(), id: `item-${i}` }));
    expect(importItems(exportItems(items))).toHaveLength(200);
    items.push({ ...first(), id: 'item-200' });
    expect(() => importItems(JSON.stringify(envelope(items)))).toThrow(/200/);
    expect(() => exportItems(items)).toThrow(/200/);
  });

  it('checks bytes rather than just character count before parsing', () => {
    const oversizedUtf8 = 'é'.repeat(MAX_IMPORT_BYTES / 2 + 1);
    expect(oversizedUtf8.length).toBeLessThan(MAX_IMPORT_BYTES);
    expect(() => importItems(oversizedUtf8)).toThrow(/2 MiB/);
  });

  it('keeps user text as text; it does not claim to sanitize HTML', () => {
    const item = { ...first(), description: '<img src=x onerror=alert(1)>' };
    expect(importItems(exportItems([item]))[0].description).toBe(item.description);
  });
});

describe('local persistence', () => {
  it('distinguishes first visit from a saved empty inventory', () => {
    memoryStorage();
    expect(loadItems()).toBeNull();
    saveItems([]);
    expect(loadItems()).toEqual([]);
  });

  it('saves and reads validated data using only its own key', () => {
    const storage = memoryStorage();
    saveItems(demoItems);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(loadItems()).toEqual(demoItems);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('does not save, delete or replace anything when importing', () => {
    const storage = memoryStorage(exportItems([first()]));
    importItems(exportItems([]));
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(loadItems()).toHaveLength(1);
  });

  it('preserves corrupt saved data and reports recovery guidance', () => {
    const storage = memoryStorage('{broken');
    expect(() => loadItems()).toThrow(/No se ha borrado ni reemplazado/);
    expect(storage.getItem(STORAGE_KEY)).toBe('{broken');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('reports blocked storage reads without pretending it is a first visit', () => {
    const storage = memoryStorage();
    storage.getItem.mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    expect(() => loadItems()).toThrow(/permisos/);
  });

  it('reports quota errors and keeps the previously saved inventory', () => {
    const previous = exportItems([first()]);
    const storage = memoryStorage(previous);
    storage.setItem.mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    expect(() => saveItems([])).toThrow(/Exporta una copia/);
    expect(storage.getItem(STORAGE_KEY)).toBe(previous);
  });

  it('rejects bad data before any storage write', () => {
    const storage = memoryStorage();
    expect(() => saveItems([first(), first()])).toThrow(/duplicado/);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects sparse lists and tags before JSON can turn their holes into null', () => {
    const storage = memoryStorage();
    expect(() => saveItems(new Array<Item>(1))).toThrow();
    expect(() => saveItems([{ ...first(), tags: new Array<string>(1) }])).toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('literal Spanish search', () => {
  it('matches accents and case consistently', () => {
    const results = lexicalSearch(demoItems, 'GARANTIAS');
    expect(results[0]?.id).toBe('demo-garantias');
    expect(lexicalSearch(demoItems, 'garantías')).toEqual(results);
  });

  it('matches location and room labels', () => {
    expect(lexicalSearch(demoItems, 'estuche gris').map(({ id }) => id)).toEqual(['demo-adaptador-usbc']);
    expect(lexicalSearch(demoItems, 'entrada').map(({ id }) => id)).toEqual(['demo-paraguas']);
  });

  it('finds use descriptions without needing a title match', () => {
    expect(lexicalSearch(demoItems, 'proyectar').map(({ id }) => id)).toEqual(['demo-adaptador-usbc']);
    expect(lexicalSearch(demoItems, '¿Dónde está la cinta para medir?')[0]?.id).toBe('demo-cinta-metrica');
  });

  it('allows useful prefixes but not arbitrary middle-of-word substrings', () => {
    expect(lexicalSearch(demoItems, 'recarg')[0]?.id).toBe('demo-pilas');
    expect(lexicalSearch(demoItems, 'argab')).toEqual([]);
    expect(lexicalSearch(demoItems, 're')).toEqual([]);
  });

  it('requires every meaningful term and returns no invented semantic matches', () => {
    expect(lexicalSearch(demoItems, 'adaptador cocina')).toEqual([]);
    expect(lexicalSearch(demoItems, 'telescopio')).toEqual([]);
    expect(lexicalSearch(demoItems, 'proyectar')).not.toEqual([]);
  });

  it('returns no results for an empty or stop-word-only query', () => {
    expect(lexicalSearch(demoItems, '   ')).toEqual([]);
    expect(lexicalSearch(demoItems, '¿Dónde está?')).toEqual([]);
  });

  it('ranks name matches above descriptions and resolves ties deterministically', () => {
    const items = [
      { ...first(), id: 'description', title: 'Una cosa', description: 'Tiene cable.' },
      { ...first(), id: 'title1', title: 'Cable', description: '' },
      { ...first(), id: 'title2', title: 'Cable', description: '' },
    ];
    expect(lexicalSearch(items, 'cable').map(({ id }) => id)).toEqual(['title1', 'title2', 'description']);
  });
});
