## (a) Anotaciones funcionales

Fuera de alcance:
- Casillas interactivas (marcar/desmarcar desde el propio "Visor de documentos"): decisión ya confirmada en `description.md` — solo lectura, deshabilitadas, igual que el resto del contenido renderizado.
- Listas de tareas dentro de una lista numerada: la sintaxis `[ ]`/`[x]` solo se reconoce en ítems de listas sin ordenar, coherente con la convención estándar de esta extensión.

Dudas resueltas con el usuario: ver `description.md` (interactividad, variantes `x`/`X` reconocidas, sin viñeta en el ítem con casilla).

## (b) Solución técnica

1. **`src/core/markdown.js`**, en `parseList`: tras calcular `blockHtml`/`soleParagraph` para cada ítem (líneas ~267-269 actuales), si la lista es sin ordenar (`!ordered`) y el texto del ítem ya des-indentado (`itemLines[0]`, antes de cualquier parseo) empieza por un marcador de tarea (`/^\[( |x|X)\]\s+/`), extraer ese marcador y usarlo para decidir `checked` y el texto restante:
   - Quitar el marcador de la primera línea del ítem antes de construir `blockHtml` (para que no aparezca como texto literal `[ ]`/`[x]` dentro del contenido).
   - Generar `<li class="task-list-item"><input type="checkbox" disabled${checked ? ' checked' : ''}> ${contenidoDelItem}</li>` en vez del `<li>` normal.
   - Si la lista tiene al menos un ítem de tarea, envolver la lista en `<ul class="task-list">` en vez de `<ul>` a secas (para poder aplicar `list-style: none` solo a esas listas, sin afectar a las demás).
   - Un ítem sin el marcador `[ ]`/`[x]` al principio se comporta exactamente igual que hoy (ningún cambio para listas normales).
2. **`src/styles/main.css`**, junto a las reglas ya existentes de `.document-viewer__content` (línea ~577 actual): añadir `.document-viewer__content ul.task-list { list-style: none; padding-left: 1rem; }`, `.document-viewer__content li.task-list-item { display: flex; align-items: flex-start; gap: 0.375rem; }` y `.document-viewer__content li.task-list-item input[type="checkbox"] { margin-top: 0.2em; }` — mismo criterio de aspecto plano ya usado en el resto del componente, sin sombras/bisel/animación.
3. No hace falta tocar `sanitizeHtml.js` ni `componentRenderer.js`: el HTML generado (incluido el `<input type="checkbox">`) sigue el mismo camino ya existente (`sanitizeHtml(markdownToHtml(...))`), y `sanitizeHtml` ya permite elementos y atributos normales (solo elimina `<script>`, atributos `on...` y protocolos `javascript:`, ninguno de los cuales aplica aquí).
