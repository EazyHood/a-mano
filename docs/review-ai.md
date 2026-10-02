# Revisión independiente de búsqueda local

Fecha: 2026-10-02. Revisión estática de `src/useSemanticSearch.ts`, `src/search.worker.ts`, `src/App.tsx`, `src/modelConfig.ts` y lectura del benchmark ya ejecutado en `artifacts/model-benchmark.json`. No se modificó la implementación ni se ejecutó otra inferencia. Las referencias describen la versión leída, previa a correcciones concurrentes.

## Corregir antes de presentar

### P1 · La IA puede ocultar una coincidencia literal válida

`App.tsx:51` sustituye el conjunto literal por `semantic.results` en cuanto existe una respuesta, incluso si es `[]`. El worker solo indexa nombre, descripción y etiquetas (`search.worker.ts:51`), mientras la búsqueda literal también encuentra ubicación y habitación. Ejemplo reproducible con la demo: buscar **«estuche gris»** encuentra el adaptador por su ubicación sin IA; ese texto no forma parte del índice semántico y la respuesta puede eliminarlo. Una búsqueda exacta no debe empeorar por activar la ayuda opcional.

Cambio mínimo: conservar siempre los resultados literales y añadir candidatos semánticos no duplicados. Identificar la procedencia con etiquetas o grupos; no presentar una coincidencia literal como validación del modelo. Aplicar filtros de la colección a ambos. Si se decide incluir ubicación/habitación en el embedding, incluir también esos campos en la firma que invalida el índice; esto por sí solo no garantiza preservar un match exacto.

### P1 · Recorte previo a los filtros produce falsos vacíos

`search.worker.ts:60–61` recorta a tres candidatos globales. `App.tsx:53` filtra después por habitación, categoría o favorito. Así, un candidato de rango cuatro que cumple el filtro se pierde si los tres primeros no lo cumplen. La pantalla muestra vacío aunque hay un candidato elegible por encima del umbral.

Cambio mínimo: devolver desde el worker todos los candidatos sobre el umbral (máximo 200 objetos); aplicar filtros en App y limitar después los candidatos semánticos visibles. Conservar los matches literales en la unión. Probar una consulta con cuatro matches donde solo el cuarto pertenece a la habitación seleccionada.

### P2 · Borrar una consulta deja el estado «Buscando…»

El efecto de consulta (`useSemanticSearch.ts:47–57`) invalida la respuesta anterior y retorna si la consulta queda vacía, pero no restaura el estado. Si era `searching`, ninguna respuesta pendiente puede devolverlo a `ready` porque su requestId ya no coincide. La interfaz puede quedarse buscando sin consulta.

Cambio mínimo: al quedar la consulta vacía y estar listo el índice actual, limpiar resultados y pasar a `ready`. Mantener `loading/indexing` si todavía no está listo. Comprobar borrar mientras una respuesta está pendiente y escribir otra consulta posteriormente.

### P2 · Respuestas/errores de consultas anteriores

El control de `version` y `requestId` de respuestas exitosas es una buena base. Los errores del worker (`useSemanticSearch.ts:31`) solo se filtran por versión, no por requestId: un fallo tardío de una consulta A puede apagar la respuesta/interfaz de B dentro de la misma colección. Además, la limpieza de resultados ocurre en un efecto pasivo; durante el primer render de una consulta o colección nueva aún pueden mostrarse candidatos de la anterior.

Cambio mínimo: los errores de búsqueda deben pasar el mismo control de requestId que sus resultados; distinguirlos de errores de indexación/carga. Conservar metadatos de consulta y firma del inventario junto a los resultados y devolverlos a App solo si coinciden con los inputs actuales. No depender exclusivamente de `setResults(null)` posterior al render. El evento `onerror` y mensajes deben ignorarse si la instancia ya fue sustituida o desactivada.

## Umbral y evidencia del modelo

El benchmark es real, pero exploratorio y sintético; ejecutó otro conjunto de ocho textos, **no los diez objetos actuales de demo**. Por ejemplo, contiene manual de cafetera y garantía de aspiradora; la demo tiene manual de horno y carpeta general de garantías. No trasladar sus porcentajes, rankings ni tiempos a la demo o al navegador WASM.

