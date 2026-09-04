- **Creation date**: 2026-09-04
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:** no se toca la lógica de interacciones (`core/interactions.js`), ni la sincronización de componentes tipo "Copia" (`core/component.js` → `syncCopyWithOriginal`), ni el modelo de datos, ni la serialización/persistencia de partidas. No se modifica el contenido de las pestañas "Generales" (salvo quitarle la sección movida), "Visuales", "Específicas" ni "Copias". No se añade lógica para ocultar la pestaña nueva según el tipo, ni un mensaje de "sin propiedades": la sección "Interacciones programadas" ya se muestra siempre hoy (fila fija de click derecho, común a los 8 tipos), así que la pestaña nunca queda vacía.

**Doubts resolved with the user:** todas confirmadas en la fase de `pv-new` (ver `description.md`, sección "Dudas de alcance resueltas"):
- Pestaña "Interacciones", sección conserva el título "Interacciones programadas".
- Se mueve el bloque entero (desplegables de click izquierdo por tipo + fila fija "Click derecho").
- La pestaña se muestra siempre, para los 8 tipos.
- La pestaña activa al abrir la modal no cambia (sigue en "Generales").
- Sin cambios de datos ni de comportamiento funcional de los ajustes.

## (b) Technical solution

- [x] **`src/data/i18n.es.js` — añadir la clave de la pestaña nueva.** En el bloque de claves `componentModal.tab.*` (junto a `componentModal.tab.general`/`visual`/`specific`/`copias`, ~líneas 547-550), añadir:
  ```js
  'componentModal.tab.interacciones': 'Interacciones',
  ```
  `CATALOG_ES` es el catálogo canónico y debe estar completo.

- [x] **`src/data/i18n.en.js` — añadir la misma clave en inglés.** En la posición equivalente del bloque `componentModal.tab.*`:
  ```js
  'componentModal.tab.interacciones': 'Interactions',
  ```

- [x] **`src/ui/componentModal.js` — crear la pestaña "Interacciones" entre "Específicas" y "Copias".** Hoy, en `openComponentModal`, las pestañas se crean en este orden con la función local `createTab(name, label)` (cada llamada añade el botón a `tabs` y el contenedor a `contentArea`, por lo que el orden de llamadas determina el orden visual):
  - `createTab('general', t('componentModal.tab.general'))` (~línea 335)
  - `createTab('visual', t('componentModal.tab.visual'))` (~línea 340)
  - `createTab('specific', t('componentModal.tab.specific'))` (~línea 945)
  - `createTab('copias', t('componentModal.tab.copias'))` (~línea 949)

  Añadir, **entre** la creación de `specific` y la de `copias`, una nueva:
  ```js
  createTab('interacciones', t('componentModal.tab.interacciones'));
  const interaccionesContent = tabContents.get('interacciones').content;
  ```
  Debe quedar antes de `createTab('copias', ...)` para que la pestaña aparezca en la posición pedida (Generales · Visuales · Específicas · Interacciones · Copias).

- [x] **`src/ui/componentModal.js` — mover la construcción de la sección "Interacciones programadas" a la pestaña nueva.** Hoy el bloque `{ ... }` que construye `interactionsSection` está en ~líneas 822-907 (dentro de él: `const typeInteractions = getInteractionsForType(workingComponent.type);` justo antes, el `for (const interaction of typeInteractions)` de los desplegables de click izquierdo, y el bloque de la fila fija de click derecho `rightClickField`), y termina con:
  ```js
  generalContent.appendChild(interactionsSection);
  ```
  Cambios:
  1. Cambiar esa última línea por `interaccionesContent.appendChild(interactionsSection);`.
  2. Asegurar que ese bloque se ejecuta **después** de haber creado la pestaña `interacciones` (paso anterior), de modo que `interaccionesContent` ya exista. Como hoy el bloque está situado antes de `createTab('specific')`, hay que moverlo (el bloque entero, incluida la línea `const typeInteractions = ...` y el `{ ... }` que lo envuelve) a una posición posterior a `createTab('interacciones', ...)` / `const interaccionesContent = ...`. Todo lo que referencia (`workingComponent`, `getInteractionsForType`, `isInteractionActive`, `createHelpIcon`, `t`) sigue estando en ámbito en esa nueva posición.
  3. No cambiar nada del interior del bloque (etiquetas, opciones, listeners que escriben en `workingComponent.interaccionesDesactivadas` y `workingComponent.accionClickDerecho`): solo su ubicación y el contenedor destino del `appendChild` final.

