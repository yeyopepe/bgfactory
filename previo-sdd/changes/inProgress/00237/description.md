- **Name**: Sistema de diseño CSS — tokens completos y coherentes
- **Code**: 00237
- **Type**: change
- **Creation date**: 2026-09-05

## Full description

### Objetivo

Establecer un sistema de tokens de diseño completo y coherente para toda la aplicación, que sirva de base común para el resto de áreas de mejora visual. A partir de este cambio, cualquier decisión visual de la app (colores, espacios, tamaños de texto, esquinas redondeadas, sombras, tiempos y curvas de animación) debe derivarse de este sistema, en lugar de escribir el valor concreto suelto en cada sitio. Un valor "suelto" (hardcodeado) que ya tenga token disponible se considera un error a partir de ahora.

El cambio tiene tres partes:

1. **Definir el catálogo completo de tokens** (colores, tipografía, espaciado, esquinas, sombras, animación), ampliando el conjunto actual, que es un buen punto de partida pero está incompleto.
2. **Reorganizar el archivo de estilos** (hoy un único archivo monolítico de ~3.589 líneas sin particiones internas) en secciones bien delimitadas mediante comentarios de bloque, para que sea navegable.
3. **Migrar a esos tokens los valores sueltos ya identificados** en el análisis (una lista cerrada de colores, sombras y esquinas redondeadas), sin emprender una auditoría exhaustiva línea por línea de todo el archivo.

### Estado del que se parte

- 21 variables de diseño ya definidas (incompletas).
- 13 tamaños de texto distintos, todos escritos como valor literal, sin token (11 en el análisis inicial + `2.25rem` y `0.5em` que aporta la pantalla de splash, añadida después).
- Espaciado (márgenes y rellenos) sin ninguna escala: valores ad-hoc.
- Solo 2 tokens de esquina redondeada (4px y 8px).
- Solo 2 tokens de sombra, más ~13 sombras escritas sueltas.
- ~20 colores escritos sueltos fuera de variables, sobre todo derivados del azul de acento y blancos semitransparentes sobre fondo oscuro.
- Sin tokens de animación más allá de uno solo (150ms).
- Sin modo oscuro, sin escala de grises completa, sin colores para "aviso" ni "información".

### 1. Paleta de color

**1.1 Superficies.** Se mantienen los cinco tokens de superficie actuales (fondo del tablero, barra de herramientas, paneles, fondos neutros en reposo, hover neutro) y se añaden dos:
- Un token de "superficie blanca" para modales y previsualizaciones (hoy el blanco suelto — `white`/`#fff`/`#ffffff` — se escribe en ~9 sitios distintos).
- Un token de "velo" para el fondo oscurecido que hay detrás de un modal (hoy `rgba(0,0,0,0.5)` escrito suelto, en un único sitio: `.modal-overlay`).

**1.2 Acento (azul).** Se mantienen los tres tonos de azul actuales (acento, acento oscuro, acento claro) y se añaden tres variantes translúcidas del azul de acento, para: anillos de foco y filas seleccionadas (opacidad 0,15); bordes de menús flotantes (0,25); y hover elevado en controles (0,35). El código real usa además una cuarta opacidad suelta (0,2, en el anillo de foco de un elemento concreto) y varias formas de sombra distintas sobre ese mismo azul (`0 0 0 3px`, `0 2px 6px`, `0 2px 5px`, `0 3px 8px`); la fase técnica decide si el 0,2 se consolida en el token de 0,15 o el de 0,25, o si merece token propio, y si las sombras derivadas del azul pasan a token semántico.

**1.3 Colores semánticos.** Se mantienen los dos actuales (error y éxito) y se completan:
- Para error: una variante muy tenue (fondo de zonas en error) y una variante translúcida (sombra del icono de error, hoy `rgba(211,47,47,0.4)` suelta). Hay además una segunda opacidad suelta del rojo de error, `rgba(211,47,47,0.3)`, en el hover del botón destructivo (justo el valor que cita literalmente `002-componentes-layout.md`): también entra en la migración, a la variante translúcida de error correspondiente.
- Para éxito: las dos variantes equivalentes (la translúcida sustituye `rgba(46,125,50,0.4)`, hoy suelta).
- "Aviso" (naranja oscuro, para avisos no destructivos) con su variante tenue de fondo.
- "Información" (azul informativo, distinto del azul de acento, para no confundir "informativo" con "interactivo") con su variante tenue de fondo.

