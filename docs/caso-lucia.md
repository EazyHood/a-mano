# El adaptador que sí estaba en casa

**Caso de uso · A mano · 2 de octubre de 2026**

«Lucía» es un seudónimo. Jhona aportó este relato y confirmó que corresponde a una persona real que prefiere conservar su privacidad. La colección pública de demostración sigue usando datos sintéticos; no expone su inventario personal.

## Una necesidad pequeña, en un momento concreto

Lucía es diseñadora y trabaja desde el escritorio de su apartamento. En los cajones guarda cables, herramientas pequeñas y documentos. Las cosas que usa todos los días están a mano; las que necesita de vez en cuando son las que le cuesta encontrar.

Hoy quiere mostrar una presentación del portátil en el televisor. Sabe que tiene un adaptador, pero no recuerda cómo se llama ni en qué cajón lo dejó. Lo que tiene en la cabeza es «lo que conecta el computador al televisor», no «USB-C a HDMI».

Abre A mano y busca: `quiero mostrar la pantalla del computador en el televisor`. Con la búsqueda semántica activada, aparece la ficha del adaptador. La ubicación anotada es `Cajón superior del escritorio · estuche gris`. También hay un detalle que le conviene recordar antes de levantarse: necesita un cable HDMI aparte.

La ficha le da un lugar donde buscar. Después le toca abrir el estuche y comprobar las conexiones de sus equipos. Si cambia el adaptador de sitio al terminar, tendrá que actualizar su ubicación para encontrarlo la próxima vez.

Esa es la necesidad que aborda A mano: recordar dónde guardaste algo, incluso cuando recuerdas mejor para qué sirve que su nombre.

## Prueba el mismo recorrido

Abre [A mano](https://eazyhood.github.io/a-mano/) y mantén seleccionada **Explorar demo**. Esta colección incluye diez objetos sintéticos y está separada de **Mis cosas**, donde puedes crear tus propios registros.

1. Busca `estuche gris`. Aparece **Adaptador USB-C a HDMI**, porque esas palabras forman parte de su ubicación registrada. Esta búsqueda literal no necesita descargar el modelo.
2. Borra la búsqueda y pulsa **Activar** para habilitar la búsqueda semántica. La primera preparación descarga aproximadamente **160 MB** de modelo y componentes públicos; espera a que termine.
3. Escribe `quiero mostrar la pantalla del computador en el televisor`. El modelo sugiere el adaptador aunque la frase no coincida con su título.
4. Abre su ficha. Encontrarás la ubicación `Cajón superior del escritorio · estuche gris` y la indicación de que necesita un cable HDMI aparte.
5. Pasa a **Mis cosas** y crea un objeto de prueba sin información privada. Edita su ubicación y expórtalo desde **Copias de seguridad**. Así puedes recorrer también lo que ocurre después de encontrar y mover una cosa.

Para recuperar un objeto, primero hay que registrarlo. Mantener su ubicación al día es lo que permite que la siguiente búsqueda siga siendo útil.

## Qué aporta frente a una nota

Una nota funciona bien cuando recuerdas las palabras que escribiste. A mano conserva esa búsqueda directa y añade otra posibilidad: describir la función del objeto.

Lucía puede buscar «estuche gris» si recuerda dónde lo guardó, o explicar qué quiere conectar si solo recuerda para qué lo necesita. En ambos casos, el resultado es una ficha con la información registrada. La aplicación no inventa una ubicación.

El catálogo también permite recorrer la colección sin escribir una búsqueda. Muestra nombres y lugares, incluye filtros por habitación y reúne los detalles de cada objeto en su ficha. Las ilustraciones sirven de apoyo visual; no son fotografías de las pertenencias registradas.

Las transiciones acompañan el movimiento de las tarjetas y se desactivan cuando está habilitada la preferencia de movimiento reducido.

## Funcionamiento y límites

El repositorio contiene **55 pruebas unitarias** y comprobaciones de navegador para búsqueda, edición, persistencia, respaldo y ejecución real del modelo ONNX.

En una [evaluación sintética](ai-evaluation.md) con diez objetos, la búsqueda híbrida recuperó el objetivo en **9 de 11 consultas**. Hubo dos fallos. Es una muestra pequeña y sus resultados no equivalen a una evaluación con personas ni permiten afirmar cuánto tiempo ahorra la aplicación.

Los datos personales se guardan en este navegador, sin cifrado ni sincronización. Una ubicación desactualizada puede llevar al cajón equivocado, y el modelo puede sugerir un objeto incorrecto. La búsqueda literal permanece disponible.

La utilidad cotidiana depende de un hábito sencillo: guardar suficiente información para reconocer cada cosa y actualizar su lugar cuando se mueve.

---

Texto basado en la edición de Jhona, commit `3d63b970baffcbb52e86c48b1d5bfcff7d59aae9`, con formato y nota de privacidad añadidos. La confirmación del caso procede del autor; no se presenta como entrevista ni estudio independiente. Código, ilustraciones y preparación técnica con asistencia de OpenAI Codex.
