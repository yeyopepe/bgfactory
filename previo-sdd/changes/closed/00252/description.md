- **Name**: Renombrar pestaña "Visuales" a "Apariencia", sección "Visual" a "Efecto" y adelantarla antes de "Extrusión"
- **Code**: 00252
- **Type**: change
- **Creation date**: 2026-09-04

## Full description

Cambio puramente de interfaz en el modal de creación/edición de componentes, sin ningún efecto sobre los datos, las propiedades de los componentes ni lo que se guarda. Solo cambian textos visibles y el orden en que se muestran unas secciones que ya existen.

Son tres ajustes:

### 1. La pestaña "Visuales" pasa a llamarse "Apariencia"

El modal de componente tiene cuatro pestañas. La segunda, que hoy se titula "Visuales" (en inglés "Visual"), pasa a titularse "Apariencia" (en inglés "Appearance"). Solo cambia la etiqueta que ve el usuario; el contenido de la pestaña y su comportamiento no cambian.

### 2. La sección "Visual" pasa a llamarse "Efecto"

Dentro de esa pestaña hay una sección titulada "Visual" (en inglés "Visual"). Pasa a titularse "Efecto" (en inglés "Effect").

Esa sección aparece con distinto contenido según el tipo de componente, pero siempre con el mismo título:

- En componentes de tipo **Texto**: agrupa el tamaño de fuente, el color del texto y el color de fondo.
- En componentes de tipo **Tablero simple**: agrupa las opciones "Biselado en el borde" y "Sombra".
- En componentes de tipo **Tablero personalizado**: agrupa las opciones "Biselado en el borde" y "Sombra".

En los tres casos la sección pasa a llamarse "Efecto". El resto de tipos de componente (Dado, Documento, Carta/Ficha, Mazo) no tienen esta sección, así que no les afecta este punto.

### 3. La sección "Efecto" se coloca antes de la sección "Extrusión"

Dentro de la pestaña "Apariencia" hay una sección "Extrusión" (en componentes de tipo Texto se titula "Borde y extrusión"), común a todos los tipos de componente. Hoy la sección "Efecto" aparece **después** de "Extrusión".

Tras el cambio, la sección "Efecto" debe aparecer **antes** de "Extrusión", quedando situada justo después de la sección "Tamaño" (la primera de la pestaña).

Este reordenamiento solo se aplica en los tipos de componente que tienen sección "Efecto" (Texto, Tablero simple, Tablero personalizado). En los demás tipos no hay nada que mover y la sección "Extrusión" queda exactamente igual que ahora.

Las demás secciones propias de cada tipo (por ejemplo "Borde" y el fondo/patrón de los tableros, o "Estilo" del dado) **no** se reordenan: se quedan donde están hoy. Únicamente se adelanta la sección "Efecto".

### Orden de secciones resultante, por tipo de componente

- **Texto**: Tamaño → Efecto (fuente, color de texto, color de fondo) → Borde y extrusión.
- **Tablero simple**: Tamaño → Efecto (biselado, sombra) → Extrusión → Borde → Fondo.
- **Tablero personalizado**: Tamaño → Efecto (biselado, sombra) → Extrusión.
- **Dado**: sin cambios (Tamaño → Estilo → Extrusión).
- **Documento, Carta/Ficha, Mazo**: sin cambios.

### Preguntas de alcance resueltas con el usuario

- **Idioma inglés**: la pestaña pasa a "Appearance" y la sección a "Effect".
- **Alcance de "Efecto"**: se renombran las tres secciones que hoy comparten el mismo título "Visual" (Texto, Tablero simple, Tablero personalizado), no solo una de ellas.
- **Reordenamiento**: solo se adelanta la sección "Efecto", y solo en los tipos donde existe. El resto de secciones específicas de cada tipo no se mueven.
- **Datos y guardado**: no cambia nada. Ninguna propiedad de los componentes cambia de nombre ni de ubicación; solo cambian textos y el orden de aparición de secciones ya existentes.
- **Otras pantallas**: los textos afectados solo se usan en este modal. Ningún otro modal ni pantalla de la aplicación se ve afectado.

## Technical notes

- `src/ui/componentModal.js`:
  - La pestaña se crea en `createTab('visual', t('componentModal.tab.visual'))` (~línea 340). El identificador interno de pestaña sigue siendo `'visual'`; solo cambia su etiqueta traducida.
  - La sección "Extrusión" se construye y se añade a `visualContent` en ~líneas 653-709 (`extrusionSection`).
  - Las tres secciones "Efecto" se rotulan con `t('common.visual')` en ~línea 1062 (tipo `texto`, `textoVisualSection`), ~línea 1182 (`renderBoardSpecificFields`, tipo `tableroSimple`) y ~línea 1631 (`renderTableroPersonalizadoSpecificFields`, tipo `tableroPersonalizado`).
  - `renderSpecificTab()` (~línea 1036) llama a `renderBoardSpecificFields` / `renderTableroPersonalizadoSpecificFields` pasándoles `visualContent` como `visualContainer`; esas funciones hacen `visualContainer.appendChild(visualSection)` **después** de que `extrusionSection` ya esté en `visualContent`, de ahí el orden actual. Para el tipo `texto`, `textoVisualSection` también se añade con `visualContent.appendChild(...)` tras `extrusionSection`.
  - El reordenamiento se puede resolver guardando una referencia a `extrusionSection` e insertando las secciones "Efecto" antes de ella (`insertBefore`), sin introducir lógica nueva.
- Traducciones: `src/data/i18n.es.js` y `src/data/i18n.en.js`.
  - `componentModal.tab.visual`: ES `'Visuales'` → `'Apariencia'`; EN `'Visual'` → `'Appearance'`.
  - `common.visual`: ES `'Visual'` → `'Efecto'`; EN `'Visual'` → `'Effect'`. Esta clave solo se consume en `componentModal.js` (3 sitios); `componentModal.tab.visual` solo en 1 sitio.
- Documentación a actualizar en implementación (`pv-do`):
  - `previo-sdd/design/docs/architecture/006-ui-layer.md` describe la pestaña como "Visuales" y la sección "Visual" en la descripción de `ui/componentModal.js`.
  - `previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md` contiene el catálogo campo a campo con el orden de pantalla y los nombres de pestaña/sección.
- Sin inconsistencias detectadas entre documentación y código en el área analizada.
- Sin puntos de seguridad aplicables: todo el texto pasa por `t()` y se asigna con `textContent` / `createTextNode` (sin `innerHTML`); el cambio solo afecta a literales y al orden de `appendChild` de `fieldset`s existentes.
