# Áreas pendientes — 2, 5 y 7

Planes funcionales de las áreas que quedaron fuera de la primera iteración.

---

## Área 2 — Dark mode

**Objetivo:** Ofrecer una experiencia visual en modo oscuro coherente con el sistema de tokens, activable automáticamente por el sistema operativo y/o manualmente desde la app.

### 2.1 Estrategia de implementación

La app ya usa variables CSS en `:root` para todos sus colores principales — esto hace que el dark mode sea más asequible que en un CSS con valores hardcodeados. La estrategia es:

1. Los tokens del Área 1 definen los valores de light mode en `:root`.
2. Se añade un bloque `@media (prefers-color-scheme: dark)` que redefine solo los tokens que cambian.
3. Un atributo `[data-theme="dark"]` en `<html>` permite forzar el modo oscuro independientemente del sistema.
4. Un atributo `[data-theme="light"]` permite forzar el modo claro aunque el sistema esté en dark.
5. Sin `[data-theme]`, el sistema operativo manda.

### 2.2 Tokens que cambian en dark mode

No todos los tokens cambian — algunos como `--accent-blue` o `--error` pueden mantenerse o ajustarse levemente. Los que sí cambian son las superficies y los textos:

| Token | Light | Dark propuesto |
|---|---|---|
| `--bg-table` | `#c2c2c2` | `#1a1a1a` |
| `--bg-table-dot` | `rgba(0,0,0,0.09)` | `rgba(255,255,255,0.05)` |
| `--bg-toolbar` | `#333333` | `#111111` |
| `--bg-card` | `#f5f5f5` | `#2a2a2a` |
| `--bg-subtle` | `#f0f0f0` | `#222222` |
| `--bg-hover` | `#e8e8e8` | `#333333` |
| `--bg-surface` | `#ffffff` | `#1e1e1e` |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` |
| `--text-primary` | `#1a1a1a` | `#f0f0f0` |
| `--text-muted` | `#666666` | `#888888` |
| `--text-light` | `#ffffff` | `#ffffff` (sin cambio) |
| `--border-neutral` | `#dcdcdc` | `#3a3a3a` |
| `--accent-blue-light` | `#eaf3fc` | `#1a2d40` |
| `--accent-blue-dark` | `#123a66` | `#1a4a82` |
| `--gray-100` → `--gray-900` | escala clara | invertir/ajustar escala |

**Colores que NO cambian (o cambian poco):**
- `--accent-blue: #2c7dd8` — funciona en ambos modos
- `--error: #d32f2f` — puede aclararse ligeramente en dark (`#ef5350`)
- `--success: #2e7d32` — puede aclararse ligeramente en dark (`#43a047`)
- `--warning` y `--info` — ajuste similar

**Dudas:**
- ¿El tablero infinito (`.bg-table`) en dark mode debe ser negro/gris muy oscuro o mantener alguna textura de color? Una mesa de juego oscura podría ser `#1c2128` (azul muy oscuro, estilo GitHub dark) en vez de gris puro.
- ¿Los componentes del juego (cartas, dados, tableros) tienen colores propios configurados por el usuario? Esos no se pueden tocar — el dark mode solo afecta a la chrome de la app, no al contenido del juego.
- ¿El flip de carta tiene colores hardcodeados que también necesiten adaptar?

### 2.3 Toggle de dark mode

**Ubicación:** Botón icono-solo en la barra de herramientas (zona de `mode-switcher`), junto a los iconos de Ajustar zoom y Configuración. Alternativamente, dentro de `settingsModal`.

**Comportamiento:**
- 3 estados: Sistema / Claro / Oscuro (ciclo al hacer click, o selector en settings)
- Persistencia en `localStorage` bajo una clave como `bgfactory.theme`
- Al cargar la app, leer `localStorage` antes de que se pinte el DOM para evitar flash de color incorrecto (FOUC)

**Anti-FOUC:** El script que lee `localStorage` y aplica `[data-theme]` en `<html>` debe ejecutarse antes del primer paint. En el HTML de producción (que es un único archivo), este script inline debe estar en el `<head>` antes de cualquier `<link>` o `<script>` no crítico.

**Dudas:**
- ¿3 estados (Sistema/Claro/Oscuro) o solo toggle Claro/Oscuro? Los 3 estados son más correctos pero requieren un icono que transmita "modo sistema".
- ¿El toggle va en la toolbar principal o en el modal de configuración? En la toolbar es más accesible; en settings es más ordenado.

### 2.4 Elementos con mayor riesgo de regresión