En «se soltó un tornillo del mueble», garantía obtiene 0.39844 y Allen 0.37130. Con umbral 0.38 la herramienta correcta desaparece y queda garantía. El fallo es tanto de ranking como de corte: bajar el umbral no convierte a Allen en top 1.

Cambio mínimo razonable para ensayar: conservar candidatos cercanos con un piso exploratorio menor (por ejemplo 0.35) y presentarlos como sugerencias verificables, junto a la búsqueda literal. Los dos negativos de ese benchmark quedan por debajo de 0.20, pero **dos negativos no calibran un umbral universal**. Antes de fijarlo, ejecutar el inventario real con consultas positivas, negativas, ubicaciones exactas y una colección editada. No ajustar las descripciones de demostración solo para aprobar una frase de prueba. Nunca mostrar similitud como probabilidad o confianza calibrada.

Con cero sugerencias semánticas, la copia debería indicar «No encontré sugerencias claras; prueba una palabra o revisa los filtros», sin afirmar que el objeto no existe. Durante carga/búsqueda, no presentar el vacío literal temporal como una conclusión semántica.

## Otros ajustes pequeños

- La activación puede acabar en `indexing` antes de descargar el modelo: el efecto de índice usa el estado anterior y pisa `loading`. Enviar `indexing` únicamente cuando lo confirme el worker; su mensaje ya existe tras `await model()`.
- Los mensajes de progreso carecen de versión. Son progreso del modelo compartido y no incluyen datos personales, pero conviene ignorar cualquier mensaje de una instancia ya reemplazada.
- La interfaz acepta 300 caracteres, el worker corta a 240 silenciosamente. Alinear el límite o indicar el recorte; de lo contrario el texto literal y el semántico procesan consultas diferentes.
- La cola serial evita cambiar el índice a mitad de una operación, pero no descarta trabajo obsoleto; muchas ediciones pueden retrasar el último resultado. Mantener guardas actuales y, si la latencia se observa, coalescer reindexaciones/consultas pendientes por versión/requestId. No es necesario rediseñar para la demo de diez objetos sin evidencia de lentitud.
- El cache guarda textos y embeddings de la sesión, también de objetos borrados, hasta vaciado por tamaño o terminación del worker. No se persiste ni se envía según el código inspeccionado. No afirmar borrado inmediato de memoria; se puede podar en reindexación como minimización opcional.

## Privacidad: lo observado y lo que falta comprobar

No se encontró en `src` ningún `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket o SDK de inferencia remota. `postMessage` comunica la página con su Web Worker local. El identificador y revisión del modelo son constantes; los textos se pasan a `pipeline('feature-extraction')` con `device:'wasm'`. La biblioteca descargará archivos públicos del modelo/runtime; esas solicitudes revelan metadatos normales de red (por ejemplo IP y recurso pedido), no son una subida del inventario en el flujo inspeccionado.

La lectura estática es compatible con «textos procesados localmente», pero no sustituye la captura de red en navegador. Prueba pendiente del responsable de integración: usar inventario y consulta sintéticos con una cadena centinela única, activar/indexar/buscar, inspeccionar URLs y cuerpos de solicitudes y confirmar que el centinela no sale. Comprobar también errores, reintento y desactivar; no usar información privada real para esa prueba. No hace falta prometer cero red, funcionamiento offline completo ni una garantía absoluta de seguridad.

## Pruebas mínimas de integración recomendadas

1. A → B rápidamente; entregar respuesta de A tarde; solo B permanece visible.
2. Editar/eliminar un objeto y cambiar demo → personal durante búsqueda; ningún resultado de la firma anterior se presenta para la nueva colección.
3. Vaciar consulta durante inferencia; estado vuelve a listo y no se queda el indicador buscando.
4. Error de A tras iniciar B; no pisa B. Error de descarga → búsqueda literal útil → reintento → listo.
5. Desactivar durante carga y mientras busca; worker terminado, estado idle y ningún mensaje tardío lo reactiva.
6. Ubicación exacta sigue encontrándose con IA; categoría/habitación/favoritos se filtran antes del límite visual.
7. Negativo sin objetos relacionados: cero sugerencias y copia prudente, no objetos inventados.
8. Captura de red con datos centinela sintéticos. Guardar evidencia del navegador y no usar los tiempos CPU como tiempos WASM.
