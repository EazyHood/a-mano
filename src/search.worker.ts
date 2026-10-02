/// <reference lib="webworker" />
import { env, pipeline } from '@huggingface/transformers';
import { MODEL_ID, MODEL_REVISION, SEMANTIC_THRESHOLD } from './modelConfig';
import type { Item } from './domain';

// Only public model/runtime assets leave the origin. User text is passed directly
// to ONNX in this worker, never sent to a hosted inference endpoint.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.numThreads = 1;
let extractor: any;
let loading: Promise<any> | null = null;
let index: { id: string; vector: number[] }[] = [];
const vectorCache = new Map<string, number[]>();
let queue: Promise<void> = Promise.resolve();

const post = (message: unknown) => self.postMessage(message);
async function model() {
  if (extractor) return extractor;
  if (!loading) loading = pipeline('feature-extraction', MODEL_ID, {
    revision: MODEL_REVISION, dtype: 'q8', device: 'wasm',
    progress_callback: (event: any) => {
      post({ type: 'progress', progress: event.file?.includes('onnx') && typeof event.progress === 'number' ? event.progress : null });
    },
  });
  try { extractor = await loading; return extractor; }
  catch (error) { loading = null; throw error; }
}

async function vector(text: string) {
  const cached = vectorCache.get(text);
  if (cached) return cached;
  const pipe = await model();
  const out = await pipe(text, { pooling: 'mean', normalize: true });
  const values = Array.from(out.data as Float32Array);
  // A small bounded session cache; deleting a record triggers a fresh worker
  // index and never exposes a location that isn't in the current collection.
  if (vectorCache.size > 600) vectorCache.clear();
  vectorCache.set(text, values);
  return values;
}

async function handle(data: any) {
  const { type, version, requestId } = data;
  try {
    if (type === 'index') {
      await model();
      post({ type: 'indexing', version });
      const next = [];
      for (const item of data.items as Item[]) {
        const text = `${item.title}. ${item.description}. ${item.tags.join(', ')}`;
        next.push({ id: item.id, vector: await vector(text) });
      }
      index = next;
      post({ type: 'ready', version });
    } else if (type === 'search') {
      const query = await vector(String(data.query).slice(0, 240));
      const results = index.map(({ id, vector: v }) => ({
        id, score: v.reduce((sum, x, i) => sum + x * query[i], 0),
      })).filter(({ score }) => score >= SEMANTIC_THRESHOLD)
        .sort((a, b) => b.score - a.score);
      post({ type: 'results', version, requestId, results });
    }
  } catch {
    post({ type: 'error', version, requestId,
      error: 'No se pudo cargar o ejecutar el modelo. Revisa tu conexión y prueba de nuevo. La búsqueda por palabras sigue disponible.' });
  }
}
self.onmessage = ({ data }) => { queue = queue.then(() => handle(data)); };
