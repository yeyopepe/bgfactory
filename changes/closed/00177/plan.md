- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. El clic simple, el botón "Aceptar", el botón "Cancelar", el filtro de búsqueda y el cierre al hacer click fuera del modal quedan exactamente igual que hoy.

**Dudas resueltas con el usuario:** (ya resueltas en `description.md` durante `ms-new`, se recogen aquí para el diseño técnico)
- ¿Doble clic sobre una miniatura ya seleccionada también confirma? → Sí, siempre confirma con esa imagen, sin caso especial.
- ¿El clic simple cambia? → No, sigue solo seleccionando.
- ¿Aplica a los 3 flujos que reutilizan el modal? → Sí, al ser un único componente, sin tratamiento especial en ninguno.

## (b) Solución técnica

1. **`src/ui/boardImageModal.js` — añadir confirmación directa en el listener de doble clic de cada miniatura.** En `renderGallery` (función que crea cada `item`, líneas 65-90), junto al listener `click` ya existente (líneas 82-87), añadir un listener `dblclick` sobre el mismo `item`:
   ```js
   item.addEventListener('dblclick', () => {
     selectedId = resource.id;
     if (onAccept) onAccept(selectedId);
     overlay.remove();
   });
   ```
   No hace falta actualizar la clase `--selected` ni `updateAcceptButton()` en esta rama porque el modal se cierra inmediatamente (`overlay.remove()`) — a diferencia del `click`, aquí no hay repintado visible que dependa de ese estado intermedio.
   El navegador dispara `click` antes que `dblclick` en una secuencia de doble clic, así que el primer `click` ya deja `selectedId` fijado igual que hoy; el `dblclick` únicamente añade la confirmación y el cierre, reutilizando la misma variable `selectedId` ya actualizada. No es necesario ningún `preventDefault`/`stopPropagation` adicional: ambos listeners están sobre el mismo elemento y no hay conflicto entre ellos.

Sin más tareas: es un cambio de una única función en un único fichero, ya que los tres flujos que reutilizan `openBoardImageModal` heredan el comportamiento automáticamente.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, la entrada de `ui/boardImageModal.js` (sección de descripción de módulos `ui/*`) dice actualmente:

> `ui/boardImageModal.js` (cambio 00019): sub-modal análoga para el fondo "Imagen" — galería en grid (miniatura + nombre) de los recursos de la galería (`core/state.js`, `getResources()`) con `type === 'imagen'`, selección única con click; si no hay ninguno, muestra "No hay imágenes disponibles" con "Aceptar" deshabilitado. [...]

Hay que actualizar "selección única con click" a algo como "selección única con click (doble click sobre una miniatura la selecciona y confirma directamente, equivalente a click + Aceptar, cambio 00177)", para que quede reflejado el nuevo atajo de doble clic.

## (e) Verificación

1. Abrir el modal de elegir imagen desde cualquiera de los 3 flujos (fondo "Imagen" de un componente de tablero, "Elegir imagen…" de una figura en `ui/cardShapeModal.js`, "Elegir imagen…" de una cara en `ui/visualEditorModal.js`) y comprobar que un clic simple sobre una miniatura sigue marcándola como seleccionada (borde de selección) y habilitando "Aceptar", sin cerrar el modal.
2. Hacer doble clic sobre una miniatura no seleccionada previamente: el modal debe cerrarse inmediatamente y la imagen elegida debe aplicarse igual que si se hubiera hecho click + "Aceptar".
3. Hacer doble clic sobre la miniatura que ya estaba seleccionada (p.ej. reabriendo el modal con una imagen ya configurada): debe confirmar y cerrar igual que en el punto anterior.
4. Comprobar que "Cancelar", el cierre al hacer click fuera del modal, y el filtro de búsqueda siguen funcionando exactamente igual que antes del cambio.
