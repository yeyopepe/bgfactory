# Área 3 — Sistema de iconos

**Objetivo:** Reemplazar los ~30 SVGs inline dispersos por archivos JS por un conjunto coherente de iconos de una librería única, centralizados en un módulo, con tamaño y color consistentes en toda la app.

---

## Estado actual (resumen del análisis)

Los iconos actuales son SVGs dibujados a mano (o de fuentes variadas) directamente en strings/literales dentro de cada archivo JS de UI. Problemas:

- **Dispersión:** distribuidos en al menos 8 archivos distintos (`editModeToggle.js`, `appTitle.js`, `componentList.js`, `resourceList.js`, `tagList.js`, `tableColumnMenu.js`, `cardTextBoxModal.js`, `cardShapeModal.js`, `componentTypeModal.js`, `resourceModal.js`).
- **Inconsistencia de tamaño:** mezcla de `18×18` (iconos de editor visual) y `24×24` (iconos de toolbar), sin que ningún convenio esté documentado.
- **Estilo visual no unificado:** unos usan `stroke`, otros `fill`, grosor de trazo variable.
- **Colores:** algunos tienen colores hardcodeados en el SVG (`fill="#xyz"`), otros heredan el `currentColor`. Sin convenio.
- **Sin nombrado:** no hay constantes con nombres semánticos compartidos — cada archivo define sus propios literales SVG sin garantía de coherencia.
- **Mantenimiento:** modificar un icono implica localizar el string correcto dentro de un archivo JS no relacionado con iconos.

---

## 1. Librería a adoptar: Lucide

**Razón de la elección:**

| Criterio | Lucide | Phosphor | Heroicons |
|---|---|---|---|
| Licencia | MIT | MIT | MIT |
| Estilo | Línea, 2px stroke, esquinas redondeadas | Línea / fill / duotono / bold | Línea / sólido |
| Coherencia visual | ✅ muy alta (un solo estilo base) | ✅ alta (varios pesos pero coherentes) | ✅ alta |
| Nº de iconos | ~1.500 | ~9.000 | ~300 |
| Uso sin npm | ✅ SVG individual descargable, o CDN | ✅ igual | ✅ igual |
| Compatibilidad con `currentColor` | ✅ total | ✅ total | ✅ total |
| Grosor ajustable | ✅ vía `stroke-width` attribute | ✅ | ✗ (fijo) |

**Lucide** gana por coherencia visual extrema, soporte completo de `currentColor`, y grosor ajustable. Al no haber npm en el proyecto, la integración se hace extrayendo los SVG individuales necesarios y centralizándolos.

---

## 2. Convenio de uso

### 2.1 Tamaños

| Contexto | Tamaño | Variable CSS |
|---|---|---|
| Iconos en toolbar, botones grandes, selección de tipo de componente | `20×20` | — |
| Iconos en ítems de menú contextual, columnas de tabla, cabeceras | `16×16` | — |
| Iconos en botones de alineación y estilo dentro de modales | `16×16` | — |
| Iconos en zoom (resourceModal) | `18×18` | — |

**Dudas:**
- Los iconos actuales de toolbar son `24×24` y los de editor son `18×18`. ¿Unificamos en `20/16` como escala más limpia o mantenemos `24/18`?
- ¿Usamos `em` o `px` para `width`/`height` en el SVG? Con `em` el icono escala con el font-size del botón padre automáticamente.

### 2.2 Color

Todos los iconos usarán `currentColor` — heredan el color del texto del elemento padre. No habrá colores hardcodeados dentro de los SVG.

### 2.3 Grosor de trazo

Usar `stroke-width="1.75"` en todos los Lucide. El default de Lucide es `2`, pero `1.75` es ligeramente más delicado y encaja mejor con la UI actual.

**Dudas:** ¿1.75 o 2? Habría que ver ambas opciones renderizadas antes de decidir.

### 2.4 Accesibilidad

