- **Creation date**: 2026-08-27
- **Risk**: 1/10 — Riesgo mínimo

## (a) Functional notes

**Out of scope:** no se toca ninguna otra lógica de agrupar/desagrupar (reglas `canGroup`/`canUngroup` de habilitación del menú, disolución automática al quedar ≤1 miembro, edición de propiedades del grupo vía su modal, `deriveMissingGroups`/backfill). No se modifica `ui/progressModal.js` ni se crea una variante nueva del patrón: se reutiliza `runWithProgressModal` tal cual. La operación sigue siendo **síncrona y bloqueante** mientras dura — no se trocea el trabajo en lotes ni se cede el hilo al navegador; la modal solo añade el aviso visual, exactamente igual que en el precedente "añadir cartas a un mazo" (00219) y "confirmar importación" (00222).

**Doubts resolved with the user:** confirmado en `description.md` que (1) se aplica en los 3 puntos de entrada (menú contextual "Agrupar", menú contextual "Desagrupar", botón "Desagrupar" de la fila de grupo en el panel "Componentes"); (2) se reutiliza el patrón existente sin mecanismo asíncrono nuevo; (3) no hay casos borde de error/cancelación a mitad porque la operación se ejecuta de un tirón. Sin dudas abiertas nuevas surgidas en el análisis técnico.

**Nota de configuración (no bloquea este cambio):** `.claude/pv-context.json` tiene `docs.tech.architectureDocDir` = `design/docs/architecture` y `styleBibleDocDir` = `design/docs/style`, pero esas carpetas reales viven bajo `previo-sdd/design/docs/…` (dentro de `workFolder`). La ruta correcta del fichero de estilo a actualizar en la sección (d) es **`previo-sdd/design/docs/style/03-modales-menus.md`**. Conviene ejecutar `pv-update` para corregir esas rutas en `pv-context.json`.

## (b) Technical solution

Contexto que gobierna las 3 tareas (idéntico criterio en las tres): `runWithProgressModal(text, work)` (`src/ui/progressModal.js`) es **síncrona**, ejecuta `work()` dentro de un doble `requestAnimationFrame` anidado tras insertar el overlay, y hace `overlay.remove()` en `finally`. Cada `replaceComponent` / `addGroup` / `removeGroup` / `reorderGroupBlock` (`src/core/state.js`) emite síncronamente `components:changed` / `groups:changed`, a los que `main.js` tiene suscrito `renderAll` + `persistState` — ese re-render completo + autoguardado síncrono es la parte lenta y **debe quedar dentro de `work`**. Toda lectura previa (ids, `order`, `count`) se calcula **antes** de `work`. `runWithProgressModal` ya está importado en `editMode.js` (línea 34): no hace falta ningún import nuevo.

- [x] **`src/modes/edit/editMode.js` — envolver el `onClick` de "Agrupar" del menú contextual con `runWithProgressModal`.** En la entrada `label: 'Agrupar'` de `generalItems` (handler `onClick` actual en las líneas ~658-666), sustituir el cuerpo por: calcular `count` antes y mover el resto dentro de `work`:
  ```js
  onClick: () => {
    const count = affectedComponents.length;
    const text = `Agrupando ${count} elemento${count === 1 ? '' : 's'}…`;
    runWithProgressModal(text, () => {
      const newGroupId = nextGroupId(getComponents());
      const minOrder = Math.min(...affectedComponents.map((c) => c.order));
      for (const c of affectedComponents) {
        replaceComponent(c.id, updateComponent(c, { groupId: newGroupId }));
      }
      addGroup(createGroup({ id: newGroupId }));
      reorderGroupBlock(affectedComponents.map((c) => c.id), minOrder);
    });
  },
  ```
  `affectedComponents` ya está disponible en el closure (línea 589), es la misma lista que usa el cuerpo actual. No cambia `disabled: !canGroup`.
- [x] **`src/modes/edit/editMode.js` — envolver el `onClick` de "Desagrupar" del menú contextual con `runWithProgressModal`.** En la entrada `label: 'Desagrupar'` de `generalItems` (handler `onClick` actual en las líneas ~672-678), mismo patrón; `groupId` se lee de `selectedGroup?.id` **antes** de `work` (valor cerrado, no depende de estado que mute durante la operación), igual que el código actual:
  ```js
  onClick: () => {
    const groupId = selectedGroup?.id;
    const count = affectedComponents.length;
    const text = `Desagrupando ${count} elemento${count === 1 ? '' : 's'}…`;
    runWithProgressModal(text, () => {
      for (const c of affectedComponents) {
        replaceComponent(c.id, updateComponent(c, { groupId: null }));
      }
      if (groupId != null) removeGroup(groupId);
    });
  },
  ```
  No cambia `disabled: !canUngroup`.
