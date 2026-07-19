- **Nombre**: Parser Markdown completo (basic syntax)
- **Código**: 00037
- **Tipo**: change

## Prompt original del usuario

ms-new completa el parser markdown del cambio 00036 con toda la funcionalidad recogida aquí: https://www.markdownguide.org/basic-syntax/

## Descripción completa

Se completa el conversor de Markdown a HTML (usado por el componente "Visor de documentos", añadido en el cambio 00036) para que cubra toda la sintaxis básica de Markdown descrita en https://www.markdownguide.org/basic-syntax/, en vez del subconjunto reducido que se implementó entonces (encabezados, negrita, cursiva, código en línea, enlaces, listas simples, párrafos).

Funcionalidad nueva que pasa a soportarse:

- **Énfasis**: variantes con guion bajo (`__negrita__`, `_cursiva_`) además de las de asterisco ya existentes; combinación negrita+cursiva (`***texto***`, `___texto___` y mezclas de ambos símbolos).
- **Citas (blockquotes)**: una línea o párrafo precedido de `>`; varios párrafos dentro de una misma cita; citas anidadas (`>>`); y citas que contienen a su vez encabezados, listas, énfasis o código.
- **Listas anidadas y con contenido enriquecido**: listas dentro de listas, y la posibilidad de incluir dentro de un mismo elemento de lista párrafos adicionales, citas, bloques de código o imágenes (mediante indentación).
- **Bloques de código**: un bloque de texto indentado se muestra como código preformateado, además del código en línea puntual ya existente.
- **Reglas horizontales**: una línea compuesta solo por tres o más guiones, asteriscos o guiones bajos se convierte en una línea separadora.
- **Enlaces**: título opcional que aparece como tooltip al pasar el ratón; auto-enlaces (pegar directamente una URL o un email entre `<` y `>` y que ya salga como enlace); enlaces "por referencia" (el texto del enlace remite a una definición aparte en otro punto del documento, útil para no repetir URLs largas).
- **Imágenes**: pegar una imagen igual que un enlace pero con `!` delante, con título opcional; e imágenes que a la vez son un enlace a otra página.
- **Escapado de caracteres**: anteponer `\` a un carácter con significado especial en Markdown para que se muestre tal cual en vez de aplicarse como formato (por ejemplo, para escribir un asterisco literal sin que se interprete como cursiva).

Preguntas de alcance resueltas con el usuario durante el análisis:

- **HTML embebido dentro del propio texto en formato Markdown** (poder escribir directamente etiquetas HTML sueltas dentro del texto pegado y que se respeten, además del propio Markdown): queda **fuera de alcance**. Se sigue tratando como texto literal, igual que hasta ahora; quien quiera pegar HTML ya cuenta con el selector de Formato "HTML" que ofrece el componente para ese caso. Confirmado como decisión de seguridad, coherente con la ya tomada en el cambio 00036.
- **Saltos de línea dentro de un párrafo**: se adopta el comportamiento estándar de Markdown — un simple cambio de línea dentro de un párrafo ya no fuerza un salto visual, el texto se sigue uniendo en la misma línea; solo se produce un salto de línea visual si la línea termina en dos o más espacios, o hay una línea en blanco entre párrafos. Esto es un cambio de comportamiento respecto al cambio 00036 (donde cualquier fin de línea se mostraba como salto) y puede modificar el aspecto de contenido en formato Markdown ya guardado que dependiera del comportamiento anterior. Confirmado por el usuario como parte de esta ampliación, asumiendo ese posible cambio visual en documentos existentes.
- **Encabezados alternativos** (escribir el texto del encabezado en una línea y subrayarlo con `===` o `---` en la línea siguiente, como forma alternativa a `#`): quedan **fuera de alcance**, para evitar la ambigüedad con la regla horizontal `---` que se incorpora en este mismo cambio. Solo se admite la sintaxis con `#`.

Convivencia con lo existente: no se modifica nada más del componente "Visor de documentos" ya resuelto en el cambio 00036 (selector de tipo de contenido/formato, sanitización antes de mostrar el resultado, límites de tamaño y scroll del componente, etc.) — esta ampliación se limita a que el propio conversor interprete más sintaxis Markdown.

Casos límite: se mantiene el criterio ya fijado en el cambio 00036 — si el Markdown pegado está mal formado (sintaxis a medias, una referencia de enlace usada pero nunca definida, etc.) se muestra tal cual lo interprete el conversor, sin validar el contenido ni avisar al usuario.

Alcance de los datos y quién puede usarlo: sin cambios respecto al cambio 00036 — mismo componente, misma persistencia como parte de las propiedades del componente, mismo acceso desde Modo Edición y Modo Juego.

No hay ninguna propuesta visual nueva que hacer: el resultado se sigue viendo dentro del mismo "Visor de documentos" ya maquetado en el cambio 00036, esta ampliación solo afecta a qué sintaxis dentro del texto pegado se interpreta correctamente.

## Apuntes técnicos

- Módulo a ampliar: `src/core/markdown.js`, función `markdownToHtml` (implementación propia, sin librerías de terceros — ver justificación ya documentada en `plan.md` del cambio 00036 sobre el build sin npm/CDN, que sigue aplicando aquí).
- El HTML resultante de `markdownToHtml` sigue pasando por `src/core/sanitizeHtml.js` antes de insertarse en el DOM (sin cambios necesarios en ese módulo).
- Referencia de sintaxis exacta a implementar: https://www.markdownguide.org/basic-syntax/ (apartado "basic syntax" de la guía). La sintaxis extendida de esa misma guía (tablas, listas de tareas, resaltado, notas al pie, etc.) no forma parte de esta ampliación y sigue fuera de alcance, igual que ya delimitaba el `plan.md` del cambio 00036.
