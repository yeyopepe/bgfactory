- **Name**: El icono del botón "Ajustar zoom" se ve mal en modo juego (regresión de 00228)
- **Code**: 00229
- **Type**: fix
- **Creation date**: 2026-09-02

## Full description

En el modo juego, el botón "Ajustar zoom" (el botón cuadrado azul de la esquina superior derecha, junto a "Entrar en modo edición") muestra su icono mal: el dibujo de las cuatro esquinas tipo marco de recorte aparece comprimido y descuadrado dentro del botón, en vez de verse centrado y a su tamaño normal.

Es una regresión introducida por el cambio 00228 (que unificó la posición y el color de ese botón entre modo juego y modo edición).

### Cómo reproducirlo

1. Abrir la app en modo juego (estado por defecto al arrancar).
2. Fijarse en el botón cuadrado azul de la esquina superior derecha.
3. El icono se ve aplastado / mal encajado dentro del botón.
4. Entrar en modo edición: ahí el mismo botón se ve bien. El fallo es solo en modo juego.

### Comportamiento esperado

El botón "Ajustar zoom" en modo juego debe verse igual que antes del cambio 00228 y que en modo edición: botón cuadrado, fondo azul, con el icono de encuadre centrado y a su tamaño, sin recorte ni deformación. Su función (reencuadrar la vista para ver todos los elementos) no cambia.

### Alcance

Solo corregir esta regresión visual. No se refactoriza el resto de estilos del botón ni se toca nada ajeno a la causa.

## Technical notes

- Fichero afectado: `src/styles/main.css`.
- Causa raíz: el cambio 00228 cambió el selector del bloque de reglas de tamaño del botón de `#mode-switcher .mode-switcher__fit-btn { padding:0; width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center }` a `.mode-switcher__fit-btn { ... }` (sin el ancestro `#mode-switcher`). En modo juego el botón sigue dentro de `#mode-switcher`, donde también aplica `#mode-switcher button { padding: 0.5rem 1rem; ... }` (especificidad 0,1,1). El selector nuevo `.mode-switcher__fit-btn` (0,1,0) pierde frente a él, así que el botón recibe `padding: 0.5rem 1rem` en vez de `padding: 0`. Con `width/height: 36px` fijos y `box-sizing: border-box` global (`* { box-sizing: border-box }`), el área de contenido queda ~4×20 px y el SVG `.icon-frame` (18×18, `display: block`) dentro del contenedor `inline-flex` centrado se aplasta/desborda.
- No afectados: el bloque de coordenadas/color de modo juego (`#mode-switcher button`) ni el de modo edición (`#edit-toolbar > .mode-switcher__fit-btn`). En `#edit-toolbar` el botón es hijo directo del contenedor `#edit-toolbar` (no de `.edit-toolbar`), así que `.edit-toolbar button { padding: 0.5rem 1rem }` no le aplica; y `#edit-toolbar > .mode-switcher__fit-btn` no declara `padding`, por lo que toma `padding: 0` de `.mode-switcher__fit-btn` sin competencia. Modo edición se ve bien.
- Fix de menor riesgo (a decidir por `pv-how`): que el bloque de reglas de tamaño vuelva a tener especificidad suficiente para ganar a `#mode-switcher button` — p. ej. selector `#mode-switcher .mode-switcher__fit-btn, #edit-toolbar > .mode-switcher__fit-btn { padding:0; width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center }`. La sub-regla del icono (`.mode-switcher__fit-btn .icon-frame`) puede seguir siendo autónoma (no compite con nada).
- Inconsistencia doc-vs-código a corregir como parte del fix: el cambio 00228 escribió en `design/docs/style/02-componentes-layout.md` §9 (bullet "Botón flotante cuadrado independiente", sub-punto de `.mode-switcher__fit-btn`) que "las reglas de tamaño de la clase son autónomas (selector `.mode-switcher__fit-btn`, sin ancestro `#mode-switcher`)". Esa frase queda desactualizada: el selector de tamaño debe volver a enumerar los contenedores (`#mode-switcher .mode-switcher__fit-btn, #edit-toolbar > .mode-switcher__fit-btn`) para ganar por especificidad a `#mode-switcher button`. `pv-how` debe incluir la corrección de esa frase en su plan (sección d).
- Sin implicaciones de seguridad (cambio puramente CSS de layout).
