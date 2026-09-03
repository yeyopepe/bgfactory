- **Name**: Ajustes menores de i18n en el modal de Configuración y en los filtros por tipo
- **Code**: 00246
- **Type**: fast
- **Creation date**: 2026-09-03

## Full description

Cuatro retoques pequeños de textos e internacionalización en el modo edición:

1. **Modal de Configuración** — bajo el desplegable de idioma aparece un texto de ayuda ("El cambio se aplica al instante." en español, "Changes apply instantly." en inglés). Se elimina: el cambio de idioma ya se ve reflejado al instante y la frase no aporta nada.

2. **Combo del campo "Bloqueado" de un componente** — en inglés, la opción intermedia se muestra como "Play mode only". Debe mostrarse como "Only Play Mode". Solo cambia esa etiqueta del desplegable; los textos de ayuda del campo no forman parte de este ajuste.

3. **Filtro por tipo en la lista de componentes** — al abrir el filtro de la columna "Tipo", las opciones salían con el valor interno sin traducir ni normalizar (p. ej. "Carta", "Dado", "Documento", "Group", "Mazo", "TableroPersonalizado", "TableroSimple", "Texto"). Deben mostrarse con el nombre de tipo traducido al idioma activo, igual que en el resto de la interfaz. Las filas sintéticas de grupo siguen mostrándose con su etiqueta "Grupo"/"Group".

4. **Filtro por tipo en la lista de recursos** — mismo problema: las opciones del filtro de la columna "Tipo" salían fijas en español ("Imagen", "Tipografía") aunque la aplicación estuviera en inglés. Deben seguir el idioma activo.

En los cuatro casos el comportamiento funcional (qué se filtra, cómo se aplica) no cambia: solo el texto que se muestra.

## Technical notes

- Cambio 1: bloque `langHint` en `src/ui/settingsModal.js` (usa `t('settings.language.hint')`). Al quitarlo quedan huérfanas las claves `settings.language.hint` en `src/data/i18n.es.js` y `src/data/i18n.en.js`.
- Cambio 2: clave `option.bloqueado.juego` en `src/data/i18n.en.js` (valor `'Play mode only'` → `'Only Play Mode'`). El valor ES no se toca. `help.lockedField` / `help.group.lockedField` citan la etiqueta antigua en prosa pero quedan fuera de alcance.
- Cambio 3: `src/ui/componentList.js`, def de columna `tipo` usa `formatFilterLabel: capitalize` sobre el valor crudo `c.type`. Existen claves `componentType.<value>` en ambos catálogos. El valor real usado para filtrar (`getValue`) no debe cambiar, solo la etiqueta mostrada; hace falta fallback para el valor de las filas de grupo (ya traducido vía `componentList.groupRowType`).
- Cambio 4: `src/ui/resourceList.js`, `TYPE_LABELS` son literales en español fijos, usados tanto para mostrar como para el valor de filtro (`getValue`). Existen claves `resourceKind.image` / `resourceKind.font` en ambos catálogos. Mismo patrón de getter que documenta `previo-sdd/design/docs/architecture/010-internationalization-i18n.md` para arrays que alimentan `<select>`/menús.

## Applied changes

- **`src/ui/settingsModal.js`** — eliminado el bloque `langHint` (`<p class="modal__hint">` con `t('settings.language.hint')`) que se añadía bajo el `<select>` de idioma.
- **`src/data/i18n.es.js`** — eliminada la clave huérfana `'settings.language.hint'`.
- **`src/data/i18n.en.js`** — eliminada la clave huérfana `'settings.language.hint'`; cambiado el valor de `'option.bloqueado.juego'` de `'Play mode only'` a `'Only Play Mode'`.
- **`src/ui/componentList.js`** — nuevo `import { getComponentTypeLabel } from './componentTypeModal.js'` y helper `formatTypeFilterLabel(value)` que delega en él; la def de la columna `tipo` pasa a usar `formatFilterLabel: formatTypeFilterLabel` en lugar de `capitalize`. El valor real de filtrado (`getValue: (c) => c.type`) no cambia; `getComponentTypeLabel` devuelve el valor tal cual para las filas de grupo (que ya llegan traducidas). La celda "Tipo" de la tabla sigue mostrándose con `capitalize` (fuera del alcance pedido).
- **`src/ui/resourceList.js`** — `TYPE_LABELS` pasa de literales fijos (`'Imagen'` / `'Tipografía'`) a getters con clave computada que resuelven `t('resourceKind.image')` / `t('resourceKind.font')` en cada lectura. Afecta tanto a la etiqueta del filtro como a la celda "Tipo" y a la búsqueda por texto, todo lo que ya leía `TYPE_LABELS[type]`.

Verificado: `node --check` sobre los cinco archivos y `python src/scripts/build.py` completan sin errores.
