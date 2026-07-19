- **Nombre**: El entregable generado (v00023) no muestra la interfaz
- **Código**: 00041
- **Tipo**: fix

## Prompt original del usuario

Al generar la versión no veo los botones de la barra superior

## Descripción completa

Al abrir el entregable recién generado (`src/_output/versions/index-v00023.html`), no aparece ninguno de los botones de la barra superior — de hecho no se llega a mostrar nada de la interfaz de la aplicación (ni la mesa, ni los paneles), como si la aplicación no hubiera arrancado en absoluto. La página carga (el HTML y los estilos se ven), pero el comportamiento interactivo no se inicializa.

Comportamiento esperado: al abrir cualquier entregable generado con `/ms-version`, la aplicación debe arrancar con normalidad y mostrar la interfaz completa (barra superior, mesa, paneles), igual que en cualquier versión anterior.

Este problema es nuevo desde la última versión generada (v00023, que incorpora por primera vez la librería vendorizada `src/vendor/marked.js` del cambio 00040) — versiones anteriores no presentaban este síntoma.

## Apuntes técnicos

- Diagnóstico ya realizado (abriendo el entregable con Chrome en modo headless y revisando la consola): se lanza `Uncaught ReferenceError: nombre is not defined` al cargar el script principal, lo que interrumpe por completo la ejecución de `require('main.js')` y por tanto el arranque de toda la aplicación.
- Causa raíz: el comentario de cabecera añadido en `src/vendor/marked.js` (cambio 00040) contiene, como texto descriptivo entre comillas, las frases literales `export function nombre` y `export const nombre` (explicando qué reconoce el transpilador del build). `src/scripts/build.py` transpila los módulos ES a su propio sistema `require`/`module.exports` mediante expresiones regulares simples (`EXPORT_FUNCTION_PATTERN`, `EXPORT_CONST_PATTERN`) que no distinguen comentarios de código real: esas dos frases dentro del comentario coinciden con los patrones `export\s+function\s+(\w+)` y `export\s+const\s+(\w+)`, así que el build las trata como si fueran exports reales del símbolo `nombre` y añade `module.exports.nombre = nombre;` al final del módulo — sin que `nombre` esté declarado en ningún sitio, lo que provoca el `ReferenceError` al cargar ese módulo.
- El fix se limita a reescribir el comentario de cabecera de `src/vendor/marked.js` para que no contenga ninguna secuencia literal que coincida con esos patrones (`export function <palabra>` / `export const <palabra>`), sin tocar el resto del fichero (el código de la librería vendorizada en sí, ya verificado como correcto) ni `src/scripts/build.py`.
