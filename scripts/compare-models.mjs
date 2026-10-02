import { pipeline, env } from '@huggingface/transformers';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const baselineBytes = await readFile(path.join(root, 'artifacts/product-benchmark.json'));
const baseline = JSON.parse(baselineBytes);
const fixture = baseline.method.fixture;
const fixtureBefore = JSON.stringify(fixture);
const model = 'Xenova/multilingual-e5-small';
const revision = '761b726dd34fb83930e26aab4e9ac3899aa1fa78';
const cache = path.join(root, '.cache/models');
const assets = [
  { file: 'config.json', bytes: 658 },
  { file: 'tokenizer_config.json', bytes: 443 },
  { file: 'tokenizer.json', bytes: 17082730, sha256: '0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39' },
  { file: 'onnx/model_quantized.onnx', bytes: 118308185, sha256: 'f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193' },
];
const fileHash = async filename => {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(filename)) digest.update(chunk);
  return digest.digest('hex');
};
const downloads = [];
for (const asset of assets) {
  const target = path.join(cache, model, revision, asset.file);
  let valid = false;
  try {
    const bytes = await readFile(target);
    valid = bytes.length === asset.bytes && (!asset.sha256 || hash(bytes) === asset.sha256);
  } catch {}
  if (!valid) {
    const url = `https://huggingface.co/${model}/resolve/${revision}/${asset.file}`;
    console.log(`Downloading authorized public model asset: ${asset.file} (${asset.bytes} bytes)`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Model asset HTTP ${response.status}: ${asset.file}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== asset.bytes || (asset.sha256 && hash(bytes) !== asset.sha256)) throw new Error(`Asset integrity mismatch: ${asset.file}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    downloads.push({ file: asset.file, bytes: bytes.length, url });
  }
  asset.verifiedSha256 = await fileHash(target);
}

env.cacheDir = cache;
env.allowRemoteModels = false;
const originalFetch = globalThis.fetch;
const inferenceFetchAttempts = [];
globalThis.fetch = async (...args) => {
  inferenceFetchAttempts.push(String(args[0]));
  throw new Error('Network is disabled during local inference.');
};
let extractor;
try {
  const loadedAt = performance.now();
  extractor = await pipeline('feature-extraction', model, { revision, dtype: 'q8', device: 'cpu', local_files_only: true });
  const loadMs = performance.now() - loadedAt;
  const embed = async text => Array.from((await extractor(text, { pooling: 'mean', normalize: true })).data);
  const indexAt = performance.now();
  const indexed = [];
  for (const item of fixture) {
    const text = `passage: ${item.title}. ${item.description}. ${item.tags.join(', ')}`;
    indexed.push({ id: item.id, vector: await embed(text) });
  }
  const indexMs = performance.now() - indexAt;
  const results = [];
  for (const test of baseline.results) {
    const queryAt = performance.now();
    const vector = await embed(`query: ${test.query.slice(0, 240)}`);
    const ranking = indexed.map(item => ({ id: item.id, score: item.vector.reduce((sum, value, i) => sum + value * vector[i], 0) }))
      .sort((a, b) => b.score - a.score);
    const expectedRank = test.expectedIds?.length ? ranking.findIndex(r => test.expectedIds.includes(r.id)) + 1 : null;
    const expectedScore = expectedRank ? ranking[expectedRank - 1].score : null;
    results.push({
      id: test.id, kind: test.kind, language: test.language, query: test.query, expectedIds: test.expectedIds,
      baselineRanking: test.allSemantic, baselineThresholded: test.semantic, literal: test.literal,
      e5Ranking: ranking, expectedRank, expectedScore, elapsedMs: performance.now() - queryAt,
    });
    console.log(`${test.id}: ${ranking.slice(0, 3).map(r => `${r.id}:${r.score.toFixed(4)}`).join(', ')} expectedRank=${expectedRank ?? 'not scored'}`);
  }
  const positives = results.filter(r => r.kind === 'positive');
  const semanticIntentPositives = positives.filter(r => !r.id.startsWith('exact-'));
  const negatives = results.filter(r => r.kind === 'absent');
  const thresholdSweep = [0.38, 0.70, 0.75, 0.78, 0.80, 0.82, 0.84, 0.86, 0.88, 0.90].map(threshold => ({
    threshold,
    semanticTop1Hits: positives.filter(r => r.expectedRank === 1 && r.expectedScore >= threshold).length,
    semanticCandidateHits: positives.filter(r => r.expectedScore >= threshold).length,
    mergedTop1Hits: positives.filter(r => r.literal.length ? r.expectedIds.includes(r.literal[0].id) : r.expectedRank === 1 && r.expectedScore >= threshold).length,
    mergedCandidateHits: positives.filter(r => r.literal.some(item => r.expectedIds.includes(item.id)) || r.expectedScore >= threshold).length,
    absentAbstentions: negatives.filter(r => r.e5Ranking[0].score < threshold).length,
    adversarialCandidates: results.find(r => r.kind === 'adversarial').e5Ranking.filter(r => r.score >= threshold).length,
  }));
  const output = {
    date: new Date().toISOString(), status: 'completed',
    kind: 'One alternative compared on the same fixed synthetic cases, not a user evaluation or calibrated production threshold.',
    baselineArtifact: 'artifacts/product-benchmark.json', baselineArtifactSha256: hash(baselineBytes),
    fixtureSha256: hash(fixtureBefore), baselineFixtureSha256: baseline.method.fixtureSha256,
    sameFixture: hash(fixtureBefore) === baseline.method.fixtureSha256,
    sameCaseOrder: results.every((r, i) => r.id === baseline.results[i].id && r.query === baseline.results[i].query),
    model, revision, dtype: 'q8', runtime: 'Transformers.js 3.8.1 / Node CPU', node: process.version,
    sources: {
      conversion: `https://huggingface.co/${model}/tree/${revision}`,
      upstream: 'https://huggingface.co/intfloat/multilingual-e5-small/blob/614241f622f53c4eeff9890bdc4f31cfecc418b3/README.md',
      license: 'MIT declared by intfloat upstream model card; Xenova conversion metadata has no separate license field.',
    },
    prefixes: { query: 'query: ', passage: 'passage: ' },
    pooling: 'mean', normalize: true, loadMs, indexMs, assets,
    totalAssetBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), downloads,
    inferenceFetchAttempts, fixtureUnchanged: JSON.stringify(fixture) === fixtureBefore,
    summary: {
      positives: positives.length, semanticIntentPositives: semanticIntentPositives.length,
      unthresholdedTop1Hits: positives.filter(r => r.expectedRank === 1).length,
      unthresholdedIntentTop1Hits: semanticIntentPositives.filter(r => r.expectedRank === 1).length,
      unthresholdedTop3Hits: positives.filter(r => r.expectedRank <= 3).length,
      negativeMaximumScores: negatives.map(r => ({ id: r.id, maxScore: r.e5Ranking[0].score, topId: r.e5Ranking[0].id })),
      positiveTargetScoreRange: [Math.min(...semanticIntentPositives.map(r => r.expectedScore)), Math.max(...semanticIntentPositives.map(r => r.expectedScore))],
    },
    thresholdSweep, results,
  };
  await writeFile(path.join(root, 'artifacts/model-comparison.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ summary: output.summary, thresholdSweep }, null, 2));
} finally {
  if (extractor) await extractor.dispose();
  globalThis.fetch = originalFetch;
}
