# Historial de prompts — 00212

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-15 — sesión inicial

en los mazos aparece siempre en modo juego una etiqueta indicando el número de cartas. Quiero cambiarlo y ampliarlo para todos los componentes. Añade en "Ayuda Jugador":
      -Un check llamado Titulo para des/activar la aparición de un titulo: una etiqueta en la parte superior del componente. Si está activado, muestra el contenido del cuadro de texto según sus propiedades.
      - un botón que abre una modal con las propiedades del titulo:
                  1. cuadro de texto con el contenido del titulo
                  2. dos controles de color para el texto del titulo (negro por defecto) y para el fondo (blanco por defecto). 
                   3. Incluye opción para tranparencia del fondo.

[Aclaraciones posteriores, mismo día, recogidas por turnos de preguntas de confirmación]:

- "Se me olvidó: añade al texto del titulo y del tooltip la variable {cards_current} para sustituirla por el número de cartas actual. Esto de las variables lo quiero reutilizar en el futuro, así que crea un sistema reutilizable."
- Visibilidad del título: solo Modo Juego.
- Formato de texto del título: HTML básico, igual que Tooltip.
- Copiar/Pegar estilo y sincronización de copias: sí, mismo criterio que Tooltip.
- Variable no aplicable al tipo de componente: se deja literal, sin sustituir.
- Posición visual del título: igual que la etiqueta actual del mazo.
- "Mostrar título de componente": override de grupo, igual que "Mostrar tooltip".
- Nombre del campo: "Título de componente" (para evitar confusión con el título de cabecera de la partida).
