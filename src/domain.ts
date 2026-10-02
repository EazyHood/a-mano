export type RoomId = 'entrada' | 'estudio' | 'cocina' | 'armario' | 'trastero';
export type Category = 'tecnologia' | 'herramientas' | 'documentos' | 'hogar';

export interface Item {
  id: string;
  title: string;
  category: Category;
  room: RoomId;
  place: string;
  description: string;
  tags: string[];
  favorite: boolean;
  updatedAt: string;
}

export const rooms: { id: RoomId; label: string }[] = [
  { id: 'entrada', label: 'Entrada' },
  { id: 'estudio', label: 'Estudio' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'armario', label: 'Armario' },
  { id: 'trastero', label: 'Trastero' },
];

export const categories: { id: Category; label: string }[] = [
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'hogar', label: 'Hogar' },
];

export const STORAGE_KEY = 'amano.items.v1';
export const MAX_ITEMS = 200;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const FORMAT = 'amano-inventory';
const VERSION = 1;
const itemKeys = ['id', 'title', 'category', 'room', 'place', 'description', 'tags', 'favorite', 'updatedAt'];
const roomIds = new Set<string>(rooms.map(({ id }) => id));
const categoryIds = new Set<string>(categories.map(({ id }) => id));

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new Error(`${field}: se esperaba un objeto.`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[], field: string): void {
  if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${field}: faltan campos o contiene campos no admitidos.`);
  }
}

function stringField(value: unknown, max: number, field: string, required = true): string {
  if (typeof value !== 'string' || value.length > max || (required && value.trim().length === 0)) {
    throw new Error(`${field}: debe ser texto${required ? ' no vacío' : ''} de hasta ${max} caracteres.`);
  }
  return value;
}

function isoDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${field}: fecha ISO no válida.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field}: fecha ISO no válida.`);
  }
  return value;
}

function validateItem(input: unknown, position: number): Item {
  const field = `Objeto ${position + 1}`;
  const value = record(input, field);
  exactKeys(value, itemKeys, field);
  if (typeof value.room !== 'string' || !roomIds.has(value.room)) {
    throw new Error(`${field}: habitación no admitida.`);
  }
  if (typeof value.category !== 'string' || !categoryIds.has(value.category)) {
    throw new Error(`${field}: categoría no admitida.`);
  }
  if (typeof value.favorite !== 'boolean') throw new Error(`${field}: favorito debe ser verdadero o falso.`);
  if (!Array.isArray(value.tags) || value.tags.length > 20) {
    throw new Error(`${field}: admite hasta 20 etiquetas de texto.`);
  }
  return {
    id: stringField(value.id, 128, `${field}, identificador`),
    title: stringField(value.title, 120, `${field}, nombre`),
    category: value.category as Category,
    room: value.room as RoomId,
    place: stringField(value.place, 160, `${field}, ubicación`),
    description: stringField(value.description, 1200, `${field}, descripción`, false),
    tags: Array.from(value.tags, (tag, i) => stringField(tag, 60, `${field}, etiqueta ${i + 1}`)),
    favorite: value.favorite,
    updatedAt: isoDate(value.updatedAt, `${field}, actualización`),
  };
}

function validateItems(input: unknown): Item[] {
  if (!Array.isArray(input) || input.length > MAX_ITEMS) {
    throw new Error(`El inventario debe ser una lista de hasta ${MAX_ITEMS} objetos.`);
  }
  const seen = new Set<string>();
  return Array.from(input, (value, index) => {
    const item = validateItem(value, index);
    if (seen.has(item.id)) throw new Error(`Objeto ${index + 1}: identificador duplicado.`);
    seen.add(item.id);
    return item;
  });
}

function assertSize(json: string): void {
  if (json.length > MAX_IMPORT_BYTES || new TextEncoder().encode(json).byteLength > MAX_IMPORT_BYTES) {
    throw new Error('El archivo supera el límite de 2 MiB.');
  }
}

export function makeItem(input: Omit<Item, 'id' | 'updatedAt'>): Item {
  return validateItem({ ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }, 0);
}

/** Validates and returns a fresh inventory. It never writes to storage. */
export function importItems(json: string): Item[] {
  if (typeof json !== 'string') throw new Error('El archivo debe contener texto JSON.');
  assertSize(json);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('No se pudo leer el archivo: el JSON no es válido.');
  }
  const envelope = record(parsed, 'Archivo');
  exactKeys(envelope, ['format', 'version', 'exportedAt', 'items'], 'Archivo');
  if (envelope.format !== FORMAT || envelope.version !== VERSION) {
    throw new Error('El archivo no es una exportación compatible de A mano (versión 1).');
  }
  isoDate(envelope.exportedAt, 'Fecha de exportación');
  return validateItems(envelope.items);
}

export function exportItems(items: Item[]): string {
  const checked = validateItems(items);
  const json = JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), items: checked }, null, 2);
  assertSize(json);
  return json;
}

export function loadItems(): Item[] | null {
  let json: string | null;
  try {
    json = globalThis.localStorage.getItem(STORAGE_KEY);
  } catch (cause) {
    throw new Error('No se puede leer el almacenamiento de este navegador. Comprueba sus permisos.', { cause });
  }
  if (json === null) return null;
  try {
    return importItems(json);
  } catch (cause) {
    throw new Error('El inventario guardado no se pudo leer. No se ha borrado ni reemplazado; conserva una copia antes de restaurarlo.', { cause });
  }
}

export function saveItems(items: Item[]): void {
  const json = exportItems(items);
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, json);
  } catch (cause) {
    throw new Error('No se pudo guardar el inventario en este navegador. Exporta una copia y comprueba el espacio o los permisos.', { cause });
  }
}

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
}

