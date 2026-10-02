# A mano · dominio e inventario local

Implementación nueva para este proyecto. Los diez objetos de demostración son **sintéticos**, no pertenencias verificadas ni datos personales. Las ubicaciones concretas permiten practicar el recorrido completo. La fecha común de ejemplo tampoco afirma una actividad real.

## API estable

- `Item`: `id`, `title`, `category`, `room`, `place`, `description`, `tags: string[]`, `favorite: boolean`, `updatedAt`.
- `RoomId`: `entrada | estudio | cocina | armario | trastero`.
- `Category`: `tecnologia | herramientas | documentos | hogar`.
- `rooms`, `categories`: listas `{ id, label }`; `demoItems`: diez ejemplos.
- `makeItem(input: Omit<Item, 'id' | 'updatedAt'>): Item`: UUID del navegador, hora ISO actual, validación y copia de etiquetas.
- `loadItems(): Item[] | null`: `null` exclusivamente cuando no existe la clave. Una lista vacía guardada es `[]`.
- `saveItems(items: Item[]): void`: valida antes de escribir. Fallos de permisos/cuota son errores explícitos; no se simula un guardado.
- `exportItems(items: Item[]): string`: envoltura JSON legible.
- `importItems(json: string): Item[]`: valida y devuelve copias; **no escribe, fusiona, elimina ni reemplaza** el inventario. La interfaz debe mostrar el resumen y pedir confirmación antes de llamar a `saveItems` para reemplazar datos existentes.
- `lexicalSearch(items: Item[], query: string): { id, score }[]`: coincidencias literales; consulta vacía devuelve `[]`.

## Persistencia y formato

Clave local: `amano.items.v1`. Formato idéntico en almacenamiento y exportación:

```json
{
  "format": "amano-inventory",
  "version": 1,
  "exportedAt": "2026-10-02T00:00:00.000Z",
  "items": []
}
```

No existe migración silenciosa desde otros esquemas. Un archivo corrupto o de otra versión se rechaza íntegramente: sin importación parcial, deduplicación oculta ni renumeración de identificadores. El fallo de lectura conserva los datos originales en localStorage. No sustituirlos automáticamente con la demo al capturar un error.

Límites: 200 objetos; archivo de 2 MiB medido en UTF-8; identificador 128 caracteres, nombre 120, ubicación 160, descripción 1200, 20 etiquetas de hasta 60 caracteres. Identificador, nombre, ubicación y etiquetas deben contener texto no vacío. Descripción vacía permitida. Las fechas deben ser ISO UTC canónicas con milisegundos y calendario válido. Habitaciones, categorías y favorito se comprueban estrictamente. Campos desconocidos, ausentes y claves de contaminación de prototipos se rechazan. Los límites de cadenas usan unidades UTF-16 de JavaScript; el límite del archivo usa bytes.

El texto se conserva, no se interpreta ni se anuncia como HTML sanitizado. La interfaz debe renderizar cadenas como texto React, nunca mediante `dangerouslySetInnerHTML`. El inventario no está cifrado ni sincronizado y puede perderse al borrar datos del sitio. La exportación es la copia portable del usuario.

## Búsqueda literal, separada de IA

Normaliza mayúsculas y diacríticos del español, separa palabras y elimina conectores comunes. Cada término significativo debe coincidir exactamente con una palabra o ser un prefijo de al menos tres caracteres. No busca subcadenas arbitrarias ni inventa sinónimos. Campos: nombre (peso 6), etiquetas (5), ubicación (3), descripción (2), habitación (1). Prefijos pesan el 70 % de una coincidencia exacta; cada término aporta su mejor campo. Desempate por el orden de entrada. No modifica el inventario.

El puntaje es una prioridad de coincidencia literal, **no probabilidad, confianza ni porcentaje de IA**. Los resultados semánticos, si se habilitan en otra capa, deben diferenciarse de esta búsqueda. Una consulta sin términos útiles o sin coincidencias devuelve cero resultados; la interfaz puede mostrar todos los objetos ante una consulta vacía sin atribuirlo a esta función.

## Verificación

Pruebas en `src/domain.test.ts`: exportación/importación, UUID/fecha, tipos y límites, claves inesperadas, fechas imposibles, duplicados, bytes UTF-8, datos corruptos, permisos/cuota y preservación de la copia anterior; búsqueda con diacríticos, ubicaciones, usos, prefijos, orden y cero coincidencias.
