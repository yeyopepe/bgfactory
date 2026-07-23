- **Nombre**: Grosor configurable en el patrón del tablero
- **Código**: 00068
- **Tipo**: change

## Prompt original del usuario

en la ventana de configuración del patrón del tablero solo se puede cambiar el color del patrón. añade la posibilidad de cambiar también el grosor

## Descripción completa

En la ventana de configuración del patrón del tablero, actualmente solo se puede cambiar el color del patrón. Se añade la posibilidad de cambiar también el grosor del patrón, junto al color existente.

- Nuevo campo numérico "Grosor" en la ventana de configuración del patrón, junto al campo de color ya existente ("Color del patrón").
- Rango: 1 a 20, en pasos de 1, en píxeles.
- Valor por defecto: 1px — coincide con el grosor actual (hoy fijo, sin poder cambiarse), de forma que los tableros ya creados no cambian de aspecto hasta que el usuario ajuste el valor explícitamente.
- Se aplica a las dos formas de patrón existentes (cuadrada y hexagonal): en la forma cuadrada afecta al grosor de las líneas del patrón; en la forma hexagonal afecta al grosor del trazo de los hexágonos.
- El campo de color del patrón y el nuevo campo de grosor se muestran juntos en la misma fila de la ventana, siguiendo el mismo criterio visual que ya usa el proyecto para otros pares "color + grosor" relacionados (como el borde del tablero o el borde de una ficha).
- Solo aplica en Modo Edición, igual que el resto de la configuración del patrón hoy.
- El valor se guarda como parte de las propiedades del tablero, junto al color/forma/filas/columnas del patrón ya existentes, con el mismo alcance y persistencia que esos campos tienen hoy.
- No hay casos límite adicionales de vacío o error: es un campo numérico acotado al rango 1-20, igual que otros campos numéricos similares ya existentes en el proyecto.

### Preguntas de alcance resueltas

- **Rango y valor por defecto del grosor**: 1-20px, paso 1, por defecto 1px (igual que el rango ya usado para el grosor de borde del tablero/ficha, por consistencia).
- **¿Aplica a ambas formas de patrón (cuadrada y hexagonal) o solo a una?**: a ambas.
- **Ubicación del campo en la ventana**: en la misma fila que el campo de color, siguiendo el estándar ya existente en el proyecto para pares color+grosor asociados (borde de tablero y de ficha). Esta convención de estilo, que hasta ahora estaba implícita en el código pero no documentada, se ha añadido a la biblia de estilo del proyecto como parte de este análisis.

## Apuntes técnicos

- Modal de configuración de patrón: `src/ui/boardPatternModal.js` — función `openBoardPatternModal({ properties, onAccept })`, campo de color en líneas 35-47.
- Modelo/defaults: `src/ui/componentModal.js:27-30` (`DEFAULT_BOARD_PROPERTIES`) — añadir `patronGrosor: 1`. El `onAccept` que copia campos a `props` en líneas 498-502 debe copiar también `patronGrosor`.
- Patrón UI color+grosor en la misma fila ya usado en `src/ui/componentModal.js:412-449` (borde tablero) y `:860-897` (borde ficha): `div.modal__field` exterior + `div` interior con `style.display = 'flex'; style.gap = '0.5rem'`, y dos sub-`div` con `style.flex = '1'`. Replicar esta estructura en `boardPatternModal.js` para color+grosor de patrón. Esta convención ya se ha documentado en `design/docs/stylebible/STYLE_BIBLE.md` (sección 8, "Patrones de componente (JS)").
- Renderizado: `src/ui/componentRenderer.js`, líneas ~410-436. Patrón cuadrado: gradiente CSS con líneas fijas a `1px` (líneas ~421-424) — sustituir el `1px` fijo por el valor de `patronGrosor`. Patrón hexagonal: delegado a `renderHexGrid(svg, ..., patronColor)` (línea ~435, definida ~línea 51) — no parametriza grosor de trazo actualmente; hay que añadir `patronGrosor` como parámetro y aplicarlo al `stroke-width` de los `polygon`/líneas del hexágono.
- Ejemplo de referencia para input numérico con clamp: `componentModal.js:432-446` (`min=1`, `max=20`, `parseInt` + `Math.min(Math.max(parsed,1),20)`).