function words(value: string): string[] {
  return normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

const stopWords = new Set(['a', 'al', 'con', 'de', 'del', 'donde', 'el', 'en', 'es', 'esta', 'estan', 'la', 'las', 'lo', 'los', 'mi', 'mis', 'para', 'por', 'que', 'se', 'su', 'sus', 'un', 'una', 'unos', 'unas', 'y']);

/** Literal word/prefix matching; semantic matches belong to the separate AI layer. */
export function lexicalSearch(items: Item[], query: string): { id: string; score: number }[] {
  const terms = [...new Set(words(query).filter((word) => !stopWords.has(word)))];
  if (terms.length === 0) return [];
  return items.flatMap((item, index) => {
    const fields = [
      { tokens: words(item.title), weight: 6 },
      { tokens: words(item.tags.join(' ')), weight: 5 },
      { tokens: words(item.place), weight: 3 },
      { tokens: words(item.description), weight: 2 },
      { tokens: words(rooms.find(({ id }) => id === item.room)?.label ?? item.room), weight: 1 },
    ];
    let score = 0;
    for (const term of terms) {
      let best = 0;
      for (const { tokens, weight } of fields) {
        if (tokens.includes(term)) best = Math.max(best, weight);
        else if (term.length >= 3 && tokens.some((token) => token.startsWith(term))) best = Math.max(best, weight * 0.7);
      }
      if (best === 0) return [];
      score += best;
    }
    return [{ id: item.id, score, index }];
  }).sort((a, b) => b.score - a.score || a.index - b.index).map(({ id, score }) => ({ id, score }));
}

const demoUpdatedAt = '2026-10-02T00:00:00.000Z';

/** Synthetic sample inventory, not a record of anyone's belongings. */
export const demoItems: Item[] = [
  {
    id: 'demo-adaptador-usbc', title: 'Adaptador USB-C a HDMI', category: 'tecnologia', room: 'estudio',
    place: 'Cajón superior del escritorio · estuche gris',
    description: 'Conecta el portátil a una pantalla, televisor o proyector. Sirve para proyectar una presentación; necesita un cable HDMI aparte.',
    tags: ['adaptador', 'pantalla', 'presentación', 'vídeo'], favorite: true, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-llaves-allen', title: 'Juego de llaves Allen', category: 'herramientas', room: 'trastero',
    place: 'Estante central · caja roja de herramientas',
    description: 'Llaves hexagonales de varios tamaños para montar y ajustar muebles, apretar el escritorio o reparar la silla.',
    tags: ['montar muebles', 'tornillos', 'hexagonal'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-cinta-metrica', title: 'Cinta métrica de 5 metros', category: 'herramientas', room: 'trastero',
    place: 'Estante central · bolsillo exterior de la caja roja',
    description: 'Para medir una pared, comprobar si cabe un mueble o calcular el ancho de una ventana antes de comprar cortinas.',
    tags: ['medir', 'medidas', 'cortinas'], favorite: true, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-bombilla', title: 'Bombilla LED de repuesto', category: 'hogar', room: 'armario',
    place: 'Balda superior · caja blanca de repuestos',
    description: 'Bombilla de luz cálida con rosca E27. Repuesto para la lámpara del salón cuando se funda; comprobar siempre el casquillo.',
    tags: ['iluminación', 'lámpara', 'luz'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-pilas', title: 'Pilas AA recargables', category: 'tecnologia', room: 'estudio',
    place: 'Cajón inferior del escritorio · caja transparente',
    description: 'Cuatro pilas AA y su cargador para el ratón inalámbrico, juguetes o aparatos compatibles. No son del tamaño AAA del mando pequeño.',
    tags: ['baterías', 'cargador', 'ratón'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-garantias', title: 'Carpeta de garantías', category: 'documentos', room: 'estudio',
    place: 'Estantería izquierda · archivador azul',
    description: 'Carpeta de ejemplo con facturas y garantías de electrodomésticos. Permite localizar el comprobante de compra antes de pedir una reparación.',
    tags: ['facturas', 'comprobantes', 'reparación'], favorite: true, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-manual-horno', title: 'Manual del horno', category: 'documentos', room: 'cocina',
    place: 'Cajón junto al horno · separador del fondo',
    description: 'Guía de ejemplo de símbolos, temporizador y limpieza del horno. Consultar para reconocer los modos de cocción.',
    tags: ['instrucciones', 'cocción', 'temporizador'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-regleta', title: 'Regleta con cable largo', category: 'tecnologia', room: 'trastero',
    place: 'Estante inferior · cesta negra de cables',
    description: 'Alargador con tres enchufes para acercar una toma al escritorio. Revisar la potencia permitida en su etiqueta antes de conectar aparatos.',
    tags: ['enchufes', 'alargador', 'electricidad'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-paraguas', title: 'Paraguas plegable', category: 'hogar', room: 'entrada',
    place: 'Mueble recibidor · cesta de la derecha',
    description: 'Paraguas compacto azul para llevar en la mochila cuando anuncian lluvia. Dejarlo secar abierto después de usarlo.',
    tags: ['lluvia', 'mochila', 'salir'], favorite: false, updatedAt: demoUpdatedAt,
  },
  {
    id: 'demo-costura', title: 'Kit de costura', category: 'herramientas', room: 'armario',
    place: 'Segundo cajón · lata pequeña de galletas',
    description: 'Agujas, hilo negro y blanco, botones de repuesto y tijeras pequeñas para coser un botón o arreglar un descosido.',
    tags: ['ropa', 'botón', 'hilo', 'reparar'], favorite: false, updatedAt: demoUpdatedAt,
  },
];
