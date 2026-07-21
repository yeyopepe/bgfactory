## (a) Anotaciones funcionales

**Fuera de alcance:**
- El fix se limita estrictamente a la ficha (`ui/componentRenderer.js`, tipo `'ficha'`, cambio 00029), que es el único componente reportado con este problema. `'texto'` (`.text-box`) también fija `overflow: hidden` en su contenedor por el mismo motivo (recorte de contenido al tamaño fijado) y en teoría podría recortar igualmente su etiqueta si el `id` fuera muy largo y la caja muy pequeña, pero no es el bug reportado y no se toca aquí — sería un fix aparte si se observa.
- No se cambia nada del resto de tipos de componente (`'tablero'`, `'dado'`, `'documento'`), que ya muestran la etiqueta completa hoy y no se ven afectados por esta causa raíz.

**Dudas resueltas:** ninguna — el comportamiento esperado (etiqueta siempre visible entera, igual que el resto de tipos) ya estaba claro en `description.md`.

## (b) Solución técnica

Causa raíz confirmada en `src/ui/componentRenderer.js`: la rama `component.type === 'ficha'` fija `ficha.style.overflow = 'hidden'` en el contenedor raíz `.ficha` para recortar el fondo de tipo `'imagen'` (un `<img>` hijo, absolutamente posicionado) a la forma cuadrada o circular configurada. El `<span class="component-id-label">` (`createIdentifierLabel`) se añade como hijo de ese mismo contenedor (igual que en el resto de tipos), por lo que ese `overflow: hidden` también lo recorta cuando la ficha es más pequeña que la etiqueta — a diferencia de `'tablero'`/`'dado'`/`'documento'`, que no aplican `overflow: hidden` a su contenedor raíz.

El recorte a la forma de la ficha no necesita `overflow: hidden` en el contenedor: `background-color`/`background-image` ya se recortan automáticamente al `border-radius` del propio elemento (comportamiento estándar de CSS, sin necesidad de máscara adicional) — de hecho ya funciona así hoy para los fondos `'color'`/`'texto'`. El único caso que sí necesita recorte explícito es el fondo `'imagen'`, por ser un `<img>` hijo con su propia caja rectangular.

1. **`src/ui/componentRenderer.js`**, rama `component.type === 'ficha'`:
   - Eliminar `ficha.style.overflow = 'hidden';` del contenedor raíz `.ficha` (deja de recortar cualquier hijo, incluida la etiqueta).
   - En el bloque de fondo `'imagen'`, añadir al `<img>` creado `img.style.borderRadius = forma === 'circular' ? '50%' : '0';` (el propio `<img>` recorta su contenido a ese `border-radius`, igual que ya hace el contenedor con el color de fondo), preservando el recorte visual de la imagen a la forma sin depender de `overflow: hidden` en el padre.
2. **`src/styles/main.css`**: no requiere cambios — la regla `.ficha--selectable:hover .component-id-label` / `.ficha--selectable.ficha--selected .component-id-label` ya está pensada para que la etiqueta se muestre entera (mismo patrón que el resto de tipos); el recorte era puramente el `overflow: hidden` inline eliminado en el punto anterior.
