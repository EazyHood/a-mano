import { pipeline, env } from '@huggingface/transformers';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
env.cacheDir = '.cache/models';
const model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const revision = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
const t0 = performance.now();
console.log('Loading pinned multilingual q8 model, public assets only.');
const pipe = await pipeline('feature-extraction', model, { revision, dtype:'q8', device:'cpu' });
const loadedMs=performance.now()-t0;
const docs = [
  ['adaptador','Adaptador USB-C a HDMI. Conecta el portátil a una pantalla externa o al proyector. cable video monitor'],
  ['allen','Juego de llaves Allen. Herramientas pequeñas para apretar tornillos hexagonales y montar muebles. estantería montaje'],
  ['cinta','Cinta métrica. Medir ancho y alto de muebles y espacios antes de comprar. medidas longitud'],
  ['pilas','Pilas recargables AA y cargador. Para el mando de la televisión, ratón y juguetes. baterías energía'],
  ['bombilla','Bombilla LED de repuesto. Luz cálida para la lámpara del escritorio. iluminación'],
  ['manual','Manual de la cafetera. Instrucciones de limpieza, descalcificación y mantenimiento. café'],
  ['costura','Kit de costura. Agujas, hilo y botones para arreglar pequeños descosidos. ropa reparación'],
  ['garantia','Garantía de la aspiradora. Documento de compra y condiciones de reparación del aparato. recibo avería'],
];
const embeddings=await pipe(docs.map(x=>x[1]),{pooling:'mean',normalize:true});
const vectors=embeddings.tolist();
const cases=[
  ['quiero conectar mi laptop al televisor','adaptador'],
  ['se soltó un tornillo del mueble','allen'],
  ['necesito saber si el sofá cabe en el salón','cinta'],
  ['el control remoto se quedó sin energía','pilas'],
  ['no enciende la luz de mi escritorio','bombilla'],
  ['cómo le quito la cal a la máquina de café','manual'],
  ['se me cayó un botón de la camisa','costura'],
  ['se dañó la aspiradora y quiero ver si la reparan','garantia'],
  ['where is the cable to connect my computer to the TV','adaptador'],
  ['food for my cat',null],
  ['pasaporte de viaje',null],
];
const results=[];
for (const [query,expected] of cases) {
  const start=performance.now();
  const embedding=await pipe(query,{pooling:'mean',normalize:true});
  const v=embedding.tolist()[0];
  const ranking=vectors.map((d,i)=>({id:docs[i][0],similarity:d.reduce((s,x,j)=>s+x*v[j],0)})).sort((a,b)=>b.similarity-a.similarity).slice(0,3);
  results.push({query,expected,ranking,ms:performance.now()-start});
  console.log(JSON.stringify(results.at(-1)));
}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/model-benchmark.json',JSON.stringify({date:new Date().toISOString(),kind:'synthetic exploratory cases, not user validation',model,revision,dtype:'q8',runtime:'Transformers.js 3.8.1 / Node CPU',loadedMs,results},null,2));
await pipe.dispose();
