# Una alternativa de recuperación: multilingual-e5-small

**Recomendación: no sustituir todavía el modelo de la app.** E5 mejora el orden de Allen en este lote, pero no recupera correctamente la intención de medir espacio y no permite distinguir el caso Allen de los dos ausentes con un único umbral absoluto. La app y `modelConfig.ts` no se modificaron.

## Fuente y descarga comprobadas

Se evaluó únicamente [`Xenova/multilingual-e5-small`](https://huggingface.co/Xenova/multilingual-e5-small/tree/761b726dd34fb83930e26aab4e9ac3899aa1fa78), revisión `761b726dd34fb83930e26aab4e9ac3899aa1fa78`, conversión ONNX para Transformers.js. Su [modelo original de intfloat](https://huggingface.co/intfloat/multilingual-e5-small/blob/614241f622f53c4eeff9890bdc4f31cfecc418b3/README.md) declara licencia MIT. Los metadatos de la conversión no añaden un campo de licencia separado: conservar esta procedencia si se distribuye, sin afirmar que la conversión publica otra licencia explícita.

La ficha de intfloat pide prefijos diferenciados para recuperar pasajes, también fuera del inglés; se usó `query: ` en consultas y `passage: ` en objetos. Advierte además que los puntajes de coseno se concentran en valores altos y que importa el orden relativo. Por ello no se heredó 0.38 como umbral adoptado para E5. [Ficha del modelo original](https://huggingface.co/intfloat/multilingual-e5-small/blob/614241f622f53c4eeff9890bdc4f31cfecc418b3/README.md).

Se descargaron cuatro archivos públicos de la revisión fijada, **135,392,016 bytes** en total (unos 135.4 MB decimales / 129.1 MiB), sin cuenta ni servicio de inferencia:

| Archivo | Bytes |
|---|---:|
| `onnx/model_quantized.onnx` | 118,308,185 |
| `tokenizer.json` | 17,082,730 |
| `config.json` | 658 |
| `tokenizer_config.json` | 443 |

El ONNX coincide con SHA-256 `f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193`, publicado en los metadatos de Hugging Face; también se verificaron tamaño y hash del tokenizer. Estos bytes no incluyen la biblioteca/runtime de una futura app web. La inferencia posterior usó exclusivamente el cache local, con descargas remotas deshabilitadas y `fetch` bloqueado: cero intentos observados durante la inferencia.

## Método que conserva el comparador

El script `scripts/compare-models.mjs` lee el inventario y las quince consultas de `artifacts/product-benchmark.json`, sin reescribirlos, reordenarlos ni añadir sinónimos a los objetos. Comparte la concatenación de nombre, descripción y etiquetas; solo añade el prefijo requerido por E5. Ejecuta q8, CPU de Node, mean pooling y normalización. Los resultados son sintéticos; no son una evaluación con usuarios ni resultados del navegador WASM.

`artifacts/model-comparison.json` contiene los quince rankings completos, el baseline original, hashes, tiempos, procedencia, descargas y la comprobación `sameFixture`, `sameCaseOrder` y `fixtureUnchanged`. El baseline permanece intacto. No se probaron otros modelos.

## Comparación observada

| Medida sobre 11 consultas positivas | MiniLM anterior | E5 |
|---|---:|---:|
| Objeto objetivo primero, sin filtrar por umbral | 7 | 9 |
| Objetivo entre tres primeros, sin umbral | 7 | 9 |
| Unión con literal: objetivo primero conservando umbrales que rechazan ambos ausentes en este lote | 9 a 0.38 | 9 a 0.82 |

La fila con 0.82 es una **observación posterior al resultado**, no un umbral calibrado ni una recomendación para producción. Las consultas de ubicación y título exactos siguen protegidas por el literal. Contar los diez objetos como candidatos a un umbral muy bajo haría subir la recuperación artificialmente sin mejorar la utilidad.

| Caso relevante | MiniLM anterior | E5 |
|---|---|---|
| Tornillo del mueble → Allen | Allen 4.º, 0.2463; devuelve bombilla a 0.38 | Allen 1.º, **0.80095**, prácticamente empatado con cinta, 0.8007 |
| Sofá cabe en salón → cinta | Cinta 4.ª, 0.2682 | Cinta **5.ª**; bombilla 1.ª, 0.8189 |
| Ubicación «estuche gris» → adaptador | No recuperado semánticamente a 0.38 | Adaptador 9.º; literal conserva el resultado correcto |
| Título «regleta» → regleta | No recuperado semánticamente a 0.38 | Regleta 1.ª, 0.8483 |
| Comida para gato, ausente | Sin candidatos a 0.38 | Mejor candidato incorrecto: manual del horno, **0.81083** |
| Pasaporte de viaje, ausente | Sin candidatos a 0.38 | Mejor candidato incorrecto: garantías, **0.81637** |
| Texto adversarial que pide borrar y enviar | Sin candidatos a 0.38 | Mejor candidato: garantías, **0.8129**; ninguna acción ejecutada |

El positivo Allen tiene menor puntaje que ambos negativos. Un umbral que lo mantenga acepta también esos falsos positivos; un umbral de 0.82 elimina los dos ausentes pero vuelve a ocultar Allen. Tampoco ayuda un corte global de 0.38: en E5 conserva diez candidatos para la consulta adversarial y no se abstiene en los dos ausentes.

Barrido descriptivo guardado, sin cambiar la app:

| Umbral E5 | Unión: objetivos primero | Ausentes rechazados |
|---:|---:|---:|
| 0.38 | 10/11 | 0/2 |
| 0.78 | 10/11 | 0/2 |
| 0.80 | 10/11 | 0/2 |
| 0.82 | 9/11 | 2/2 |
| 0.84 | 5/11 | 2/2 |

Los números no deben publicarse como exactitud general: son pocos casos ya conocidos durante la elección y una intención aparece en dos idiomas. Los empates cercanos tampoco deben presentarse como certeza.

## Implicación para el producto

Conservar de momento el baseline y la unión literal, junto a la advertencia de sugerencias falibles. E5 por sí solo no resuelve los dos fallos que motivaron la prueba y añade dificultad para abstenerse. No justificar otra descarga para usuarios solo por ganar un puesto en esta muestra.

Si se busca mejorar más, una siguiente hipótesis distinta sería evaluar cómo se representan los objetos —por ejemplo evidencia separada de nombre y frases de uso—, sin cambiar los hechos ni personalizar datos para las consultas. Cualquier ensayo así debe conservar estos fallos, añadir consultas nuevas no usadas para elegir la estrategia y medir falsos positivos; queda fuera de esta comparación. La decisión aquí no prueba que E5 sea peor en general: solo que **esta sustitución directa no entrega una mejora suficiente en este inventario y estas restricciones**.

Reproducción: `node scripts/compare-models.mjs`. Reutiliza el cache si los archivos son válidos; solo descargaría de nuevo estos mismos archivos públicos si faltaran o no coincidieran. Sobrescribe su propio JSON de comparación, por lo que debe archivarse primero para comparar otra implementación. Ninguna configuración de la aplicación depende de este script.
