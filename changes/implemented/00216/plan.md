- **Fecha creación**: 2026-08-15

## (a) Anotaciones funcionales

**Fuera de alcance:** control de tamaño de texto (descartado explícitamente por el usuario). Mezclar formatos dentro de una parte del título (p. ej. solo una palabra en negrita) — el formato se aplica siempre al texto completo del título, no a una selección. El campo "Ayuda"/tooltip de un componente no recibe estos interruptores ni cambia su mecanismo actual.

**Dudas resueltas con el usuario:**
- ¿Botones que insertan etiquetas HTML por selección, o interruptores que aplican el formato a todo el título? → Interruptores de todo el título, reutilizando el patrón `.align-group`/`.align-group__btn` ya usado para "Estilo de texto" (Negrita/Cursiva/Subrayado) de un `TextBox` de carta.
- ¿Se añade también un control de tamaño de texto? → No.

## (b) Solución técnica

- [x] **`src/core/component.js` — nuevas propiedades del componente.** En `createComponent()`: añadir parámetros `tituloNegrita = false`, `tituloCursiva = false`, `tituloSubrayado = false` a la firma (junto a `tituloFondoTransparencia`) y al objeto devuelto. En `syncCopyWithOriginal()`: añadir `tituloNegrita: original.tituloNegrita`, `tituloCursiva: original.tituloCursiva`, `tituloSubrayado: original.tituloSubrayado` al objeto devuelto (mismo grupo que las demás propiedades del título, siempre propagado a las copias vinculadas).
- [x] **`src/ui/componentTitleModal.js` — interruptores de formato.** En el objeto `working` (junto a `texto`/`colorTexto`/`colorFondo`/`fondoTransparencia`), añadir `negrita: titulo.tituloNegrita ?? false`, `cursiva: titulo.tituloCursiva ?? false`, `subrayado: titulo.tituloSubrayado ?? false`. Debajo del `<textarea>` del campo "Contenido" (`contentTextarea`), añadir un bloque `div.align-group` con un `.align-group__btn` por cada uno de los tres interruptores — mismo patrón que `STYLE_TOGGLE_OPTIONS`/`styleGroup` de `src/ui/cardTextBoxModal.js` (líneas ~245-289): icono SVG inline (reutilizar los mismos tres `<svg>` ya definidos ahí, mismo criterio visual), `classList.toggle('active', working[prop])` al pintar y en cada `click`, sin gestionar selección de texto ni cursor. En el callback `onAccept` del botón "Aceptar" (ya existente), incluir `tituloNegrita: working.negrita`, `tituloCursiva: working.cursiva`, `tituloSubrayado: working.subrayado` en el objeto pasado a `onAccept(...)`.
- [x] **`src/ui/componentModal.js` — propagar las tres propiedades nuevas.**
  - En la llamada a `openComponentTitleModal` (bloque `titleEditBtn.addEventListener`, ~línea 581), añadir `tituloNegrita: workingComponent.tituloNegrita`, `tituloCursiva: workingComponent.tituloCursiva`, `tituloSubrayado: workingComponent.tituloSubrayado` al objeto `titulo` pasado.
  - En su `onAccept` (~línea 589), añadir `workingComponent.tituloNegrita = result.tituloNegrita`, `workingComponent.tituloCursiva = result.tituloCursiva`, `workingComponent.tituloSubrayado = result.tituloSubrayado`.
  - En "Copiar estilo" (bloque `copyStyleBtn`, dentro de `if (selection.generales)`, ~línea 1651), añadir las tres propiedades al objeto `data.generales` junto a `tituloFondoTransparencia`.
  - En "Pegar estilo" (bloque `pasteStyleBtn`, dentro de `if (clip.generales)`, ~línea 1698), añadir `workingComponent.tituloNegrita = clip.generales.tituloNegrita`, `workingComponent.tituloCursiva = clip.generales.tituloCursiva`, `workingComponent.tituloSubrayado = clip.generales.tituloSubrayado` (sin sincronización de UI adicional: igual que el resto de campos del título, no hay campo visible en el modal principal que refrescar, solo el dato de `workingComponent`).
- [x] **`src/ui/componentRenderer.js` — aplicar el formato al renderizar.** En `attachComponentTitle` (línea ~287), tras fijar `label.style.color`/`label.style.backgroundColor`, añadir: `label.style.fontWeight = component.tituloNegrita ? 'bold' : 'normal';`, `label.style.fontStyle = component.tituloCursiva ? 'italic' : 'normal';`, `label.style.textDecoration = component.tituloSubrayado ? 'underline' : 'none';` — mismo patrón ya usado para `TextBox.negrita`/`.cursiva`/`.subrayado` (líneas ~462-464 de este mismo fichero).

Ordenado así porque el modelo de datos (a) debe existir antes de que el sub-modal (b) pueda leerlo/escribirlo, que a su vez debe estar completo antes de propagarlo desde el modal principal (c), y el renderizado (d) es independiente pero requiere que las propiedades ya existan en el componente.

## (c) Cambios de arquitectura

- `design/docs/architecture/01-component-model.md`:
  - Añadir `tituloNegrita: boolean`, `tituloCursiva: boolean`, `tituloSubrayado: boolean` al bloque de código del modelo (tras `tituloFondoTransparencia`).
  - Añadir tres filas a la tabla "Campos generales" (mismo formato que `tituloColorFondo`/`tituloFondoTransparencia`): default `false`, "Si el texto del título se pinta en negrita/cursiva/subrayado (formato de todo el título, no de una selección) — mismo patrón `.align-group` que 'Estilo de texto' de un `TextBox` de carta (`02-component-types.md`)", editado desde la sub-modal "Editar título de componente".
  - Añadir las tres propiedades nuevas a la nota de migración silenciosa ("ausencia del campo se comporta como su valor por defecto... sin necesidad de migración explícita"), junto a `tituloColorFondo`/`tituloFondoTransparencia`.
  - Añadir las tres propiedades nuevas a la lista "Siempre propagado" de la sección "Copias vinculadas" (`syncCopyWithOriginal`), junto a `tituloFondoTransparencia`.

## (d) Cambios en estilo

No aplica: esta solución reutiliza tal cual el patrón `.align-group`/`.align-group__btn` ya catalogado en `design/docs/style/03-modales-menus.md` §12.10 ("Interruptores independientes y combinables"), sin introducir ninguna clase, token ni variante visual nueva.

## (e) Verificación

- [x] Al abrir "Editar título de componente" de un componente sin título configurado, los tres interruptores (Negrita/Cursiva/Subrayado) aparecen debajo del campo "Contenido", en reposo (sin activar).
- [x] Activar uno o varios interruptores y pulsar "Aceptar" dentro de la sub-modal, luego "Aceptar" en el modal de propiedades: al activar "Mostrar título de componente" y volver a Modo Juego, la etiqueta del título se pinta con el/los formato(s) elegidos (negrita/cursiva/subrayado, combinables entre sí).
- [x] Volver a abrir "Editar título de componente" del mismo componente: los interruptores reflejan el estado guardado (activos los que se dejaron activos).
- [x] Con una "Copia" vinculada de ese componente: cambiar el estilo del título en el original y comprobar que la copia lo refleja igual tras la sincronización automática.
- [x] En una "Carta": "Copiar estilo" con "Generales" marcado, luego "Pegar estilo" sobre otra carta — el estilo de negrita/cursiva/subrayado del título se copia junto con el resto de campos de "Generales".
- [x] Un componente guardado antes de este cambio (sin las tres propiedades nuevas) sigue mostrando su título sin negrita/cursiva/subrayado (comportamiento por defecto), sin errores al cargar.
