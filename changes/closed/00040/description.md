- **Nombre**: Sustituir el parser Markdown propio por la librería "marked"
- **Código**: 00040
- **Tipo**: change

## Prompt original del usuario

ms-new reemplaza el parser de markdown por uno de terceros que podamos incrustar porque el nuestro no funciona bien, así que lo borramos y sustituímos por una librería que funcione. Evalúa cuál es la mejor opción (relación calidad vs. tamaño)

## Descripción completa

Se sustituye el conversor de Markdown a HTML propio (`core/markdown.js`, desarrollado en los cambios 00036/00037/00038/00039 para el componente "Visor de documentos") por la librería de terceros **marked**, incrustada directamente en el código fuente del proyecto (no como dependencia npm/CDN, ya que el proceso de generación del entregable no admite paquetes externos con su propio sistema de módulos).

Motivo: pese a las sucesivas correcciones, el parser propio seguía sin cubrir de forma fiable casos de uso reales (indentado, saltos de línea de Windows, listas de tareas...). Se opta por reemplazarlo por una librería de terceros ya madura y ampliamente usada, en vez de seguir corrigiendo la implementación propia.

Evaluación de la mejor opción (relación calidad/tamaño), comparando las alternativas habituales para incrustar como fichero único sin dependencias:

- **marked** (elegida): ~35-45 KB minificado, un único fichero sin dependencias, cobertura completa de CommonMark + GitHub Flavored Markdown (incluidas listas de tareas, tablas, tachado, auto-enlaces). Librería madura y muy usada.
- markdown-it: cobertura similar o mayor, pero mucho más pesada de incrustar como fichero único (repartida en varios paquetes internos, cientos de KB en total).
- snarkdown: menos de 1 KB, pero cubre mucho menos que lo que ya teníamos (sin listas de tareas, sin tablas, sin anidación fiable) — reintroduce las mismas limitaciones que se intentaba resolver.

Preguntas de alcance resueltas con el usuario durante el análisis:

- **HTML embebido dentro del texto en formato Markdown**: el parser propio lo trataba como texto literal (decisión de seguridad del cambio 00037). *marked* sí lo interpreta (es parte del estándar CommonMark). Se acepta este cambio de comportamiento: el resultado sigue pasando siempre por la sanitización ya existente (se elimina `<script>`, atributos `on...` y enlaces `javascript:`), así que no supone ningún riesgo de seguridad nuevo.
- **Extras de GitHub Flavored Markdown** (tablas, texto tachado `~~texto~~`) que nunca se habían pedido ni implementado explícitamente: se dejan disponibles tal cual los ofrece la librería por defecto, sin desactivarlos, coherente con el criterio ya asumido para las listas de tareas (cubrir GFM, no solo la sintaxis básica).

Convivencia con lo existente: no cambia nada más del componente "Visor de documentos" (selector de tipo de contenido/formato, sanitización, límites de tamaño y scroll, aspecto visual). El cambio es una sustitución interna del motor de conversión: mismo campo `contenido`/`formato` ya existente, mismo resultado final (HTML sanitizado insertado en el visor).

Casos límite: se mantiene el criterio ya vigente — el Markdown mal formado se muestra tal cual lo interprete la librería, sin validación ni aviso adicional. Un documento vacío sigue mostrando la hoja en blanco sin ningún mensaje.

Alcance de los datos y quién puede usarlo: sin cambios respecto a lo ya establecido — mismo componente, misma persistencia, mismo acceso desde Modo Edición y Modo Juego.

No hay ninguna propuesta visual nueva que hacer: es una sustitución del motor de conversión, no del aspecto ya maquetado del "Visor de documentos". Es posible que el marcado HTML exacto que genera la nueva librería para listas de tareas difiera del que generaba el parser propio (relevante para las reglas CSS `.task-list`/`.task-list-item` ya existentes en `main.css`, cambio 00039) — se revisa y ajusta al implementar si hiciera falta, sin que suponga ningún cambio de aspecto visible para quien usa la app.

## Apuntes técnicos

- Fichero a borrar por completo: `src/core/markdown.js`.
- Vendorizar la librería `marked` (build ESM, sin dependencias) como fichero nuevo en el proyecto (p.ej. `src/vendor/marked.js`), obteniendo su código fuente actual publicado y pegándolo tal cual (sin modificarlo salvo, si aplica, la configuración explícita ya acordada de HTML/GFM).
- `src/ui/componentRenderer.js` importa hoy `{ markdownToHtml } from '../core/markdown.js'` (línea ~8) y lo usa en la rama del tipo `'documento'` (línea ~691). Mantener una función `markdownToHtml(text)` con la misma firma (ya sea reexportada desde el fichero vendorizado o como un pequeño wrapper que llama a `marked.parse(text)`), para minimizar el cambio en `componentRenderer.js`.
- `src/core/sanitizeHtml.js` no se toca: el resultado de `markdownToHtml` sigue pasando por `sanitizeHtml` exactamente igual que hoy.
- Revisar el marcado HTML que genera `marked` para listas de tareas (atributos/clases que use por defecto para el `<input type="checkbox">` y el `<li>`) y ajustar los selectores `.task-list`/`.task-list-item` de `src/styles/main.css` (añadidos en el cambio 00039) si no coinciden, para que el aspecto visual (casilla sin viñeta) se mantenga igual.