**1.4 Escala de grises.** Escala completa de 9 pasos para poder sustituir todos los grises sueltos. Seis de esos pasos coinciden exactamente en valor con tokens que ya existen (paneles, fondos neutros, hover, bordes neutros, texto secundario, texto principal); en esos casos el paso de la escala de grises se define como **alias** del token que ya existe, no repitiendo el valor. Así hay un único valor de verdad, no se toca el estilo existente que ya usa el nombre semántico, y no hay riesgo de que ambos nombres diverjan en el futuro. Los tres pasos restantes son valores nuevos que hoy están sueltos: un gris medio para bordes secundarios, un gris para iconos y puntos decorativos sin significado, y un gris oscuro para el degradado de la cabecera.

**1.5 Colores de la barra de herramientas.** Los blancos semitransparentes que se usan sobre el fondo oscuro de la barra superior pasan a tener token propio: hover de botón, separador vertical y texto atenuado.

### 2. Escala tipográfica

**2.1 Tamaños.** Se definen 8 pasos que consolidan los 13 tamaños actuales: desde el más pequeño (etiquetas diminutas en tablas) hasta el mayor (el número grande del dado a pantalla completa), pasando por el tamaño de uso general de la interfaz, el de títulos de modal y el del título de la aplicación.

Sobre los tamaños intermedios que no encajan limpiamente en la escala, la decisión tomada es **consolidarlos en el paso más cercano**, aceptando una diferencia visual pequeña (de 1 a 2 píxeles) a cambio de una escala limpia, en vez de añadir pasos intermedios:
- 13px se consolida en el paso de 12px.
- 15px se consolida en el paso de 14px.
- Un tamaño de ~15,2px que aparece en un único sitio (el texto de la ventana de progreso) se consolida en el paso de 14px.
- 36px (`2.25rem`, título de la pantalla de splash) pasa a usar el paso de 32px, que hasta ahora quedaba reservado sin uso. Deja de haber paso "reservado": los 8 pasos tienen uso real.
- `0.5em` (el superíndice del título de la pantalla de splash) es un tamaño **relativo** al de su contenedor, no un valor absoluto de la escala: se mantiene tal cual, es correcto que un `sup` se dimensione en función de su texto padre.

**2.2 Pesos de fuente.** Hoy no hay tokens; solo se usan "normal" y "seminegrita". Se añaden tres tokens: normal (400), medio (500) y seminegrita (600).

**2.3 Interlineado.** Hoy no hay tokens. Se añaden tres niveles: ajustado (títulos y cabeceras), normal (texto de interfaz) y holgado (contenido de lectura, como documentos embebidos).

### 3. Escala de espaciado

Sistema de 8 pasos basado en múltiplos de 4 píxeles (de 4px a 48px). Se establece el mapeo de los valores de espaciado más frecuentes de hoy a su paso correspondiente. El valor intermedio 28px (`1.75rem`) — que aparece en la ventana de progreso y también en el relleno de la pantalla de splash — se consolida en el paso de 32px. El `2rem` suelto del relleno de la splash mapea directamente al paso de 32px.

### 4. Escala de esquinas redondeadas

Se pasa de 2 a 6 pasos: un paso mínimo (2px, hoy suelto en las marcas del control de rotación), los dos actuales (4px para controles, 8px para contenedores), un paso intermedio nuevo (6px), un paso grande nuevo (12px) y un paso "píldora/círculo" (radio muy grande) que sustituye tanto al "50%" usado en insignias y ruedas de carga como al valor suelto de 9px de la insignia de "tiene copias".

Decisión tomada: la insignia de "tiene copias" hoy usa 9px, que es justo la mitad de su altura para dar forma de píldora; se cambia al token "píldora/círculo", que consigue el mismo efecto de forma más robusta (no depende de que la altura sea exactamente 18px).

### 5. Escala de sombras (elevación)

Se pasa de 2 a 5 niveles de elevación:
- Nivel "plano" (sin sombra), para el estado de arrastre activo.
- Los dos niveles actuales: flotante sutil (paneles y piezas en reposo) y overlay (modales).
- Un nivel nuevo para modales grandes (editor visual, modales de selección complejos, ventana de la pantalla de splash).
- Un nivel de "arrastre activo" que sustituye la sombra suelta que hoy tiene el estado de pieza "levantada".

