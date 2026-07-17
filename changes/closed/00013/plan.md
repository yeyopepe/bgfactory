## (a) Anotaciones funcionales

- El botón "Eliminar" solo se muestra cuando la modal edita un componente existente (`component` no nulo). Cuando se abre para crear uno nuevo (`openAddModal` en `editMode.js`) no hay nada que eliminar todavía, así que no se renderiza — esto no estaba explícitamente resuelto en `description.md`, pero se deduce de que la propia descripción llama a la ventana "la ventana de edición de un elemento" y solo referencia `openEditModalFor` en los apuntes técnicos.
- Fuera de alcance: no se toca el mecanismo de confirmación (`confirm()` nativo) en ningún sitio, ni se añade atajo de teclado.
- Alcance ampliado a petición del usuario: además del botón nuevo en la modal, revisar y homogeneizar el estilo "destructivo" en el resto de la app para que ambos caminos de eliminación (modal y listado) se vean coherentes entre sí. Tras revisar todo `src/` (componentList.js, componentModal.js, componentRenderer.js, editMode.js, state.js, toast.js — únicos ficheros que mencionan "eliminar/remove/borrar/delete"), el único otro punto de la UI con una acción destructiva real de cara al usuario es el botón "Eliminar" ya existente en `componentList.js` (líneas 132-143): hoy comparte estilo con el botón "Editar" de la misma fila (mismo azul de acción primaria, vía el selector conjunto `.component-list__actions-cell button`), lo cual queda inconsistente en cuanto exista un botón "Eliminar" rojo en la modal para la misma acción sobre el mismo componente. El resto de "remove"/"delete" encontrados son términos técnicos sin UI propia (`removeEventListener`, `classList.remove`, `removeComponent` en `state.js`) y no aplican.

## (b) Solución técnica

1. **`src/ui/componentModal.js`** — añadir soporte para el botón "Eliminar":
   - Añadir un nuevo parámetro `onDelete` a la firma de `openComponentModal({ component, onAccept, onDelete })`.
   - En la construcción del footer (antes de `cancelBtn`), si `!isNew && onDelete` existe, crear `deleteBtn` (`button`, `className = 'btn-eliminar'`, texto `'Eliminar'`) y añadirlo a `footer` como primer hijo (para que quede a la izquierda con `margin-right: auto`, igual que en la maqueta `design_boton-eliminar-modal.html`).
   - Handler de `deleteBtn`: `if (confirm(\`¿Eliminar el componente "${workingComponent.id}"?\`)) { onDelete(component); overlay.remove(); }` — mismo texto de confirmación que ya usa `componentList.js` (línea 138), y mismo patrón de cierre (`overlay.remove()`) que usan `cancelBtn`/`acceptBtn`.
   - Usar `component.id` (el original, no `workingComponent.id`) al llamar a `onDelete`, igual que hace `onAccept` al recibir el componente para reemplazar — consistente con que `onDelete` debe identificar el componente real a borrar, no el borrador en edición.

2. **`src/modes/edit/editMode.js`** — conectar el borrado con el estado de edición:
   - En `openEditModalFor(component)`, añadir `onDelete` a la llamada a `openComponentModal`:
     ```js
     onDelete: (deletedComponent) => {
       if (selectedComponentId === deletedComponent.id) {
         selectedComponentId = null;
       }
       removeComponent(deletedComponent.id);
     },
     ```
   - Resetear `selectedComponentId` **antes** de llamar a `removeComponent`, ya que este emite `components:changed`, que dispara `renderAll` → `renderEditMode` de forma síncrona (vía `eventBus`); así el re-render ya ve la selección limpia.
   - No hace falta tocar `openAddModal` (no pasa `onDelete`, así el botón no aparece al crear).

3. **`src/styles/main.css`** — estilos del nuevo botón y promoción del token de error:
   - Añadir `--error: #d32f2f;` a `:root` (ya documentado como color puntual en `STYLE_BIBLE.md` §2, y con esta segunda reutilización toca promoverlo a token según la propia regla del documento).
   - Cambiar `.modal__error { color: #d32f2f; ... }` a `color: var(--error);`.
   - Añadir regla `.btn-eliminar` junto a `.btn-cancel, .btn-accept` (mismo padding/border/border-radius/cursor/font-size que ya comparten esos dos, vía el selector conjunto existente `.btn-cancel, .btn-accept` ampliado a `.btn-cancel, .btn-accept, .btn-eliminar`):
     ```css
     .btn-eliminar {
       background: var(--error);
       color: var(--text-light);
       margin-right: auto;
     }

     .btn-eliminar:hover {
       opacity: 0.9;
     }
     ```
     (`margin-right: auto` en un `.modal__footer` con `justify-content: flex-end` empuja este botón al extremo izquierdo dejando cancelar/aceptar agrupados a la derecha, igual que en la maqueta.)

4. **`src/ui/componentList.js`** — homogeneizar el botón "Eliminar" de la fila con el nuevo estilo destructivo:
   - Dar al `removeButton` una clase propia en vez de depender solo del selector compartido `.component-list__actions-cell button`: `removeButton.className = 'component-list__action-btn component-list__action-btn--danger';`.
   - Dar también al `editButton` la clase base `component-list__action-btn` (sin modificador), para que ambos seleccionen el mismo tamaño/forma base y solo difieran en color por el modificador.
   - No se toca el `confirm(...)` ya existente (línea 138) ni el resto del comportamiento del botón, solo su clase/estilo.

5. **`src/styles/main.css`** — nuevo modificador para el botón de eliminar del listado:
   - Renombrar el selector existente `.component-list__actions-cell button { ... }` a `.component-list__action-btn { ... }` (misma declaración, solo cambia el selector para colgar de la clase nueva en vez del hijo genérico) y su `:hover` correspondiente.
   - Añadir `.component-list__action-btn--danger { background: var(--error); }` (mismo padding/radius/font ya heredados de la clase base; solo cambia el color de fondo, coherente con que `.btn-eliminar` tampoco redefine tamaño, solo color).

## (d) Cambios en estilo

- **`design/docs/STYLE_BIBLE.md`**:
  - §2 (Design tokens): mover `--error` de la lista de "colores puntuales que aún no son tokens" a la lista de tokens en `:root`, con su comentario (`/* estados de error y acciones destructivas */`).
  - §7 (Nomenclatura BEM): documentar `.component-list__action-btn` / `.component-list__action-btn--danger` como el patrón BEM estándar para variantes de color de un botón dentro de un bloque existente (a diferencia de `.btn-*`, que es la excepción reservada a botones standalone de modal).
  - §9 (Botones): añadir una nueva viñeta de "Acción destructiva": fondo `var(--error)`, texto `var(--text-light)`, hover `opacity: 0.9` — aplicable tanto a `.btn-eliminar` (excepción `.btn-*` en modales) como a cualquier modificador BEM `--danger`/`--eliminar` dentro de un bloque existente (p. ej. `.component-list__action-btn--danger`), dejando claro que el criterio de "acción destructiva" es transversal a ambos patrones de nomenclatura.
