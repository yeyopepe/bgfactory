- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica la altura de la modal (mantiene `max-height: 80vh`), ni el ancho de ninguna otra modal del proyecto (paneles flotantes de Componentes/Recursos/Grupos, modales de confirmación, etc.), ni la modal reducida de "Copia" (`ui/copyComponentModal.js`), que reutiliza el mismo `.modal` base pero no forma parte de este cambio.

**Dudas resueltas con el usuario:** ninguna pregunta abierta durante la planificación — las dudas de alcance (límites mínimo/máximo, recalculación dinámica, si afecta a la altura, mecanismo de implementación) ya se resolvieron con el usuario en la fase de `ms-new` y quedan reflejadas en `description.md`.

## (b) Solución técnica

1. **`src/styles/main.css` — añadir la clase `.component-editor-modal` siguiendo el patrón de "modales anchas" ya documentado (STYLE_BIBLE.md sección 12.4).** Justo después de la regla `.modal` (línea 337), añadir una nueva regla que sobrescribe `width`/`max-width` sin tocar la base:
   ```css
   /* Modal de edición de componentes (cambio 00178): ancho dinámico, 75% del
      ancho de pantalla, acotado entre 400px y min(1000px, 90vw). Usa clamp()
      con unidades de viewport, así que se recalcula solo ante cualquier
      resize de ventana sin necesidad de JS (a diferencia de .card-editor-modal/
      .image-adjust-modal--large, que usan `width: fit-content` porque su
      contenido tiene ancho variable — aquí el ancho es siempre el mismo
      porcentaje de pantalla, no depende del contenido). */
   .component-editor-modal {
     width: clamp(400px, 75vw, min(1000px, 90vw));
     max-width: none;
   }
   ```
   `max-width: none` es necesario porque `.modal` ya fija `max-width: 500px`, que limitaría el `clamp()` por debajo del 75vw en pantallas medianas/grandes si no se anula explícitamente.
2. **`src/ui/componentModal.js` — aplicar la nueva clase a la modal.** En `openComponentModal()` (línea 229), cambiar:
   ```js
   modal.className = 'modal';
   ```
   por:
   ```js
   modal.className = 'modal component-editor-modal';
   ```
   Mismo patrón que usan `.card-editor-modal`/`.element-selection-modal`/etc. (segunda clase de bloque añadida a `modal.className`, no un `style` inline).

No hace falta ningún listener de `resize` en JS: al usar unidades `vw` dentro de `clamp()`, el navegador recalcula el ancho de forma nativa en cada redimensionado de la ventana, igual que ya ocurre con el resto de modales anchas del catálogo (ninguna de ellas usa JS para su dimensionado).

## (d) Cambios en estilo

Añadir `.component-editor-modal` al catálogo de "Modales anchas" de `STYLE_BIBLE.md` sección 12.4, como nueva entrada: modal de edición de componentes (`ui/componentModal.js`, `openComponentModal`) — a diferencia de las entradas existentes (`width: fit-content` + tope, para contenido de ancho variable, o `max-width` fijo para contenido de ancho constante), esta es la primera del catálogo que usa `clamp()` con una unidad de viewport (`75vw`) para expresar un ancho proporcional a la pantalla en vez de un ancho fijo o ajustado al contenido — acotado entre 400px (mínimo) y `min(1000px, 90vw)` (máximo).

## (e) Verificación

1. Abrir la app en modo edición, seleccionar/crear un componente para abrir su modal de propiedades: el ancho de la modal debe verse claramente mayor que el `max-width: 500px` anterior en una pantalla de escritorio normal (p. ej. ~1440px de ancho de ventana → modal de ~1000px, tope máximo alcanzado).
2. Con la modal de propiedades abierta, redimensionar la ventana del navegador (o las DevTools en modo responsive) a un ancho menor (p. ej. 800px): la modal debe encogerse en vivo hasta aproximadamente el 75% de ese ancho (~600px), sin necesidad de cerrar y reabrir la modal.
3. Redimensionar la ventana a un ancho muy pequeño (p. ej. 450px): la modal no debe bajar de 400px de ancho (puede sobresalir o forzar scroll horizontal de página, pero no debe encogerse por debajo del mínimo).
4. Redimensionar la ventana a un ancho muy grande (p. ej. 2560px): la modal no debe superar los 1000px de ancho.
5. Confirmar que la altura de la modal se sigue comportando igual que antes (topada a `80vh`, con scroll interno en `.modal__content` si el contenido de alguna pestaña es largo).
6. Abrir cualquier otra modal del proyecto (p. ej. confirmación de borrado, modal de recurso, editor de cartas) y confirmar que su ancho no ha cambiado — el nuevo estilo solo afecta a la modal de edición de componentes.
