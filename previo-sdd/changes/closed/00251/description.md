- **Name**: Pestaña "Interacciones" en la modal de configuración de componentes
- **Code**: 00251
- **Type**: change
- **Creation date**: 2026-09-04

## Full description

En la modal de configuración de un componente (la que se abre al crear o editar un componente en Modo Edición) se añade una pestaña nueva llamada **"Interacciones"**, situada **antes** de la pestaña "Copias". El orden de pestañas pasa a ser: **Generales · Visuales · Específicas · Interacciones · Copias**.

La sección **"Interacciones programadas"**, que hoy aparece en la pestaña "Generales" (justo después de la sección "Etiquetas"), se traslada **completa** a esa nueva pestaña "Interacciones". Esa sección conserva su título ("Interacciones programadas") y todo su contenido tal cual:

- Un desplegable por cada interacción de click izquierdo que tenga programada el tipo de componente que se está editando (por ejemplo "Lanzar dado" en un dado, "Voltear carta" en una carta, "Sacar carta de arriba" en un mazo), con las opciones "Ninguna" y el nombre de la interacción.
- La fila fija **"Click derecho"**, común a todos los tipos de componente, con las opciones "Ninguno" y "Abrir menú contextual".

Tras el traslado, la pestaña "Generales" queda con: el identificador del componente, la sección "General" (Bloqueado, Oculto, Subir al mover/interactuar), la sección "Ayuda jugador" y la sección "Etiquetas". Deja de mostrar "Interacciones programadas".

### Comportamiento y alcance

- **La pestaña "Interacciones" se muestra siempre**, para los 8 tipos de componente. La sección "Interacciones programadas" ya se muestra hoy en todos los casos (por la fila fija de click derecho, común a cualquier tipo), así que la pestaña nunca queda vacía. No se añade ninguna lógica para ocultarla ni un mensaje de "sin propiedades".
- **La pestaña activa al abrir la modal no cambia**: sigue abriendo en "Generales".
- **No cambia nada del comportamiento funcional de estos ajustes**: los desplegables de interacción y el ajuste de click derecho siguen guardándose igual, se siguen sincronizando igual con los componentes tipo "Copia" y su efecto en Modo Juego (desactivar el click izquierdo de una interacción, o el click derecho) es idéntico. No cambia el formato de guardado de una partida ni hace falta ninguna migración de componentes ya existentes.
- **Modos y roles**: sin cambios. Esta modal solo existe en Modo Edición; el efecto de los ajustes en Modo Juego no varía.

Es, en la práctica, una reorganización de la interfaz de la modal: separa las interacciones a su propia pestaña para que la pestaña "Generales" quede más corta.

### Dudas de alcance resueltas con el usuario (todas confirmadas)

1. **Nombre.** La pestaña se llama "Interacciones". La sección movida conserva su título "Interacciones programadas".
2. **Qué se mueve.** El bloque "Interacciones programadas" entero (desplegables de click izquierdo por tipo + fila fija de click derecho). No se parte en dos.
3. **Cuándo aparece la pestaña.** Siempre, para los 8 tipos. Nunca queda vacía.
4. **"Generales" tras el traslado.** Queda con id, "General", "Ayuda jugador" y "Etiquetas". Sigue teniendo contenido; no se añade mensaje de relleno.
5. **Pestaña activa al abrir.** Sin cambios: "Generales".
6. **Datos / persistencia.** Ningún cambio: reubicación de UI pura.
7. **Roles / modos.** Sin cambios.
8. **Documentación funcional.** Hay que actualizar las descripciones de funcionalidad que hoy dicen que la sección "Interacciones programadas" está en la pestaña "Generales" tras "Etiquetas", para que reflejen su nueva ubicación en la pestaña "Interacciones" (antes de "Copias"), incluyendo la que enumera el conjunto de pestañas de la modal.

## Technical notes

- **Fichero principal**: `src/ui/componentModal.js`.
  - Las pestañas se crean con la función local `createTab(name, label)` (añade el botón a `tabs` y el contenedor a `contentArea` en orden de invocación). Hoy se crean en este orden: `general`, `visual`, `specific` (`renderSpecificTab`), `copias`. La nueva pestaña `interacciones` debe crearse **entre `specific` y `copias`** para que quede en la posición pedida.
  - El bloque de la sección "Interacciones programadas" está aproximadamente en las líneas 817–907 (un bloque `{ ... }` que construye `interactionsSection`, itera `typeInteractions = getInteractionsForType(workingComponent.type)` para los desplegables de click izquierdo, añade la fila fija de click derecho, y termina con `generalContent.appendChild(interactionsSection);`). Hay que cambiar ese `appendChild` para que cuelgue del contenido de la nueva pestaña `interacciones` en lugar de `generalContent`, y moverlo/ordenarlo de forma que se ejecute tras crear esa pestaña.
  - `getInteractionsForType` e `isInteractionActive` vienen de `src/core/interactions.js`; no cambian.
- **i18n**: añadir la clave `componentModal.tab.interacciones` en `src/data/i18n.es.js` ("Interacciones") y `src/data/i18n.en.js` ("Interactions"), junto a las demás `componentModal.tab.*` (ES: líneas ~547-550). La clave `componentModal.programmedInteractions` (título de la sección) ya existe y no cambia.
- **Documentación funcional a actualizar** (la hará `pv-do`): `previo-sdd/design/docs/features/002-alta-edicion-borrado-de-componentes-con-modal-de-tabs.md` (enumera las pestañas y dice que "Interacciones programadas" va tras "Etiquetas" en "Generales") y `previo-sdd/design/docs/features/014-interacciones-programadas-de-un-componente.md` (dice "En la pestaña 'Generales' ... tras la sección 'Etiquetas'").
- Sin impacto en modelo de datos, serialización de partidas ni sincronización de copias (esa lógica no se toca).
