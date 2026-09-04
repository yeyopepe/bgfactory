- **Creation date**: 2026-09-04
- **Risk**: 0/10 — Sin riesgo: cambio totalmente aislado, imposible que afecte a nada más

## (a) Functional notes

**Out of scope:** el separador análogo de modo juego (el `.toolbar-divider` de `#mode-switcher` entre el bloque de fichero y el bloque de acciones Modo/Ajustar zoom/Configuración) no se toca. La regla CSS `.toolbar-divider` se conserva intacta porque sigue siendo usada por ese separador de modo juego. No se modifica ningún otro elemento de la barra `.edit-toolbar` (botones Importar/Exportar en sí, iconos, esquema de color) ni se hace ningún refactor no relacionado.

**Doubts resolved with the user:** (1) ¿Afecta también a modo juego? No, solo a la barra de modo edición. (2) ¿Qué separación queda entre "Importar" y "Exportar"? La estándar de la barra (el `gap` del contenedor flex), sin línea divisoria ni separación extra. (3) ¿Se mantienen los dos wrappers `.toolbar-group`? Se fusionan en uno solo para que ambos botones queden en el mismo contenedor flex con `gap` uniforme.

## (b) Technical solution

- [x] **`src/ui/editModeToggle.js` — eliminar el separador y fusionar los grupos en `renderEditToolbar`.** En la función `renderEditToolbar`, sustituir el bloque actual (creación de `persistenceGroup` con `createImportControls()`, luego `toolbar.appendChild(document.createElement('div')).className = 'toolbar-divider';`, luego `exportGroup` con `createExportMenu()`) por un único `.toolbar-group` que contenga primero `createImportControls()` y después `createExportMenu()`. Resultado equivalente a:
  ```js
  const fileGroup = document.createElement('div');
  fileGroup.className = 'toolbar-group';
  fileGroup.appendChild(createImportControls());
  fileGroup.appendChild(createExportMenu());
  toolbar.appendChild(fileGroup);
  ```
  No se añade ningún `.toolbar-divider` en esta barra. `createImportControls()` y `createExportMenu()` no se modifican.
- [x] **`src/ui/editModeToggle.js` — actualizar el comentario de cabecera de `renderEditToolbar`.** El comentario que describe el layout de la barra de modo edición como `[Importar] │ [Exportar]` (con separador) debe pasar a describirlo como `[Importar] [Exportar]` contiguos, sin separador. Revisar también el comentario de bloque previo a `renderModeSwitcher` (línea ~283, `// [Importar] [Exportar] | (separador, solo en modo juego) ...`): ya refleja correctamente que el separador es solo de modo juego; ajustar la redacción solo si al leerlo entero diera a entender que también hay separador en la `.edit-toolbar`.
- [x] **`src/styles/main.css` — verificar que la regla `.toolbar-divider` se mantiene.** No se elimina ni se modifica: la usa `renderModeSwitcher` (modo juego). Comprobar que no queda ninguna regla CSS específica que dependa de la existencia de dos `.toolbar-group` dentro de `.edit-toolbar` (p. ej. selectores tipo `.edit-toolbar .toolbar-group + .toolbar-group`); si existiera alguna, es código muerto tras la fusión y debe eliminarse. La regla base `.toolbar-group` (`display: flex; align-items: center; gap: 0.5rem`) se conserva.
- [x] **`src/data/version.js` — incremento de versión.** `v00257` → `v00258`. Actualizar `CURRENT_VERSION` según la convención del proyecto para reflejar este cambio (siguiente número de build).

## (d) Style changes

`previo-sdd/design/docs/style/002-componentes-layout.md`, sección "Header control row (`#mode-switcher`, reorganized 00244)":

- Bullet **"Header control-row separator"**: mantiene que el `.toolbar-divider` está presente "only in play mode". Revisar la frase final ("in edit mode the file block is in the `.edit-toolbar` band, not the header row, so no separator there") para que quede claro que **tampoco** hay separador dentro de la propia banda `.edit-toolbar` entre Importar y Exportar.
- Bullet **"Edit mode: `.edit-toolbar` band keeps only `[Importar] │ [Exportar]` (its own `.toolbar-divider` between the two groups, unchanged)"**: reescribir para que diga que la banda `.edit-toolbar` contiene `[Importar] [Exportar]` contiguos, en un único `.toolbar-group`, **sin** `.toolbar-divider` entre ambos (cambio 00254). El `.toolbar-divider` ya solo existe en `#mode-switcher` en modo juego.
- Tabla de botones, fila **"Importar" / "Exportar"**: no menciona el divisor; no requiere cambios salvo revisión.
- Sección "Z-index of overlays", fila `101` "Header control row": la enumeración `Importar/Exportar/separator/Modo/Ajustar zoom/Configuración` describe el `#mode-switcher` poblado en modo juego. Dejar claro (con un inciso "(en modo juego)") que ese `separator` es el de modo juego, no el de la `.edit-toolbar`.

## (e) Verification

- [x] En modo edición, la barra de herramientas superior muestra "Importar" y "Exportar" uno junto al otro sin ninguna línea vertical entre ellos, con la misma separación que hay entre otros elementos de la barra.
- [x] En modo juego, la fila de controles de la esquina superior derecha sigue mostrando la línea separadora vertical entre el bloque Importar/Exportar y los botones Modo / Ajustar zoom / Configuración (sin cambios respecto a antes).
- [x] Los botones "Importar" y "Exportar" en modo edición siguen funcionando: "Importar" abre el selector de fichero y "Exportar" despliega su menú.
- [x] La consola del navegador no muestra errores al entrar y salir de modo edición.
- [x] `previo-sdd/design/docs/style/002-componentes-layout.md` ya no describe un `.toolbar-divider` entre Importar y Exportar en la banda `.edit-toolbar`.
