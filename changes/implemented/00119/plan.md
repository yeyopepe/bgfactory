## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro campo del mazo o de otros componentes que pudiera desincronizarse de forma similar entre un draft de edición abierto y el estado real (patrón general de "draft vs. estado real mutado externamente"). Este fix corrige únicamente el caso concreto de `properties.cartaIds` del mazo al sacar cartas desde su propia ventana de propiedades.
- Duda resuelta con el usuario: se confirmó que el revertido ocurre en la ventana de propiedades del mazo (Aceptar/Cancelar), no en la ventana de "Contenido del mazo". Aceptar revirtiendo es el bug a corregir; Cancelar revirtiendo se mantiene tal cual (no se toca su código).

## (b) Solución técnica

1. En `src/ui/componentModal.js`, dentro de `renderSpecificTab` (sección del tipo `'mazo'`), el `onSacar` que se pasa a `openMazoContentModal` (línea ~1171) hoy es `(cartaId) => sacarCartaDeMazo(workingComponent.id, cartaId)`. Cambiarlo para que, tras invocar `sacarCartaDeMazo`, vuelva a leer el mazo real actualizado (`getComponents().find(c => c.id === workingComponent.id)`) y sincronice `workingComponent.properties.cartaIds` con el valor ya actualizado (`mazoActual?.properties?.cartaIds ?? []`).
   - Importante: hay que **mutar `cartaIds` dentro del mismo objeto `workingComponent.properties`** (asignar la propiedad `cartaIds`, no reemplazar `workingComponent.properties` por un objeto nuevo), porque `props` (línea 1125, `const props = workingComponent.properties`) se capturó una sola vez al construir esta pestaña — reemplazar el objeto entero dejaría esa referencia obsoleta y otros campos de la pestaña de mazo (p.ej. orientación) dejarían de guardarse al aceptar tras haber sacado una carta.
2. Con esto, cuando se pulse "Aceptar", `workingComponent.properties.cartaIds` ya refleja las cartas realmente sacadas, así que `replaceComponent(component.id, workingComponent)` (en `editMode.js`, `openEditModalFor`) deja de revertirlas — sin tocar ese contrato ni el resto del flujo de aceptar.
3. No se toca el botón "Cancelar" (`cancelBtn` en `componentModal.js`): sigue haciendo únicamente `overlay.remove()`, igual que hoy.
4. No se toca `mazoContentModal.js` (botón "Cerrar" y cierre por ESC): su comportamiento ya es correcto y no interviene en esta causa raíz.

No aplica (a) cambios de arquitectura ni (b) cambios de estilo — el fix es una corrección puntual de sincronización de estado dentro de una función ya existente, sin alterar capas, componentes ni apariencia visual.
