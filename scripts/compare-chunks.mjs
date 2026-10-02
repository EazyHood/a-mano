import { pipeline, env } from '@huggingface/transformers';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const baselineBytes = await readFile(path.join(root, 'artifacts/product-benchmark.json'));
const baseline = JSON.parse(baselineBytes);
const fixture = baseline.method.fixture;
const fixtureBefore = JSON.stringify(fixture);
const originalCases = baseline.results.map(({ id, kind, language, query, expectedIds }) => ({ id, kind, language, query, expectedIds, cohort: 'original' }));
// Defined before inference; these controls are not edits of failed queries.
const newCases = [
  { id: 'control-tv', kind: 'positive', language: 'es', query: 'quiero mostrar una presentación del ordenador en una pantalla externa', expectedIds: ['demo-adaptador-usbc'], cohort: 'new-control' },
  { id: 'control-sewing', kind: 'positive', language: 'es', query: 'necesito volver a sujetar el botón que se desprendió de mi chaqueta', expectedIds: ['demo-costura'], cohort: 'new-control' },
  { id: 'control-cat-food', kind: 'absent', language: 'es', query: '¿dónde guardé las croquetas para darle de comer al gato?', expectedIds: [], cohort: 'new-control' },
  { id: 'control-passport', kind: 'absent', language: 'es', query: 'busco el documento de identidad para cruzar la frontera', expectedIds: [], cohort: 'new-control' },
];
const cases = [...originalCases, ...newCases];
const bundled = await build({ stdin: { contents: "export { lexicalSearch } from './src/domain.ts'; export { mergeSearch } from './src/searchRanking.ts';", resolveDir: root, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm', target: 'node24' });
const { lexicalSearch, mergeSearch } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

function chunksFor(item) {
  const seen = new Set();
  const chunks = [];
  const add = (type, text) => {
    text = text.trim();
    if (!text || seen.has(text)) return;
    seen.add(text); chunks.push({ type, text });
  };
  add('title-and-tags', `${item.title}. ${item.tags.join(', ')}`);
  add('description', item.description);
  for (const text of item.description.split(/[.!?;:,\n]+/u)) add('clause', text);
  return chunks;
}

env.cacheDir = path.join(root, '.cache/models');
env.allowRemoteModels = false;
const originalFetch = globalThis.fetch;
const attemptedFetches = [];
globalThis.fetch = async (...args) => { attemptedFetches.push(String(args[0])); throw new Error('Network is disabled for this cached-only experiment.'); };
let extractor;
try {
  const t0 = performance.now();
  extractor = await pipeline('feature-extraction', baseline.method.model, {
    revision: baseline.method.revision, dtype: 'q8', device: 'cpu', local_files_only: true,
  });
  const loadedMs = performance.now() - t0;
  const vectorCache = new Map();
  const vector = async text => {
    if (!vectorCache.has(text)) vectorCache.set(text, Array.from((await extractor(text, { pooling: 'mean', normalize: true })).data));
    return vectorCache.get(text);
  };
  const indexingStart = performance.now();
  const docs = [];
  for (const item of fixture) {
    const concatenatedText = `${item.title}. ${item.description}. ${item.tags.join(', ')}`;
    const chunks = chunksFor(item);
    for (const chunk of chunks) chunk.vector = await vector(chunk.text);
    docs.push({ id: item.id, concatenatedVector: await vector(concatenatedText), chunks });
  }
  const indexingMs = performance.now() - indexingStart;
  const threshold = baseline.method.threshold;
  const results = [];
  for (const test of cases) {
    const started = performance.now();
    const queryVector = await vector(test.query.slice(0, 240));
    const cosine = embedding => embedding.reduce((sum, value, i) => sum + value * queryVector[i], 0);
    const concatRanking = docs.map(doc => ({ id: doc.id, score: cosine(doc.concatenatedVector) })).sort((a, b) => b.score - a.score);
    const chunkRanking = docs.map(doc => {
      const ranked = doc.chunks.map(({ type, text, vector: embedding }) => ({ type, text, score: cosine(embedding) })).sort((a, b) => b.score - a.score);
      return { id: doc.id, score: ranked[0].score, bestFragment: ranked[0], fragmentScores: ranked };
    }).sort((a, b) => b.score - a.score);
    const concatCandidates = concatRanking.filter(row => row.score >= threshold);
    const chunkCandidates = chunkRanking.filter(row => row.score >= threshold);
    const literal = lexicalSearch(fixture, test.query);
    const concatMerged = mergeSearch(fixture, test.query, concatCandidates);
    const chunkMerged = mergeSearch(fixture, test.query, chunkCandidates);
    const evaluate = ranking => test.kind === 'positive' ? {
      top1Hit: test.expectedIds.includes(ranking[0]?.id), candidateHit: ranking.some(row => test.expectedIds.includes(row.id)),
    } : test.kind === 'absent' ? { abstained: ranking.length === 0 } : { scored: false };
    const originalBaseline = baseline.results.find(row => row.id === test.id);
    const baselineMaxDifference = originalBaseline ? Math.max(...concatRanking.map(row => Math.abs(row.score - originalBaseline.allSemantic.find(old => old.id === row.id).score))) : null;
    results.push({ ...test, concatRanking, chunkRanking, concatCandidates, chunkCandidates, literal, concatMerged, chunkMerged,
      evaluation: { concat: evaluate(concatMerged), chunks: evaluate(chunkMerged) }, baselineMaxDifference, elapsedMs: performance.now() - started });
    console.log(`${test.id}: concat=${concatCandidates.map(r => r.id).join(',') || '(none)'} chunks=${chunkCandidates.map(r => `${r.id}:${r.score.toFixed(3)}`).join(',') || '(none)'}`);
  }
  const stats = cohort => {
    const subset = results.filter(r => cohort === 'all' || r.cohort === cohort);
    const positives = subset.filter(r => r.kind === 'positive');
    const negatives = subset.filter(r => r.kind === 'absent');
    return { cohort, cases: subset.length, positives: positives.length, absent: negatives.length,
      concatMergedTop1Hits: positives.filter(r => r.evaluation.concat.top1Hit).length,
      chunkMergedTop1Hits: positives.filter(r => r.evaluation.chunks.top1Hit).length,
      concatMergedCandidateHits: positives.filter(r => r.evaluation.concat.candidateHit).length,
      chunkMergedCandidateHits: positives.filter(r => r.evaluation.chunks.candidateHit).length,
      concatAbsentAbstentions: negatives.filter(r => r.evaluation.concat.abstained).length,
      chunkAbsentAbstentions: negatives.filter(r => r.evaluation.chunks.abstained).length,
    };
  };
  const output = {
    date: new Date().toISOString(), status: 'completed',
    experiment: 'One structural representation: max similarity over title+tags, description, and punctuation-delimited description clauses. No synonym expansion or data edits.',
    model: baseline.method.model, revision: baseline.method.revision, dtype: 'q8', threshold,
    runtime: 'Transformers.js 3.8.1 / Node CPU', pooling: 'mean', normalize: true,
    baselineArtifactSha256: sha256(baselineBytes), fixtureSha256: sha256(fixtureBefore),
    sameFixture: sha256(fixtureBefore) === baseline.method.fixtureSha256,
    sameOriginalCasesAndOrder: originalCases.every((test, i) => test.id === baseline.results[i].id && test.query === baseline.results[i].query),
    definition: { split: '[.!?;:,\\n]+', deduplicate: 'Exact trimmed text within each object', aggregate: 'maximum cosine similarity', minimumLength: 'non-empty', includeLocation: false },
    itemFragments: docs.map(doc => ({ id: doc.id, fragments: doc.chunks.map(({ type, text }) => ({ type, text })) })),
    loadedMs, indexingMs, totalFragmentCount: docs.reduce((sum, doc) => sum + doc.chunks.length, 0),
    attemptedFetches, fixtureUnchanged: JSON.stringify(fixture) === fixtureBefore,
    summary: [stats('original'), stats('new-control'), stats('all')], results,
  };
  await writeFile(path.join(root, 'artifacts/chunk-comparison.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output.summary, null, 2));
} finally {
  if (extractor) await extractor.dispose();
  globalThis.fetch = originalFetch;
}