- [x] **`src/modes/edit/editMode.js` — envolver el callback `onUngroup` pasado a `renderComponentList` con `runWithProgressModal`.** En `onUngroup` (dentro de `renderList`, líneas ~802-810), `memberIds` es `component.__members.map((m) => m.id)` (viene de `ui/componentList.js:245`). Calcular `first`/`groupId`/`count` antes de `work` (lecturas, no mutan nada) y meter solo el bucle de mutación + `removeGroup` en `work`:
  ```js
  onUngroup: (memberIds) => {
    const first = getComponents().find((comp) => comp.id === memberIds[0]);
    const groupId = first?.groupId;
    const count = memberIds.length;
    const text = `Desagrupando ${count} elemento${count === 1 ? '' : 's'}…`;
    runWithProgressModal(text, () => {
      for (const id of memberIds) {
        const c = getComponents().find((comp) => comp.id === id);
        if (c) replaceComponent(id, updateComponent(c, { groupId: null }));
      }
      if (groupId != null) removeGroup(groupId);
    });
  },
  ```

## (c) Architecture changes

No aplica: el cambio no toca la arquitectura por capas ni ningún contrato descrito en `previo-sdd/design/docs/architecture/`. Reutiliza un patrón de la capa `ui` ya existente y ya documentado desde otro modo, sin nuevas dependencias entre módulos.

## (d) Style changes

**`previo-sdd/design/docs/style/03-modales-menus.md`**, §12.1.2 ("Modal de operación en curso"). Esa sección documenta el patrón en genérico y enumera sus usos ("Primer uso: arrastrar una selección múltiple de cartas sobre un mazo…", "Segundo uso: confirmar importación de fichero…"). Añadir un tercer punto a esa lista de usos:

> - Tercer uso: agrupar y desagrupar una selección en modo edición (`src/modes/edit/editMode.js`, cambio 00224) — texto `"Agrupando N elemento(s)…"` / `"Desagrupando N elemento(s)…"`, `work` ejecuta la reasignación de `groupId` de los componentes afectados más el alta/baja del registro de grupo (`addGroup`/`removeGroup`) y, al agrupar, la recolocación del bloque (`reorderGroupBlock`). Aplica en los tres puntos de entrada de agrupar/desagrupar (opción "Agrupar" y "Desagrupar" del menú contextual, botón "Desagrupar" de la fila de grupo en el panel "Componentes"), sin variante nueva del patrón.

No se documenta como excepción: solo se amplía la lista de usos existente.

## (e) Verification

- [x] En modo edición, seleccionar 2 o más unidades sueltas (ninguna ya agrupada) y elegir "Agrupar" en el menú contextual: aparece brevemente la modal `.progress-modal` con spinner y texto "Agrupando N elemento(s)…" (N = nº de elementos afectados), se cierra sola al terminar, y los elementos quedan agrupados exactamente igual que antes del cambio.
- [x] Con un único grupo seleccionado, elegir "Desagrupar" en el menú contextual: aparece la modal con texto "Desagrupando N elemento(s)…" (N = nº de miembros del grupo), se cierra sola, y los elementos quedan desagrupados igual que antes del cambio (el registro de grupo desaparece).
- [x] Con un grupo formado, pulsar el botón "Desagrupar" de su fila en el panel flotante "Componentes": mismo comportamiento y mismo texto que el punto anterior, disparado desde este segundo punto de entrada.
- [x] Con N = 1 (caso límite, p. ej. desagrupar un grupo de un solo miembro si se llega a ese estado): el texto dice "1 elemento…" (singular), no "1 elementos…".
- [x] Ninguna otra acción del menú contextual ni del panel "Componentes" (Ocultar/Mostrar, Clonar, Copiar, Eliminar, Editar grupo, Añadir a etiqueta, Voltear carta) muestra la modal — solo agrupar y desagrupar.
- [x] Tras agrupar o desagrupar con la modal, el autoguardado sigue ocurriendo (recargar la página y comprobar que el estado agrupado/desagrupado persiste) y la pantalla queda re-renderizada correctamente (selección, contornos, panel "Componentes" actualizados).
- [x] El resto del comportamiento de grupos (habilitación de "Agrupar"/"Desagrupar" según la selección, disolución automática al quedar ≤1 miembro, edición de propiedades del grupo) sigue funcionando igual que antes del cambio.
