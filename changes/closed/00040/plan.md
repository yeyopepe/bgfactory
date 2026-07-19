## (a) Anotaciones funcionales

Fuera de alcance:
- Cualquier configuración que restrinja lo que la librería ofrece por defecto (HTML embebido, tablas, tachado): se usan los valores por defecto de `marked`, sin `setOptions` adicional, según lo confirmado con el usuario.
- No se actualiza `marked` a versiones futuras como parte de este cambio; se vendoriza la versión estable publicada en el momento de implementar (18.0.6).

Dudas resueltas con el usuario (ver `description.md`): aceptar el comportamiento por defecto de `marked` para HTML embebido y extras de GFM (tablas, tachado), sin desactivarlos.

## (b) Solución técnica

1. **Obtener el código fuente de `marked`**: build ESM oficial (`lib/marked.esm.js` del paquete npm `marked`, versión 18.0.6 — la última estable en el momento de implementar), sin dependencias, ~42 KB. Se descarga tal cual desde el propio registro de paquetes (unpkg sirve directamente el contenido del paquete publicado) solo como forma de obtener el fichero — no se referencia ningún CDN en tiempo de ejecución, el contenido se pega íntegro en el repositorio.
2. **Vendorizar como `src/vendor/marked.js`**: pegar el contenido descargado tal cual, con dos únicos ajustes mecánicos (no funcionales) necesarios para que el script de build (`src/scripts/build.py`) pueda procesar el fichero, ya que su transpilador es un conjunto de expresiones regulares simple (no un parser ES real) que solo reconoce `export function nombre` / `export const nombre` para exportar, y no reconoce una sentencia `export { ... }` suelta con renombrados como la que trae el build oficial:
   - Quitar el comentario final `//# sourceMappingURL=marked.esm.js.map` (no hay mapa vendorizado, evita que el navegador intente pedirlo).
   - Sustituir la sentencia final `export{... , g as marked, ..., Yt as parse, ...};` por dos líneas equivalentes que el transpilador del proyecto sí reconoce: `export const marked = g;` y `export const parse = Yt;` (identificadores internos tal cual los genera el propio bundle de marked en esta versión) — se exportan solo estos dos nombres, ya que son los únicos que el proyecto necesita; el resto de exports del bundle oficial (`Lexer`, `Parser`, `Renderer`...) no se usan en este proyecto y no hace falta exponerlos.
   - El resto del fichero (todo el cuerpo de la librería) se dejará exactamente igual que el original publicado, sin ninguna otra modificación.
3. **Borrar `src/core/markdown.js`** (implementación propia, cambios 00036-00039) y crear un fichero nuevo con el mismo nombre y misma función exportada, como envoltorio mínimo sobre la librería vendorizada:
   ```js
   import { parse } from '../vendor/marked.js';
   export function markdownToHtml(text) {
     return parse(text || '');
   }
   ```
   Esto evita tocar `src/ui/componentRenderer.js` (sigue importando `{ markdownToHtml } from '../core/markdown.js'` exactamente igual que hoy, línea ~8 y su uso en la rama `'documento'`, línea ~691).
4. **Revisar el marcado HTML de listas de tareas que genera `marked`** (con GFM activado por defecto) y comparar con los selectores `.task-list`/`.task-list-item` ya existentes en `src/styles/main.css` (cambio 00039): ajustar esos selectores CSS a las clases/estructura reales que genera `marked` (previsiblemente `<ul><li class="task-list-item"><input type="checkbox" disabled>...`, a confirmar contra la salida real), para que la casilla sin viñeta se siga viendo igual.
5. **Probar manualmente con Node** (`import` directo del fichero vendorizado, igual que se hizo para verificar los cambios 00037/00038/00039) con una batería de casos ya usada antes (encabezados, énfasis, listas anidadas con 2 espacios, citas, código, enlaces, imágenes, listas de tareas, y el contenido real de `design/docs/rules.md`), para confirmar que el resultado es correcto antes de dar el cambio por bueno.

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`, dentro del bullet `**'documento'**` (sección de tipos de componente):
- Sustituir la mención a `core/markdown.js` como implementación propia por: `core/markdown.js` es ahora un envoltorio mínimo sobre la librería de terceros vendorizada `vendor/marked.js` (marked, CommonMark + GFM completo — cambio 00040), documentando qué se vendoriza y por qué (el build no admite paquetes npm/CDN, así que cualquier librería externa se incrusta como fichero fuente propio).
- Revisar si la sección que documenta la organización en capas (`core/`, `ui/`, etc.) necesita mencionar la nueva carpeta `vendor/` como excepción a esas capas (código de terceros, no propio) — añadir una línea breve si no hay ya un sitio natural donde encaje.