Todos los iconos que sean el único contenido de un botón deben tener su `<button>` con `aria-label` o `title`. Los iconos decorativos (junto a texto) llevan `aria-hidden="true"`.

---

## 3. Módulo central: `src/ui/icons.js`

Se creará un módulo único que exporte todos los iconos de la app como constantes de string (SVG inline). Ningún otro archivo importará o definirá SVGs directamente.

### 3.1 Estructura del módulo

```js
// src/ui/icons.js
// Todos los iconos de la app. Extraídos de Lucide (https://lucide.dev) — MIT License.
// Uso: import { icon } from './icons.js'; elemento.innerHTML = icon('zoom-in');

const ICONS = {
  // Toolbar
  'fit-view': `<svg ...>...</svg>`,
  'settings': `<svg ...>...</svg>`,
  'import': `<svg ...>...</svg>`,
  'export': `<svg ...>...</svg>`,
  'chevron-down': `<svg ...>...</svg>`,
  'door-open': `<svg ...>...</svg>`,  // modo juego

  // Paneles
  'x': `<svg ...>...</svg>`,          // limpiar filtro (3 paneles)
  'filter': `<svg ...>...</svg>`,     // indicador de columna filtrable

  // Editor de título de app
  'pencil': `<svg ...>...</svg>`,

  // Tipos de componente
  'text': `<svg ...>...</svg>`,
  'grid': `<svg ...>...</svg>`,       // tablero simple
  'layout-grid': `<svg ...>...</svg>`, // tablero personalizado
  'dice-5': `<svg ...>...</svg>`,
  'file-text': `<svg ...>...</svg>`,  // documento
  'credit-card': `<svg ...>...</svg>`, // carta
  'layers': `<svg ...>...</svg>`,     // mazo

  // Alineación de texto
  'align-left': `<svg ...>...</svg>`,
  'align-center': `<svg ...>...</svg>`,
  'align-right': `<svg ...>...</svg>`,
  'align-vertical-justify-start': `<svg ...>...</svg>`,
  'align-vertical-justify-center': `<svg ...>...</svg>`,
  'align-vertical-justify-end': `<svg ...>...</svg>`,

  // Estilo de texto
  'bold': `<svg ...>...</svg>`,
  'italic': `<svg ...>...</svg>`,
  'underline': `<svg ...>...</svg>`,

  // Formas
  'circle': `<svg ...>...</svg>`,
  'square': `<svg ...>...</svg>`,
  'square-rounded': `<svg ...>...</svg>`,

  // Zoom (resource modal)
  'zoom-in': `<svg ...>...</svg>`,
  'zoom-out': `<svg ...>...</svg>`,
  'rotate-ccw': `<svg ...>...</svg>`, // reset zoom

  // Acciones de contexto (menú contextual) — ver sección 4
  'copy': `<svg ...>...</svg>`,
  'clipboard-paste': `<svg ...>...</svg>`,
  'trash-2': `<svg ...>...</svg>`,
  'edit-2': `<svg ...>...</svg>`,
  'lock': `<svg ...>...</svg>`,
  'unlock': `<svg ...>...</svg>`,
  'eye-off': `<svg ...>...</svg>`,
  'eye': `<svg ...>...</svg>`,
  'flip-horizontal': `<svg ...>...</svg>`,
  'group': `<svg ...>...</svg>`,
  'ungroup': `<svg ...>...</svg>`,
  'move-up': `<svg ...>...</svg>`,
  'move-down': `<svg ...>...</svg>`,
  'move-to-front': `<svg ...>...</svg>`,
  'move-to-back': `<svg ...>...</svg>`,
};

export function icon(name, size = 16) {
  // Devuelve el SVG con width/height ajustados al size pedido.
  // Si el icono no existe, devuelve un cuadrado placeholder de aviso en dev.
}
```

