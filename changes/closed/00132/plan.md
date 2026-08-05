- **Fecha creación**: 2026-08-04

## (a) Anotaciones funcionales

Fuera de alcance:
- No se introduce ningún sistema de debounce/throttle para el nuevo listener de `resize`: se recalcula directamente en cada evento (el editor de cartas no tiene volumen de DOM suficiente para que sea un problema real, y el proyecto no tiene ningún precedente de utilidad de throttle que reutilizar — introducir una ahora sería una abstracción no pedida).
- No se persiste el estado maximizado entre aperturas del editor (ya confirmado en `description.md`): al ser una variable local a `openCardEditorModal`, esto sale gratis sin ningún trabajo adicional.

Dudas resueltas con el usuario:
- P: ¿Qué debe pasar con el tamaño del lienzo si el usuario redimensiona la ventana del navegador estando el editor maximizado, dado que el proyecto no tiene hoy ningún listener de `resize` en ningún sitio? R: Recalcular en vivo — se añade un listener de `resize` nuevo (primer uso de este patrón en el proyecto), activo mientras el modal está abierto, que solo tiene efecto si el editor está maximizado en ese momento.

## (b) Solución técnica

1. **`src/styles/main.css`, bloque "Card editor modal (00053)"**: añadir el modificador `.card-editor-modal--maximized`, siguiendo el mismo criterio de "modal ancha" ya documentado para `.card-editor-modal` (STYLE_BIBLE sección 12.4):
   ```css
   .card-editor-modal--maximized {
     width: 97vw;
     max-width: none;
     max-height: none;
   }
   ```
   `max-height: none` es necesario porque `.modal` (regla base) ya fija `max-height: 80vh`, que seguiría limitando el alto si no se sobrescribe explícitamente para este modificador. No se fija una `height` fija: el modal se deja crecer con su contenido (footer/header/toolbar incluidos) hasta el límite que impone el propio `.modal__content { overflow-y: auto }`, igual que hoy en tamaño normal — mismo mecanismo de scroll interno si el contenido no cupiera, sin comportamiento nuevo que inventar ahí.