- **Componentes del juego renderizados en la mesa:** tienen colores configurados por el usuario. Deben quedar exactamente igual en dark mode — el dark mode no toca estilos de `.component`.
- **Editor visual de caras (visualEditorModal):** el lienzo de edición debe mantener fondo blanco/claro independientemente del tema, porque las cartas se crean para imprimirse.
- **Checkerboard de imageAdjustModal:** usa colores explícitos en `repeating-conic-gradient`. Necesita adaptación.
- **Previews de recurso:** fondos blancos hardcodeados que en dark mode deben ser `var(--bg-surface)`.
- **Tipografía embebida:** la previsualización de fuentes en `diceFontModal` y `resourceModal` necesita fondo claro para legibilidad.

---

## Área 5 — Tooling de build

**Objetivo:** Evaluar si vale la pena migrar el bundler Python propio a Vite + `vite-plugin-singlefile`, y definir qué cambiaría en el flujo de trabajo.

**Clasificación:** Esta área es **opcional** y de mayor riesgo que las demás. No impacta en el producto visible por el usuario final — solo en la experiencia de desarrollo.

### 5.1 Situación actual

El build es un script Python (`src/scripts/build.py`) que:
1. Resuelve el grafo de imports ES desde `main.js`
2. Transforma módulos a un sistema CJS inline
3. Incrusta assets (imágenes, fuentes) como `data: URIs`
4. Produce un único `index-vNNNN.html` en `src/_output/versions/`

**Limitaciones actuales:**
- Sin hot reload en desarrollo — hay que recargar el navegador manualmente o usar un servidor simple
- Sin minificación real del JS/CSS
- Sin source maps
- Sin tree-shaking (se incluyen todos los módulos del grafo aunque no se usen)
- El sistema CJS inline que genera el build es frágil y difícil de mantener
- Sin soporte para TypeScript en el futuro

### 5.2 Propuesta: Vite + vite-plugin-singlefile

**Por qué Vite:**
- Servidor de desarrollo con HMR (Hot Module Replacement) — los cambios en CSS se reflejan en tiempo real sin recargar
- Build con Rollup bajo el capó — tree-shaking real, minificación, source maps
- `vite-plugin-singlefile` convierte el output en un único HTML autocontenido, manteniendo la filosofía del producto

**Qué cambia para el desarrollador:**
- `npm run dev` en vez de abrir `src/index.html` con un servidor
- `npm run build` en vez de `python src/scripts/build.py`
- El output sigue siendo un único `.html` en `dist/`

**Qué NO cambia para el usuario final:**
- Recibe exactamente el mismo archivo `.html` autocontenido
- Sin dependencias externas en el producto
- Funciona offline sin instalación

**Qué se necesita:**
- Introducir `package.json` y Node.js en el entorno de desarrollo
- `vite.config.js` con `vite-plugin-singlefile` configurado
- Adaptar los imports de assets (las imágenes y fuentes ya soportadas por Vite via `import`)
- Reescribir `build.py` o reemplazarlo — la lógica de auto-incremento de versión puede moverse a un plugin de Vite

**Qué puede ser complicado:**
- El sistema de versiones con contador propio (`v00261`) necesita replicarse en el flujo de Vite
- `javascript-obfuscator` (para el build ofuscado) tiene integración con Vite pero hay que verificarla
- El resto de scripts Python (`generate-version.py`, `package-version-zip.py`) deben adaptarse o reemplazarse

### 5.3 Criterio de decisión

Esta área vale la pena si se cumple al menos una de estas condiciones:
- El ciclo editar-ver en desarrollo consume tiempo significativo (si recargar cada vez es un cuello de botella)
- Se plantea TypeScript en el futuro
- El CSS monolítico se parte en módulos por componente (facilita la colocación junto al JS)

Si el ciclo de desarrollo actual es fluido con un servidor simple y recarga manual, el ROI de esta migración puede no justificar el riesgo.

**Dudas:**
- ¿Cuánto tarda el ciclo editar-ver actualmente? ¿Es un dolor real o solo teórico?
- ¿El entorno de desarrollo tiene Node.js disponible? Si no, la migración a Vite requiere instalar Node además de cambiar el build.
- ¿El build ofuscado (`build_obf.py`) es una variante del build principal o un paso separado? Hay que asegurarse de que `vite-plugin-singlefile` + `vite-plugin-obfuscator` pueden replicarlo.
- ¿La carpeta `src/_output/versions/` con histórico de HTMLs compilados es un requisito del flujo de trabajo o puede simplificarse?

---

## Área 7 — Identidad de producto

**Objetivo:** Dar a BG Factory la apariencia de un producto acabado y con identidad propia, más allá de una herramienta funcional.

### 7.1 Favicon

**Estado actual:** No se ha comprobado si existe favicon en el HTML de producción.

**Propuesta:** Diseñar un favicon propio embebido como `data: URI` en el `<head>` del HTML de producción.

**Opciones:**
- SVG favicon (soportado por todos los navegadores modernos): un icono simple derivado de la identidad visual — una B estilizada, un hexágono (evoca tablero), un dado, o un patrón de cuadrícula
- PNG en múltiples tamaños (16, 32, 180px para apple-touch-icon): más compatibilidad pero más peso