**Dudas:**
- ¿La función `icon()` recibe el `size` en px o usa una clave de talla semántica (`'sm'`/`'md'`/`'lg'`)? Las claves semánticas son más estables si los tamaños cambian, pero menos flexibles.
- ¿Los SVGs se guardan como string en el módulo o como template literals sin interpolación? Los template literals permiten leer el archivo más fácilmente pero no hay diferencia funcional.

---

## 4. Inventario de iconos actuales y mapeo a Lucide

### Toolbar / switcher de modo

| Icono actual | Contexto | Lucide equivalente |
|---|---|---|
| Cuatro esquinas de marco (fit) | Botón ajustar zoom | `maximize-2` |
| Rueda dentada (settings) | Configuración | `settings` |
| Bandeja + flecha arriba (import) | Importar | `upload` o `folder-open` |
| Bandeja + flecha abajo (export) | Exportar | `download` |
| Chevron abajo (dropdown) | Indicador dropdown en exportar | `chevron-down` |
| Puerta + flecha derecha (play) | Modo juego | `log-out` o `play` |

**Dudas:**
- Para "Importar": ¿`upload` (bandeja con flecha arriba, igual que el actual) o `folder-open` (más intuitivo para "abrir un fichero")? El actual es `upload`, pero importar un JSON parece más "abrir" que "subir".
- Para "Modo juego": ¿`log-out` (salir del modo edición hacia el juego) o `play` (empezar a jugar)? Semánticamente "play" es más claro, pero el icono actual es una puerta de salida.

### Paneles flotantes (componentes, recursos, etiquetas)

| Icono actual | Contexto | Lucide equivalente |
|---|---|---|
| × (aspa) | Limpiar campo de filtro | `x` |
| Embudo | Indicador de columna filtrable/ordenable | `funnel` o `filter` |
| Lápiz | Editar título de la app (hover) | `pencil` |

### Tipos de componente

| Tipo | Icono actual | Lucide equivalente |
|---|---|---|
| `texto` | 4 líneas horizontales | `align-left` o `type` |
| `tableroSimple` | Rectángulo con rejilla 3×3 | `grid-3x3` |
| `tableroPersonalizado` | Rectángulo + lápiz | `layout-dashboard` |
| `dado` | Dado con 5 puntos | `dice-5` |
| `documento` | Folio con esquina doblada + líneas | `file-text` |
| `carta` | Rectángulo vertical + líneas | `credit-card` |
| `mazo` | Dos rectángulos superpuestos | `layers` |

**Dudas:**
- Para `tableroPersonalizado`: ¿`layout-dashboard` (más abstracto) o `pencil-ruler` (editar con precisión)? El actual intenta transmitir "tablero personalizable con lápiz".
- Para `texto`: ¿`align-left` (como las líneas actuales) o `type` (más literal — una T de texto)? `type` es más semántico pero `align-left` se parece más al icono actual.

### Editor de texto (cardTextBoxModal)

| Icono actual | Lucide equivalente |
|---|---|
| Alinear izquierda (texto) | `align-left` |
| Alinear centro (texto) | `align-center` |
| Alinear derecha (texto) | `align-right` |
| Alinear arriba (vertical) | `align-vertical-justify-start` |
| Alinear centro (vertical) | `align-vertical-justify-center` |
| Alinear abajo (vertical) | `align-vertical-justify-end` |
| Negrita (B) | `bold` |
| Cursiva (I) | `italic` |
| Subrayado (U) | `underline` |

### Tipos de forma (cardShapeModal)

| Icono actual | Lucide equivalente |
|---|---|
| Círculo | `circle` |
| Cuadrado | `square` |
| Cuadrado redondeado | `square` con `rx` — Lucide no tiene exactamente esto; alternativa: `rectangle-horizontal` con estilo |

**Dudas:**
- Para "cuadrado redondeado": Lucide no tiene un icono específico de rectángulo con radio visible. Opciones: (a) usar `square` con radio aplicado vía CSS, (b) dibujar este icono a mano manteniendo el estilo Lucide, (c) usar `credit-card` que visualmente transmite "rectángulo con bordes redondeados".

