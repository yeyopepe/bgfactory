- **Nombre**: Botones "Editar diseño del tablero" y "Ver contenido del mazo" a ancho completo
- **Código**: 00206
- **Tipo**: fast
- **Fecha creación**: 2026-08-14

## Descripción completa

En el diálogo de propiedades del componente, pestaña "Específicas":

- Para un tablero personalizado, el botón "Editar diseño del tablero" se mostraba con un ancho ajustado a su texto en vez de ocupar todo el ancho disponible del panel.
- Para un mazo, el botón "Ver contenido del mazo" tenía el mismo problema.

Otros botones de la misma zona del diálogo, como "Sincronizar todas las copias" (pestaña "Copias"), ya se muestran ocupando todo el ancho disponible. Ahora "Editar diseño del tablero" y "Ver contenido del mazo" se comportan igual, mostrándose a ancho completo para mantener la coherencia visual del diálogo.

## Apuntes técnicos

- Ambos botones se definen en `src/ui/componentModal.js`: `editBtn` (texto "Editar diseño del tablero", dentro de `renderTableroPersonalizadoSpecificFields`) y `contentBtn` (texto "Ver contenido del mazo", dentro de `renderMazoSpecificFields`).
- El botón "Sincronizar todas las copias" ya usa `syncAllBtn.style.width = '100%';` como precedente; se ha aplicado el mismo patrón inline a los dos botones anteriores.

## Cambios aplicados

- `src/ui/componentModal.js`: añadido `editBtn.style.width = '100%';` tras `editBtn.textContent = 'Editar diseño del tablero';` (botón de tablero personalizado).
- `src/ui/componentModal.js`: añadido `contentBtn.style.width = '100%';` tras `contentBtn.textContent = 'Ver contenido del mazo';` (botón de mazo).
