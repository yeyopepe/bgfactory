## (a) Anotaciones funcionales

Fuera de alcance:
- No se toca `src/scripts/build.py`: aunque su transpilador basado en expresiones regulares no distingue comentarios de código real (lo que permitió que se colara este bug), hacerlo más robusto sería un cambio de alcance mayor y no relacionado con el bug reportado — el fix se limita a no volver a escribir, en ningún comentario del código fuente, una frase que coincida con esos patrones.
- No se toca el cuerpo de la librería vendorizada (el código de `marked` en sí), ya verificado como correcto en el cambio 00040 — el bug está exclusivamente en el comentario de cabecera que se le añadió.

Sin dudas que resolver con el usuario: la causa raíz y el fix ya estaban identificados al documentar el bug.

## (b) Solución técnica

1. **`src/vendor/marked.js`**, líneas 1-8 (comentario de cabecera añadido en el cambio 00040): reescribir el texto para que no contenga las secuencias literales `export function <palabra>` ni `export const <palabra>` — las dos frases que coinciden con `EXPORT_FUNCTION_PATTERN`/`EXPORT_CONST_PATTERN` de `src/scripts/build.py` (`export\s+function\s+(\w+)` / `export\s+const\s+(\w+)`) y provocan que el build las trate como exports reales, generando `module.exports.nombre = nombre;` sin que `nombre` exista. Se reformula la explicación evitando esa combinación exacta de palabras (p.ej. describiendo el patrón sin escribirlo tal cual, o separando "export" de "function"/"const" en la frase), manteniendo el resto del comentario (motivo del vendorizado, referencia a plan.md 00040) intacto en sustancia.
2. **Verificación**: regenerar el bundle de desarrollo localmente (extraer y comprobar con `node --check` el script inline, y grep de `module.exports.nombre` para confirmar que ya no aparece) antes de dar el fix por bueno. No se genera una nueva versión numerada como parte de este fix (eso es tarea de `ms-version`, aparte) — se verifica reconstruyendo con `python src/scripts/build.py` y confirmando que el `ReferenceError` ya no se produce al abrir el HTML resultante en el navegador, igual que se hizo para diagnosticar el bug.