- [x] **`src/ui/componentModal.js` — verificar que "Generales" queda coherente sin la sección movida.** Tras el traslado, el orden de `generalContent.appendChild(...)` debe quedar: `idField`, `infoSection`, `helpSection`, `tagSection`. Ya no debe haber ningún `generalContent.appendChild(interactionsSection)`. No hace falta añadir mensaje de relleno (la pestaña sigue teniendo contenido).

## (c) Architecture changes

`previo-sdd/design/docs/architecture/006-ui-layer.md` — la entrada `ui/componentModal.js` (líneas ~97-101) dice literalmente **"four** tabs ... in order `general`/`visual`/`specific`/`copias`"** y describe la sección "Interacciones programadas" como parte de la pestaña `"Generales"`. Actualizar:
- Cambiar "four tabs" → "five tabs" y el orden a `general`/`visual`/`specific`/`interacciones`/`copias`, añadiendo `componentModal.tab.interacciones` a la lista de claves i18n.
- Quitar "+ section 'Interacciones programadas' (per-type left-click interaction toggle, `accionClickDerecho`)" de la descripción de `"Generales"`.
- Añadir un punto nuevo `"Interacciones"`: sección "Interacciones programadas" — un desplegable por interacción de click izquierdo del tipo (opciones "Ninguna"/nombre) + fila fija "Click derecho" (`accionClickDerecho`), común a los 8 tipos; se muestra siempre.

`previo-sdd/design/docs/architecture/010-internationalization-i18n.md` — no requiere cambio (no enumera las claves `componentModal.tab.*` una a una).

## (d) Style changes

`previo-sdd/design/docs/style/003-modales-menus.md` — §"Sections inside property tabs" → "Number + button that opens a separate modal", el punto que dice *"That block now lives in its own 'Copias' tab of the properties modal (no longer inside the 'Generales' tab)"* (línea ~218) documenta el precedente de mover una sección de "Generales" a su propia pestaña. Añadir, en el mismo espíritu, una nota de que la sección "Interacciones programadas" también se ha trasladado de la pestaña "Generales" a una pestaña propia "Interacciones" (cambio 00251), situada antes de "Copias". No se introduce ningún patrón visual nuevo: la pestaña usa el mismo `.modal__tab`/`switchTab` existente y la sección el mismo `fieldset.modal__section` de siempre.

## (e) Verification

- [x] Abrir la modal de configuración de un componente (crear uno nuevo o editar uno existente, en Modo Edición): el conmutador de pestañas muestra 5 pestañas en el orden **Generales · Visuales · Específicas · Interacciones · Copias**, y la pestaña activa al abrir sigue siendo "Generales".
- [x] En la pestaña "Generales" ya **no** aparece la sección "Interacciones programadas" (queda: id, "General", "Ayuda jugador", "Etiquetas").
- [x] Al pulsar la pestaña "Interacciones" se muestra la sección "Interacciones programadas" con su título, el/los desplegable(s) de click izquierdo correspondientes al tipo (p. ej. "Lanzar dado" en un dado; ninguno en un cuadro de texto) y la fila fija "Click derecho" con opciones "Ninguno"/"Abrir menú contextual", cada campo con su icono de ayuda "?".
- [x] Para un tipo sin interacciones de click izquierdo (cuadro de texto, tablero simple, visor de documentos), la pestaña "Interacciones" sigue mostrándose y contiene al menos la fila "Click derecho" (no queda vacía).
- [x] Cambiar un desplegable de interacción a "Ninguna" y/o "Click derecho" a "Ninguno", aceptar la modal, volver a abrirla: los valores elegidos se conservan (se leen de `workingComponent`/estado igual que antes). En Modo Juego, el efecto de esos ajustes (el dado no se lanza / el botón derecho no abre el menú) es el mismo que antes del cambio.
- [x] En un componente tipo "Copia", los ajustes de la pestaña "Interacciones" siguen sincronizándose con su original igual que antes (usar "Sincronizar todas las copias" desde la pestaña "Copias" y comprobar que la copia hereda el ajuste).
- [x] Cambiar el idioma de la app (Configuración → Español/English): la pestaña se rotula "Interacciones" / "Interactions" respectivamente.