Además, sombras de estado con token propio:
- Anillo de foco en campos (usa la variante translúcida del azul al 15%).
- Anillo de foco en elementos seleccionados (usa la variante al 25%).
- Sombra de insignias flotantes (bloqueo, oculto, copias).

Decisión tomada: se mantienen **dos** tokens de anillo de foco (normal y reforzado) porque reflejan una distinción que ya existe hoy en la app (los campos normales usan un tono más suave que los elementos seleccionados).

### 6. Tokens de animación

Se amplía el único token actual (una duración de 150ms) a un conjunto de duraciones (instantánea 80ms, rápida 150ms, normal 250ms, lenta 400ms) y de curvas de aceleración (genérica, de entrada, de salida, y una con rebote sutil para microanimaciones). Estos tokens se definen ahora como base, aunque su uso intensivo llegará con el área de microinteracciones.

### 7. Organización del archivo de estilos

**7.1 Estructura.** Decisión tomada: se mantiene **un único archivo** y se reorganiza internamente en 11 secciones delimitadas por comentarios de bloque (tokens; reset y base; layout global; componentes de tablero; paneles flotantes; sistema de modales; modales específicos por orden alfabético — incluida la ventana de la pantalla de splash; menús contextuales y desplegables; controles reutilizables; avisos y notificaciones; animaciones). Queda **descartado** partir el archivo en varios ficheros concatenados, para no tener que tocar el proceso de construcción del entregable ni mantener un orden de concatenación.

**7.2 Migración de valores sueltos.** Se migran a su token correspondiente los valores sueltos ya identificados en el análisis (lista cerrada): los blancos de modales y previews (~9 usos, en las dos notaciones `#fff`/`#ffffff`/`white`), el velo de fondo de modal, las variantes translúcidas del azul en foco/selección/bordes/hover (opacidades 0,15 / 0,2 / 0,25 / 0,35), los grises sueltos de la cabecera y de grips e insignias (en las dos notaciones `#999`/`#999999`), el `#ccc` del borde de tablero de ajedrez, el `#3a3a3a` del degradado de la cabecera, los blancos de la barra de herramientas, las sombras translúcidas de los iconos de error y éxito (`rgba(211,47,47,0.4)`, `rgba(46,125,50,0.4)`) y el rojo de error del hover destructivo (`rgba(211,47,47,0.3)`), la sombra de la pieza levantada, la sombra de las insignias, y las esquinas redondeadas sueltas (2px del control de rotación, 9px de la insignia de copias, y el "50%" de ruedas de carga e insignias). El detalle fila a fila está en `design_data_migracion-valores-sueltos.md`.

No forma parte de este cambio recorrer exhaustivamente las ~3.702 líneas para sustituir cada aparición de cada tamaño de texto: se definen los tokens y se migran los usos ya identificados. Cada área de mejora posterior migrará los suyos cuando toque esa parte del estilo.

### Fuera de alcance (decisiones cerradas)

- **Modo oscuro:** no se implementa. Este cambio deja el sistema preparado (todos los colores como variables) para que un cambio futuro añada el bloque de modo oscuro. Es trabajo futuro explícito, no un olvido.
- **Partición del CSS en varios archivos:** descartada (ver 7.1). Archivo único reorganizado.
- **Dos tokens que hoy existen y no aparecen en el plan** (el punteado de fondo del tablero y el color del título de sección de modal): se mantienen intactos, no entran en ninguna escala.
- **Consolidación exhaustiva de los 13 tamaños de texto** en todas las líneas más allá de lo ya mapeado: no entra; los tokens quedan definidos y cada área futura migra lo suyo.

### Comportamiento esperado y validación

- Tras el cambio, la aplicación debe **verse igual** que antes, salvo las diferencias visuales menores y controladas de la consolidación de tamaños intermedios (13px→12px, 15px→14px, ~15,2px→14px, 36px→32px en el título de la pantalla de splash y el espaciado 28px→32px en la ventana de progreso y en el relleno de la splash). Esas diferencias se revisarán una a una en la fase técnica.
- No hay pruebas visuales automatizadas: la validación es comparación visual manual del entregable generado, antes y después, revisando modales, paneles flotantes y piezas del tablero.
- El cambio es puramente de capa de estilo: no toca lógica de la aplicación, ni guardado de datos, ni datos, ni red, ni traducciones.
- Habrá tokens definidos sin uso inmediato (algunos pasos de espaciado, algunas curvas de animación). No es deuda: es la base compartida para las áreas siguientes.