2. **`src/ui/cardEditorModal.js`, dentro de `openCardEditorModal`**:
   - Nueva variable local `let maximized = false;` (junto a `selected`) — local a la función, no de módulo (a diferencia de `copiedElement`), para que arranque siempre en `false` en cada apertura del editor, sin persistencia.
   - Dos iconos SVG nuevos, mismo patrón local que `createDeleteIcon`/`createBringToFrontIcon`/etc.: `createMaximizeIcon()` (cuatro flechas hacia fuera) y `createRestoreIcon()` (cuatro flechas hacia dentro) — mismos atributos (`viewBox 0 0 24 24`, `stroke="currentColor"`, `stroke-width="2"`).
   - Nuevo botón en `header`, insertado entre `headerTitle` y `createHelpIcon(...)`: botón icono-solo (STYLE_BIBLE sección 9, "botón icono-solo dentro de un botón de barra ya existente" no aplica literalmente porque no hay barra, pero sí el criterio general — SVG con `stroke="currentColor"`, `title`/`aria-label` como etiqueta accesible al no llevar texto). Nueva clase de bloque propia `.card-editor-modal__maximize-btn` (BEM, sección 7) en vez de una excepción `.btn-*` (sí pertenece al bloque `.card-editor-modal`, no es standalone). CSS a añadir junto al resto del bloque 00053: tamaño ~26px, incorporando el mismo lenguaje de icono-solo ya usado en el proyecto (fondo `var(--bg-subtle)`, hover `var(--bg-hover)`, `border-radius: var(--radius-sm)`, transición estándar).
   - Handler del botón:
     ```js
     maximizeBtn.addEventListener('click', () => {
       maximized = !maximized;
       modal.classList.toggle('card-editor-modal--maximized', maximized);
       updateMaximizeButton();
       renderFaces();
     });
     ```
     `updateMaximizeButton()` sustituye el icono interior y el `title`/`aria-label` según `maximized` (icono + texto "Maximizar" / "Restaurar").
   - **Tamaño efectivo del lienzo**: sustituir la constante fija `CANVAS_MAX_SIDE` por una función que devuelve el valor según el estado:
     ```js
     const CANVAS_MAX_SIDE = 380; // tamaño en estado normal, sin cambios
     function getEffectiveCanvasMaxSide() {
       if (!maximized) return CANVAS_MAX_SIDE;
       // dos lienzos + toolbar caben en el ancho; el alto es el límite real
       return Math.min(window.innerHeight * 0.7, window.innerWidth * 0.42);
     }
     ```
     En `renderFace()`, sustituir `CANVAS_MAX_SIDE / Math.max(designWidth, designHeight)` por `getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight)`. Como `renderFace()` ya se invoca desde `renderFaces()`, y `renderFaces()` ya se llama en todos los puntos relevantes (mover/redimensionar/añadir/eliminar elemento, cambiar proporción, ajustar imagen, y ahora también al pulsar el botón maximizar/restaurar), no hace falta ningún cableado adicional para que el resto de interacciones existentes se ajusten correctamente al nuevo tamaño de lienzo.
   - **Listener de `resize`** (nuevo patrón en el proyecto, confirmado con el usuario): registrar `window.addEventListener('resize', handleWindowResize)` junto al `addEventListener('keydown', handleKeyDown)` ya existente; `handleWindowResize` solo actúa si `maximized` es `true`:
     ```js
     function handleWindowResize() {
       if (!maximized) return;
       renderFaces();
     }
     ```
     Eliminarlo en `cleanup()`, junto a `document.removeEventListener('keydown', handleKeyDown)`: `window.removeEventListener('resize', handleWindowResize)`.
   - **Botón "Ajustar imagen…" (`.card-editor-modal__adjust-image`)**: su `margin-top: 8.75rem` fijo en CSS asume el alto de lienzo del tamaño normal (para quedar centrado verticalmente junto a las dos caras). Con el lienzo maximizado creciendo, ese valor fijo dejaría el botón desalineado. Calcular su posición en JS dentro de `renderFaces()`, donde ya se conoce `canvasHeight` de cada cara (mismo valor para ambas, al usar la misma proporción): 
     ```js
     const { height: designHeight } = getDesignSize(working.proporcion);
     const canvasHeight = designHeight * (getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight));
     adjustImageBtn.style.marginTop = maximized
       ? `${canvasHeight / 2 - adjustImageBtn.offsetHeight / 2}px`
       : '';
     ```
     Asignar `''` en estado normal deja que se aplique de nuevo el valor de la hoja de estilos (`8.75rem`), sin duplicar ese valor en JS. Esta es la misma excepción ya documentada en STYLE_BIBLE sección 8 ("transforms dinámicos calculados") aplicada a un valor de posicionamiento en vez de una transformación, por el mismo motivo: depende de un cálculo numérico en tiempo de ejecución, no es un estado expresable como clase.

3. **Cabecera del editor (`HELP_HTML`)**: añadir una línea a la lista de ayuda existente mencionando el botón nuevo, mismo criterio que el resto de acciones ya documentadas ahí (p.ej. "**Maximizar** o restaurar el tamaño del editor con el botón de la cabecera.").

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`:

- **Sección 12.4 (Modales anchas)**: añadir una frase al párrafo de `.card-editor-modal` señalando que desde este cambio admite además el modificador `.card-editor-modal--maximized` (botón en su cabecera) que sustituye `width:fit-content;max-width:min(1500px,95vw)` por ocupar prácticamente toda la ventana (`97vw`, sin límite de alto más allá del que ya impone `.modal__content { overflow-y: auto }`), como primer caso del catálogo con un modificador de tamaño alternable en vez de un único ancho fijo por modal.
- **Nueva entrada en sección 12** (o una subsección propia, p.ej. "12.4.1 Botón maximizar/restaurar de modal"): documentar el patrón nuevo — botón icono-solo en `.modal__header`, junto al `.help-icon`, con dos iconos SVG (expandir/contraer) que se alternan según un estado local de la modal, sin persistencia. Señalar que es el primer uso de este patrón en el proyecto, para que cualquier modal futura que necesite lo mismo lo reutilice en vez de crear uno ad-hoc (mismo criterio editorial que el resto de patrones documentados en la sección 12).