**Criterio:** El favicon debe funcionar a 16×16px — eso descarta cualquier diseño con texto o detalle fino.

**Dudas:**
- ¿Existe algún elemento visual de la app que ya pueda actuar como favicon (el icono de "mazo", el "dado", etc.)?
- ¿Se quiere coherencia con el icono del juego exportado, o son identidades separadas?

### 7.2 Pantalla de carga / estado de inicialización

**Estado actual:** La app carga directamente sin ningún estado visual de carga. En conexiones lentas (o con `localStorage` grande) puede haber un flash de contenido en blanco.

**Propuesta:** Añadir un estado de inicialización mínimo en el HTML:

- Un `<div id="app-loading">` con el nombre/logo de la app centrado en pantalla
- Este div es visible por defecto con CSS y se oculta cuando JS termina de montar la app (`document.getElementById('app-loading').remove()`)
- No requiere JS para mostrarse — es HTML puro, visible inmediatamente al cargar

**Contenido del estado de carga:**
- Nombre de la app ("BG Factory") en tipografía grande
- Icono/logo si existe
- Indicador de actividad sutil (el spinner actual reutilizado, o simplemente el nombre sin más)

**Dudas:**
- ¿Cuánto tarda la inicialización en un uso normal? Si es menos de 300ms, la pantalla de carga puede ser contraproducente (flash de carga que apenas se ve).
- ¿El estado de carga debe mostrar la versión actual de la app?

### 7.3 Modal de changelog

**Estado actual:** Ya existe como TODO en el sistema (`00231 — Botón y modal de changelog en la esquina superior derecha`), con estado "pendiente de análisis técnico".

**Descripción funcional (para este plan):**

- Botón discreto en la esquina superior derecha de la toolbar (icono de megáfono, campana, o simplemente "v00261")
- Al hacer click, abre un modal con el historial de cambios de la app
- El changelog se muestra en formato legible: versión + fecha + lista de novedades
- El modal marca la última versión leída en `localStorage` para mostrar un indicador de "hay cambios nuevos" en el botón (punto rojo / badge)

**Contenido del changelog:** texto mantenido manualmente en un archivo de datos (`src/data/changelog.js`), no generado automáticamente desde commits.

**Dudas:**
- ¿El changelog es público (visible siempre) o solo muestra "novedades desde tu última visita" (requiere comparar versión guardada en localStorage con la actual)?
- ¿Formato de fecha: ISO (`2026-09-05`) o legible (`5 de septiembre de 2026`)? ¿Internacionalizado o siempre en el idioma de la app?
- ¿El botón muestra solo el indicador de nuevos cambios o también la versión actual?

### 7.4 Modal "Acerca de" / créditos

**Estado actual:** La versión aparece en el footer (`<footer id="app-version">`). No hay más información de producto.

**Propuesta:** Un modal accesible desde el footer o desde el menú de configuración con:

- Nombre y versión de la app
- Descripción breve (una línea)
- Enlace al repositorio / página de proyecto (si existe)
- Créditos (autor/es)
- Librería de terceros incluida: Marked.js (con enlace y licencia MIT)
- En el futuro: Lucide icons (si se implementa el Área 3)

**Dudas:**
- ¿El modal de "Acerca de" va dentro de `settingsModal` (como una pestaña o sección) o es un modal independiente?
- ¿Hay página pública del proyecto (GitHub Pages, itch.io, etc.) a la que enlazar?

### 7.5 Consistencia del nombre de la app

**Estado actual:** El nombre aparece como "BG Factory" en el `h1` de la toolbar. No hay logo.

**Puntos a revisar:**
- ¿El nombre es definitivo o puede cambiar?
- ¿Hay tagline o descripción breve que acompañe al nombre en algún contexto (favicon title, meta description del HTML)?
- El `<title>` del HTML de producción — ¿qué dice actualmente? Debe reflejar nombre + versión.

---

## Dudas globales / cross-área

1. **Orden de implementación entre áreas:** Las áreas 1 (tokens) y 3 (iconos) son prerequisito de todas las demás. El Área 2 (dark mode) depende del Área 1 para ser viable sin duplicar valores. ¿Se confirma el orden: 1 → 3 → 4+6 en paralelo → 2 → 7 → 5 (opcional)?

2. **Compatibilidad de navegadores objetivo:** ¿La app soporta solo navegadores modernos (Chrome/Firefox/Edge recientes) o hay restricciones? Esto afecta a qué CSS puede usarse (ej. `backdrop-filter`, `scrollbar-width`, `:focus-visible`, `grid-template-rows` para animaciones).

3. **Versión del HTML de producción durante la migración:** Mientras se hacen cambios visuales, ¿se mantiene la numeración de versión actual (`v00261`, `v00262`...) o se reserva un salto de versión mayor para marcar el "nuevo look"?
