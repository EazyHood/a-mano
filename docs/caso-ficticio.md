# El adaptador que sí estaba en casa

**Caso ficticio de demostración · A mano · 2 de octubre de 2026**

Lucía es un personaje inventado. Su situación sirve para explicar y probar el producto; no representa a una amiga, cliente o participante real. La aplicación y las comprobaciones técnicas enlazadas sí existen.

![Interfaz real de A mano mostrando su colección ficticia de demostración](../artifacts/redesign-desktop.png)

## Una necesidad pequeña, en un momento concreto

Imaginemos a Lucía, una diseñadora que trabaja desde el escritorio de su apartamento. Guarda cables, herramientas pequeñas y documentos en distintos cajones. No necesita catalogar toda su casa: quiere recordar dónde puso esas pocas cosas que usa de vez en cuando.

Hoy quiere mostrar una presentación del portátil en el televisor. Recuerda que tiene un adaptador, pero no su nombre ni dónde lo guardó. Una lista titulada «USB-C a HDMI» ayuda poco si lo que tiene en la cabeza es «lo que conecta el computador al televisor».

La hipótesis de A mano es sencilla: guardar el lugar junto con una descripción de para qué sirve el objeto permite recuperarlo por su uso. Lucía solo podría obtener esa ayuda si hubiera registrado el objeto previamente y mantuviera su ubicación al día.

## El recorrido que puedes reproducir

Abre [A mano](https://eazyhood.github.io/a-mano/) y mantén seleccionada **Explorar demo**. Sus diez objetos son ficticios y están separados de la colección personal.

1. Busca **`estuche gris`**. Aparece **Adaptador USB-C a HDMI**, porque esas palabras forman parte de su ubicación registrada. Esta búsqueda literal no necesita descargar el modelo.
2. Borra la búsqueda y pulsa **Activar** para habilitar la búsqueda semántica. La primera preparación descarga aproximadamente **160 MB** de modelo y componentes públicos; espera a que termine.
3. Escribe **`quiero mostrar la pantalla del computador en el televisor`**. Es la consulta indirecta usada en las pruebas: el modelo sugiere el adaptador aunque la frase no sea su título.
4. Abre su ficha. La ubicación anotada es **`Cajón superior del escritorio · estuche gris`**. La descripción también recuerda que necesita un cable HDMI aparte. La app muestra el registro; comprobar que el adaptador sigue allí corresponde a la persona.
5. Para probar el mantenimiento del inventario, pasa a **Mis cosas** y crea un objeto de prueba sin información privada. Edita su ubicación y expórtalo desde **Copias de seguridad**. Así puedes revisar también qué ocurre después de encontrar y mover una cosa.

En la historia, el siguiente paso de Lucía sería revisar el estuche y comprobar las conexiones de sus equipos. Encontrar una ficha no demuestra compatibilidad física ni que una presentación haya salido bien.

## Qué aporta frente a una nota

Una nota basta cuando recuerdas las mismas palabras que escribiste. A mano conserva esa búsqueda directa y añade una segunda entrada: describir la función del objeto. La salida sigue siendo una ficha editable con un lugar concreto, sin generar una ubicación nueva.

El catálogo visual ayuda a recorrer la colección: nombres y lugares visibles, ilustraciones decorativas, filtros por habitación y una ficha centrada en el objeto. Las transiciones acompañan el cambio de posición de las tarjetas; se desactivan con la preferencia de movimiento reducido. Las ilustraciones no son fotografías de las pertenencias de Lucía.

## Lo probado y lo que sigue siendo una hipótesis

El repositorio contiene **55 pruebas unitarias** y comprobaciones de navegador para búsqueda, edición, persistencia, respaldo y ejecución real del modelo ONNX. En la evaluación sintética de diez objetos, la búsqueda híbrida recuperó el objetivo en **9 de 11 consultas**; hubo dos fallos. Es una muestra pequeña, no una medición con personas. [Resultados y límites](ai-evaluation.md).

No se midieron minutos ahorrados, compras evitadas ni satisfacción de Lucía: no existe una usuaria real detrás del relato. La utilidad cotidiana deberá validarse con personas que decidan probar la app.

Los datos personales se guardan en este navegador, sin cifrado ni sincronización. Una ubicación desactualizada puede llevar al cajón equivocado. El modelo puede sugerir un objeto incorrecto; la búsqueda literal permanece disponible. [Privacidad, instalación y evidencia](../README.md).

---

Este caso es material de demostración del producto. **No es una candidatura a DEV Weekend / Build for a Friend:** esa convocatoria exige una persona real. Código, documentación e ilustraciones se prepararon con asistencia de OpenAI Codex; no se afirma autoría exclusivamente humana.
