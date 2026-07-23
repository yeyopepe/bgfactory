## (a) Anotaciones funcionales

- Fuera de alcance: cualquier mejora del panel de recursos (ya funciona correctamente y no se toca), y cualquier otro comportamiento del panel de componentes distinto del toggle de colapso (arrastrar, redimensionar, filtrar, editar/clonar/eliminar filas).
- No ha habido dudas de alcance que resolver con el usuario; la causa raíz y la solución quedaron ya identificadas al documentar el fix.

## (b) Solución técnica

1. En [`src/modes/edit/editMode.js`](../../../src/modes/edit/editMode.js), dentro de `renderEditMode`, cambiar la declaración de `collapsed` de `const` a una variable local mutable, siguiendo el mismo patrón que ya usa el panel de recursos con `resourceCollapsed`:
   - Sustituir `const { collapsed, position: panelPosition, width: panelWidth, columnWidths: panelColumnWidths } = getPanelState();` por una desestructuración que no capture `collapsed` como const, y declarar aparte `let collapsed = getPanelState().collapsed;` (igual que ya hace la línea 32 para `resourceCollapsed`).
2. En el callback `onToggleCollapse` del panel de componentes (dentro de `renderList()`), actualizar la variable local antes de persistir y re-renderizar, igual que hace el del panel de recursos:
   ```js
   onToggleCollapse: () => {
     collapsed = !collapsed;
     setPanelState({ collapsed });
     renderList();
   },
   ```
   (en vez de `setPanelState({ collapsed: !collapsed }); renderList();`).
3. Verificar manualmente en el navegador (modo edición) que el icono del panel "Componentes" colapsa y expande la lista al pulsarlo, igual que ya lo hace el de "Recursos", y que el resto de interacciones del panel (arrastrar, redimensionar, filtrar, filas) siguen intactas.

No se toca `src/ui/componentList.js` ni `src/ui/resourceList.js`: el bug está únicamente en el estado local de `editMode.js`.
