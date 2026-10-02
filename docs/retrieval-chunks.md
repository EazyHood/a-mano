# Última prueba: fragmentos independientes

**Decisión: conservar la representación concatenada actual y detener este ajuste.** La fragmentación no resolvió Allen ni cinta, y añadió sugerencias incorrectas. No se editó la aplicación, la configuración del modelo, los objetos ni sus descripciones.

## Método registrado antes de medir

Se reutilizó MiniLM q8, revisión `2c4055b12046f11709e9df2c122e59ffbdc2f900`, desde el cache local. Misma normalización, mean pooling y umbral **0.38**. Se crearon por objeto:

1. Nombre más etiquetas.
2. Descripción completa.
3. Frases o cláusulas de la descripción separadas por `. ! ? ; : ,` o salto de línea.

Los fragmentos se recortaron y deduplicaron exactamente dentro de cada objeto; se conservaron todos los no vacíos, sin reglas específicas por objeto. El puntaje del objeto fue el máximo de los cosenos de sus fragmentos. Se generaron 46 fragmentos para los diez objetos; no se añadieron sinónimos, información de ubicaciones ni texto nuevo.

Se conservaron las quince consultas originales y su orden. Antes de inferir se añadieron cuatro controles:

- «quiero mostrar una presentación del ordenador en una pantalla externa» → adaptador.
- «necesito volver a sujetar el botón que se desprendió de mi chaqueta» → costura.
- «¿dónde guardé las croquetas para darle de comer al gato?» → ausente.
- «busco el documento de identidad para cruzar la frontera» → ausente.

Así, las consultas nuevas no se eligieron exclusivamente para los dos fallos investigados. Siguen siendo pruebas sintéticas de desarrollo, no un estudio independiente ni usuarios reales.

## Resultados

| Cohorte | Concatenación + literal | Fragmentos + literal | Ausentes rechazados, ambos |
|---|---:|---:|---:|
| Originales: 11 positivas, 2 ausentes, 2 no puntuadas | 9/11 objetivos primeros | 9/11 objetivos primeros | 2/2 |
| Controles nuevos: 2 positivas, 2 ausentes | 2/2 | 2/2 | 2/2 |
| Total: 13 positivas, 4 ausentes, 2 no puntuadas | 11/13 | 11/13 | 4/4 |

La recuperación del objetivo en cualquier posición coincide con top 1 en estos conjuntos. Los dos casos no puntuados son una consulta ambigua y texto adversarial. La prueba no confunde sus sugerencias con aciertos demostrados.

En las trece consultas positivas, el total de candidatos semánticos aumenta de 12 a 27. Los candidatos distintos del objeto objetivo previamente fijado pasan de 3 a 18. Este conteo mide desviación de la expectativa del ensayo, no una valoración de relevancia realizada por usuarios.

**Allen sigue sin aparecer a 0.38.** Su máximo pasa a 0.3614 por nombre y etiquetas; la bombilla incorrecta sube a 0.6435 por la cláusula «comprobar siempre el casquillo». Costura también se cuela con 0.5845 por «Agujas».

**Cinta sigue sin aparecer a 0.38.** Para la intención de medir el espacio de un sofá, el fragmento relevante de cinta obtiene 0.3167. Bombilla y Allen obtienen 0.4923 y 0.4816, respectivamente: el vacío anterior se convierte en dos sugerencias incorrectas.

**Las consultas exactas reciben ruido adicional.** «Regleta» hace puntuar 0.8523 a «Agujas», un fragmento de costura; el literal mantiene regleta primero, pero aparecen distractores. «Estuche gris» conserva adaptador solo gracias al literal y añade otras tres sugerencias. Este comportamiento no respalda usar máximos sobre fragmentos muy cortos en esta configuración.

No se bajó el umbral ni se eliminaron selectivamente fragmentos después de ver estos resultados. Eso sería otra estrategia y otra calibración, fuera de la prueba acotada autorizada.

## Evidencia y límites

Script reproducible: `scripts/compare-chunks.mjs`. Resultados completos: `artifacts/chunk-comparison.json`, que incluye cada fragmento y su puntaje, las clasificaciones completas de ambos métodos, hashes y cohortes.

El baseline se volvió a ejecutar sobre las quince consultas y reprodujo todos sus cosenos con diferencia máxima observada **0**. El hash del inventario y el orden de consultas coinciden; el inventario permaneció intacto. Se observaron cero intentos de `fetch`, con modelos remotos deshabilitados y red bloqueada para la inferencia. No se descargó ningún modelo.

El registro incluye aproximadamente 939 ms de carga desde cache y 2014 ms de indexación del ensayo, que calcula tanto la concatenación como los fragmentos. Son tiempos de Node CPU en esta ejecución; no representan descarga inicial, browser WASM ni rendimiento de dispositivos de usuarios. La prueba del worker en navegador se mantiene separada.

La conclusión es limitada y concreta: **esta estrategia de fragmentos máximos no mejora el producto en el conjunto evaluado**. Mantener búsqueda literal, sugerencias claramente falibles y acceso al inventario completo. No seguir variando modelos o parámetros para convertir estos pocos ejemplos en una cifra atractiva.
