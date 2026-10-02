# A mano · aceptación del rediseño

Revisión del 2 de octubre de 2026. Alcance: composición, claridad, tipografía, ilustración y movimiento. No añade funciones, modelos ni requisitos de candidatura. El rediseño solicitado por Jhona sustituye la dirección visual anterior de `brand.md`.

## Diagnóstico de la versión anterior

Basado en `artifacts/preview-desktop.png` (1440 × 1000) y `preview-mobile.png` (390 × 844), más la lectura de estilos. La interfaz es consistente y usable, pero su personalidad se parece a una plantilla de bienestar: verde salvia, pasteles, hoja de marca, destellos, maceta decorativa y titular serif con segunda línea en cursiva. El conjunto se aleja del objeto concreto que organiza: un archivo doméstico.

El espacio se dedica primero a presentar la app. En escritorio la primera fila de objetos apenas empieza en la parte inferior de la captura; en móvil ni siquiera aparece. Buscar, los ejemplos, la explicación de buscar por uso y el panel de activación repiten mensajes antes de llegar al inventario. Muchos contornos redondeados y etiquetas pequeñas compiten por atención, mientras nombre y ubicación todavía quedan lejos de la primera vista.

La ilustración actual no es un problema por ser vectorial: pesa más su tratamiento uniforme, decorativo y pastel, sin una relación fuerte con la composición. Cambiar solo colores o el icono de la hoja no cambiaría suficientemente esa impresión.

## Dirección acordada

**Archivo doméstico contemporáneo, con composición editorial.** Tipografía sans humanista, tinta oscura, grises cálidos y ultramarino reservado para énfasis. Una estructura reconocible de archivo —líneas, referencias, escalas y alineaciones— puede dar carácter sin convertir cada bloque en otra tarjeta. Densidad cómoda: el inventario debe sentirse cercano, no como contenido debajo de una landing page.

El hero puede conservar presencia propia, pero debe conducir directamente a buscar y ver objetos. Evitar la combinación anterior de hoja, destellos, maceta, tipografía cursiva y pasteles. Los dibujos nuevos deben parecer parte del mismo archivo; nunca fingir que son fotografías de pertenencias reales.

## Lista corta de aceptación

| Criterio | Evidencia observable para aprobar |
|---|---|
| **1. Cambio de composición real** | Una captura nueva se distingue inmediatamente de la versión anterior por estructura y jerarquía, no solo por recoloración. El hero y el inventario comparten alineaciones deliberadas. No hay paneles redondeados anidados como recurso dominante. |
| **2. Buscar y encontrar primero** | En 1440 × 900 se ve la búsqueda y se pueden leer nombre y ubicación de la primera fila de objetos. En 390 × 844, búsqueda y acción principal quedan accesibles sin un recorrido de presentación; el inventario aparece tras un desplazamiento corto. La explicación de IA queda claramente subordinada. |
| **3. Paleta contenida** | Ultramarino como acento reconocible sobre grises cálidos e ink oscuro. No vuelven los fondos multicolor pastel por categoría. Rojo u otros colores de estado solo aparecen cuando comunican un estado real. |
| **4. Tipografía con función** | Sans coherente en marca, títulos y controles; contraste visible entre título, nombre de objeto y metadatos. El nombre y la ubicación se leen cómodamente al tamaño real, sin depender de mayúsculas muy pequeñas o tracking extremo. Las líneas largas se cortan en lugares naturales, sin palabras o botones desbordados. |
| **5. Objetos y controles legibles** | Dibujos con lenguaje común de escala, trazo y sombra; las piezas importantes se reconocen sin usar otro color para cada tarjeta. Favorito, abrir y editar tienen jerarquía estable. No reaparecen hoja, sparkles ni contenedores tipo pastilla en todas las funciones. |
| **6. Movimiento intencional** | Entrada breve y con secuencia perceptible; cambios de filtro, hover y diálogos tienen respuesta cuidada sin saltos de layout ni rebotes gratuitos. Las acciones pueden usarse durante la animación. La entrada de la página no se repite al escribir o marcar favorito. Con reduced-motion, todo contenido esencial está visible inmediatamente. |
| **7. Acabado en tamaños reales** | Revisar 390, 768 y 1440 px: no hay overflow, filas aplastadas, arte recortado accidentalmente, enormes huecos de contenido oculto ni elementos que se solapan. Foco de teclado y estados seleccionado/hover siguen siendo distinguibles. |
| **8. Honestidad preservada** | Demo ficticia, almacenamiento local y descarga opcional del modelo siguen comprensibles. La nueva composición no disfraza sugerencias como certeza, ni dibujos como fotos. Cambiar el aspecto no introduce estadísticas, testimonios o historias de uso no verificadas. |

## Cómo revisar sin sobredimensionar la tarea

Primero comparar dos capturas nítidas y completas —escritorio y móvil—, luego una ficha abierta. Señalar solo defectos visibles que reduzcan el acabado o la claridad; no pedir otra ronda de funciones. La captura estática no demuestra calidad de movimiento: la secuencia de entrada y un cambio de filtro necesitan una observación breve o fotogramas con tiempos conocidos. Una captura a mitad de la entrada tampoco demuestra que falte contenido; revisar el estado asentado.

La tipografía puede resolverse con una familia sans local adecuada y fallbacks coherentes. No es obligatorio añadir una fuente ni una dependencia. Si se distribuye una fuente nueva, su archivo debe tener licencia compatible; no copiar al repositorio fuentes comerciales instaladas en Windows por el mero hecho de estar disponibles.

Estado final: revisión visual independiente completada sobre escritorio, móvil y ficha de detalle; no se observaron bloqueos materiales. Se aumentaron las etiquetas pequeñas de tarjetas móviles. La prueba `scripts/design-check.mjs`, ejecutada el 2 octubre a las 13:30 UTC, verifica nombre y ubicación de primera fila en 1440 × 900, ausencia de overflow a 375/390/768, hover/filtro/diálogo con CPU simulada 4× más lenta, atajo de búsqueda y cero animaciones iniciales con reduced-motion. El recorrido funcional completo y la inferencia real también pasaron. No se infiere una tasa de fotogramas ni experiencia de teléfono físico a partir de estas pruebas.