## Technical notes

- **Archivo afectado:** `src/styles/main.css` (único archivo de estilos, 3.702 líneas a fecha de este re-análisis; bloque `:root` al inicio, hoy con 21 variables). El resto de la app (JS, persistencia, i18n) no se toca.
- **Re-análisis (posterior a la pantalla de splash):** el análisis inicial se escribió antes de que se añadiera la pantalla de splash (`.splash-window`, `.splash-overlay`), que aportó ~113 líneas y valores que ahora quedan integrados en el alcance: `font-size: 2.25rem` (título → paso de 32px, antes reservado), `font-size: 0.5em` (superíndice, relativo, se mantiene), `padding: 1.75rem 1.75rem 2rem` (→ paso de 32px), y `.splash-window` como consumidor de la sombra de "modal grande". La sección "07 - modales específicas" debe incluir sus reglas.
- **Alphas del azul de acento:** el código real usa 4 opacidades sueltas del azul (`rgba(44,125,216,·)`: 0,15 / 0,2 / 0,25 / 0,35), no 3. El plan de `pv-how` debe decidir el destino del 0,2 (consolidar en 0,15/0,25 o token propio) y de las distintas formas de sombra sobre ese azul.
- **Proceso de entregable:** `src/scripts/build.py` lee un único `CSS_REL_PATH = 'styles/main.css'` y lo incrusta inline dentro de `<style>` en una copia de `src/index.html` (`html.replace('</title>', ... <style> ... )`). Por eso la partición del CSS obligaría a tocar `build.py`; se ha descartado. Los comentarios de bloque propuestos (líneas con `═`) y los valores de tokens no introducen la secuencia `</style>`, así que no hay riesgo para ese `replace`; solo conviene tenerlo presente si en la fase técnica se añadieran comentarios con contenido arbitrario.
- **Alias en `:root`:** definir p. ej. `--gray-100: var(--bg-card)` es válido; las variables CSS resuelven en cascada dentro del mismo `:root` sin problema de orden, pero conviene agrupar los alias de forma legible.
- **Inconsistencia documentación ↔ código (a corregir en la fase de documentación de `pv-do`):** `design/docs/style/001-tokens-visual.md` afirma hoy *"All neutral grays and reusable shadows/radii are already tokens — no 'one-off' colors remain unpromoted"* y solo lista `rgba(0,0,0,0.5)` y `rgba(255,255,255,0.1)` como valores sueltos. El código real tiene ~20 colores, ~13 sombras y varias esquinas redondeadas sueltas adicionales. **El código es la fuente de verdad.** Este cambio los migra y debe actualizar esa afirmación y las tablas de `001-tokens-visual.md` (que hoy describe una "two-radius scale", un "3-level elevation system" y tamaños tipográficos con la nota "largest to smallest, do not invent intermediate sizes"). También hay que revisar `design/docs/style/002-componentes-layout.md`, que cita valores hoy literales que pasan a token (p. ej. `box-shadow: 0 3px 8px rgba(44,125,216,.35)` en hover de botón primario y `0 3px 8px rgba(211,47,47,.3)` en hover de botón destructivo).
- **Definiciones de datos:** las tablas completas de tokens (paleta de color, tipografía, espaciado, esquinas, sombras, animación) y el mapeo de valores sueltos → token están en los ficheros `design_data_*.md` de esta misma carpeta.
- **Siguiente paso — `pv-how`:** este cambio queda documentado a nivel funcional (qué tokens existen, sus valores, para qué sirven y qué valores sueltos se migran). La solución técnica — orden exacto de las variables en `:root`, agrupación legible de los alias, tratamiento de los alphas 0,2 y de las sombras derivadas del azul/rojo, revisión una a una de las ~20 sustituciones de valor suelto y de las consolidaciones de tamaño, texto exacto de los comentarios de bloque, y actualización de `001-tokens-visual.md` y `002-componentes-layout.md` — la resuelve la skill `pv-how` sobre este `xxxx` (00237), generando el `plan.md`. La inconsistencia doc↔código de más abajo entra en ese plan (secciones (c)/(d)) para que `pv-do` la aplique.