### Zoom (resourceModal)

| Icono actual | Lucide equivalente |
|---|---|
| Lupa + | `zoom-in` |
| Lupa − | `zoom-out` |
| Flecha circular (reset) | `rotate-ccw` |

### Menú contextual

El menú contextual recibe `SVGElement` (nodos DOM) desde los llamadores — cada archivo de modo/edición crea su propio SVG. Hay que auditar todos los llamadores a `openContextMenu()` para inventariar qué iconos usan actualmente.

**Pendiente de auditoría:** los archivos `src/modes/edit/editMode.js` y `src/modes/play/playMode.js` son los llamadores principales del menú contextual. El plan técnico deberá inventariar todos los ítems de menú y asignarles iconos Lucide. Como estimación, los ítems de menú contextual esperados son:

| Acción | Lucide propuesto |
|---|---|
| Editar / propiedades | `settings-2` o `edit-2` |
| Clonar | `copy` |
| Copiar estilo | `clipboard-copy` |
| Pegar estilo | `clipboard-paste` |
| Eliminar | `trash-2` |
| Bloquear / desbloquear | `lock` / `unlock` |
| Ocultar / mostrar | `eye-off` / `eye` |
| Voltear cara | `flip-horizontal` o `refresh-cw` |
| Agrupar | `group` |
| Desagrupar | `ungroup` |
| Subir / bajar capa | `arrow-up` / `arrow-down` |
| Insertar en mazo | `layers` + `plus` |
| Sacar de mazo | `layers` + `minus` |
| Tirar dado | `dice-5` |

**Dudas:**
- ¿Auditamos y confirmamos los ítems de menú contextual durante el plan funcional o lo dejamos para el plan técnico?

---

## 5. Integración con el build

El módulo `src/ui/icons.js` es un ES module normal — el `build.py` lo resuelve automáticamente como cualquier otro módulo en el grafo de dependencias. No requiere cambios en el build.

Los SVG strings en el módulo son literales JavaScript — no hay assets externos ni imports de ficheros `.svg`. El build los incluye tal cual al resolver el módulo.

---

## 6. Iconos que pueden necesitar diseño propio

Hay dos o tres casos donde Lucide no tiene un equivalente directo convincente:

| Caso | Problema | Alternativa |
|---|---|---|
| Cuadrado redondeado (tipo forma) | Lucide no tiene este icono | Dibujar a mano siguiendo el estilo Lucide (mismo stroke-width, viewBox 24×24) |
| Tablero personalizado | Ningún icono transmite exactamente "tablero editable" | Combinar `layout-grid` + `pencil`, o diseño propio |
| Resultado de dado | El dado actual es muy específico | `dice-5` de Lucide es válido aunque menos detallado |

**Regla:** Si se diseña un icono a mano, debe seguir exactamente el estilo de Lucide: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

---

## Dudas abiertas para la fase técnica

1. **Tamaño de icono:** ¿20/16px como escala nueva o mantener 24/18px actuales?
2. **Grosor de trazo:** ¿1.75 o 2 (default Lucide)?
3. **Función `icon()`:** ¿recibe tamaño en px o clave semántica?
4. **Importar vs. abrir:** para el botón de Importar, ¿`upload` o `folder-open`?
5. **Modo Juego:** ¿`play` o `log-out`?
6. **Tipo "texto":** ¿`type` (T) o `align-left` (líneas)?
7. **Tipo "tablero personalizado":** ¿`layout-dashboard` o diseño propio?
8. **Cuadrado redondeado:** ¿diseño propio o solución CSS sobre `square`?
9. **Menú contextual:** ¿auditar todos los ítems en este plan o dejarlo para el técnico?
10. **¿Hay más llamadores de `openContextMenu` fuera de `editMode.js` y `playMode.js`?** Si los hay, aumenta el inventario de iconos necesarios.
