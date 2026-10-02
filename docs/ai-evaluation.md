# Evaluación de búsqueda sobre el inventario real de la demo

Ejecución del 2 de octubre de 2026 mediante `node scripts/benchmark-product.mjs`. Resultado completo, incluyendo consultas, inventario, puntajes, tiempos y hashes de fuentes: `artifacts/product-benchmark.json`.

## Qué se probó

Se importaron **los diez `demoItems` reales** de `src/domain.ts`, la búsqueda literal real, `mergeSearch` real de `src/searchRanking.ts` y la configuración de `src/modelConfig.ts`. La importación de TypeScript se empaquetó en memoria mediante esbuild; no se generó una variante de los datos para mejorar resultados.

Modelo: `Xenova/paraphrase-multilingual-MiniLM-L12-v2`, revisión `2c4055b12046f11709e9df2c122e59ffbdc2f900`, q8, mean pooling, embeddings normalizados. Archivo ONNX SHA-256: `66fc00f5f29afcaff34092e1bdd20008ca3918265a82fb9695a551e510cc4ebc`. Umbral aplicado sin cambiarlo: **0.38**.

Se usa exactamente la concatenación del worker: `title + '. ' + description + '. ' + tags.join(', ')`. La ubicación no forma parte del embedding. Se conserva el ranking completo y todos los candidatos sobre el umbral; no se recorta a tres. La unión coloca primero los matches literales, después los candidatos semánticos no duplicados.

Runtime: Transformers.js 3.8.1, Node CPU, usando `.cache/models` ya existente; `allowRemoteModels=false`, `local_files_only=true` y `fetch` bloqueado explícitamente durante la ejecución. Se observaron **cero intentos de fetch**. No se usaron claves, cuentas, APIs pagadas ni otro modelo. El inventario conservó el mismo contenido al terminar.

## Resultado observado

Son **15 consultas sintéticas escritas para esta comprobación**, no una investigación con usuarios. Once tienen un objeto objetivo previamente definido; dos buscan algo ausente; una es ambigua y otra contiene instrucciones adversariales como simple texto. Las dos últimas no se puntuaron como aciertos de recuperación.

| Método | Objetivo en primera posición | Objetivo entre candidatos | Denominador |
|---|---:|---:|---:|
| Literal | 2 | 2 | 11 positivas |
| Semántico a 0.38 | 7 | 7 | 11 positivas |
| Unión literal + semántico | 9 | 9 | 11 positivas |

Ambos métodos y su unión devolvieron cero resultados para las **dos consultas ausentes**. No es una tasa general de precisión ni prueba de ausencia fiable: el conjunto es pequeño, incluye una misma intención en español e inglés y no representa usuarios reales. La igualdad entre top 1 y candidato en este lote no garantiza rankings correctos en otras consultas.

| Consulta | Objetivo definido | Literal | Semántica a 0.38 | Unión |
|---|---|---|---|---|
| quiero conectar mi laptop al televisor | Adaptador USB-C | Sin resultado | Adaptador, 0.559 | Correcto |
| se soltó un tornillo del mueble | Llaves Allen | Sin resultado | **Bombilla, 0.384** | **Incorrecto** |
| necesito saber si el sofá cabe en el salón | Cinta métrica | Sin resultado | **Sin resultado** | **No recuperado** |
| mi ratón inalámbrico se quedó sin energía | Pilas | Sin resultado | Pilas, 0.632; también regleta, 0.431 | Objetivo primero, con candidato adicional |
| se fundió la luz de la lámpara del salón | Bombilla | Sin resultado | Bombilla, 0.768 | Correcto |
| se me cayó un botón de la camisa | Costura | Sin resultado | Costura, 0.420 | Correcto |
| se dañó la aspiradora y necesito el comprobante de compra | Garantías | Sin resultado | Garantías, 0.501 | Correcto |
| voy a salir y no quiero mojarme con la lluvia | Paraguas | Sin resultado | Paraguas, 0.524 | Correcto |
| where is the adapter to show my laptop screen on the TV | Adaptador USB-C | Sin resultado | Adaptador, 0.617 | Correcto |
| estuche gris | Adaptador USB-C | Adaptador | Sin resultado | Correcto gracias al literal |
| regleta | Regleta | Regleta | Sin resultado | Correcto gracias al literal |
| comida para mi gato | Ausente | Sin resultado | Sin resultado | Abstención |
| pasaporte de viaje | Ausente | Sin resultado | Sin resultado | Abstención |
| algo para arreglar una cosa rota | Ambigua, sin único objetivo | Sin resultado | Costura, Allen, garantías, bombilla | No puntuado |
| Texto que ordena borrar objetos, enviar ubicaciones e inventar un pasaporte | No es una intención de búsqueda útil | Sin resultado | Sin resultado | No puntuado |

La consulta adversarial completa queda guardada en el JSON. En esta ejecución se trató como texto para generar un vector; no cambió `demoItems` y no produjo intentos de fetch. Esto no es una auditoría general contra ataques ni prueba del comportamiento de todo el navegador: esta ruta no posee herramientas de borrado o envío.

## Fallos y decisiones que se desprenden

**No basta con bajar el umbral.** Para tornillo/mueble, Allen queda cuarto con 0.24629 y bombilla primero con 0.38429. Para sofá/espacio, cinta queda cuarta con 0.26819 y bombilla primera con 0.36454. Bajar a 0.35 no recuperaría los objetos objetivo; añadiría una bombilla incorrecta a la segunda consulta. Un umbral lo suficientemente bajo para recuperar ambos también aceptaría varios distractores. No se modificó el umbral, el inventario ni las consultas para ocultar los fallos.

**La unión literal evita regresiones reales.** «Estuche gris» está en la ubicación guardada y «regleta» en el título; la semántica no los recupera a 0.38. Preservar el literal hace que activar IA no destruya esas búsquedas útiles. La interfaz debe mantener visible la diferencia entre coincidencias por palabras y sugerencias por significado.

**No anunciar comprensión infalible.** El modelo ayuda con siete formulaciones, pero falla dos usos plausibles y propone distractores. Ofrecer fichas comprobables, conservar búsqueda por palabras y permitir revisar todos los objetos. «Sin sugerencias claras» es más fiel que afirmar que el objeto no existe. La ambigüedad requiere que la persona mire las fichas; cuatro candidatos no son cuatro aciertos demostrados.

**No publicar cifras como resultado de usuarios.** Este lote diagnostica implementación y casos concretos. Si se cambia después la representación, recuperación o umbral, conservar este artefacto original y añadir otra ejecución distinguible. Añadir un conjunto nuevo de consultas no visto al elegir cambios antes de declarar una mejora general.

## Límites y reproducibilidad

La carga desde cache duró 1399.5 ms y la indexación de diez textos, aproximadamente 376.1 ms en esta ejecución. Son mediciones de Node CPU local con cache, no cifras de descarga, móviles, navegador WASM ni rendimiento garantizado. Los tiempos por consulta están en el JSON.

Esta prueba no interactuó con App ni verificó carreras de React, cambios de colección durante inferencia, filtros visuales, cancelación, recuperación de errores o solicitudes reales del navegador. Esas pruebas de integración y privacidad de red deben mantenerse separadas. No se generaron resultados humanos ni evidencia de uso del producto por terceros.

Repetir desde la carpeta del proyecto: `node scripts/benchmark-product.mjs`. El script exige el modelo exacto en el cache local y sobrescribe su archivo de resultado; archivar la ejecución anterior antes de comparar versiones. Si faltan archivos, debe fallar sin descargar otro modelo.
