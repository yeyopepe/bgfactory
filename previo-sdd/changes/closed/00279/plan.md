- **Creation date**: 2026-09-15

## Functional notes

**Out of scope:** no se toca el As (ya muestra el símbolo del palo grande y centrado, sin corona ni letra central), ni el Joker, ni el reverso de las cartas, ni el borde de las cartas. Tampoco se reposiciona el número de esquina (solo cambia su tamaño, misma posición `x="7" y="19"`).

**Doubts resolved with the user:** ninguna duda técnica adicional a las ya resueltas en `description.md`. El único punto que quedaba abierto para esta fase (el tamaño exacto de la letra de esquina en J/Q/K, "a determinar por pv-how/pv-do dentro de un rango razonable") se fija en `font-size="26"`, tomando como referencia el mockup `design_cartas-esquinas-y-figuras.html` ya validado por el usuario (23 para el resto de cartas +65%, 26 para J/Q/K).

## (b) Technical solution

- [x] **`src/core/svgTemplates.js` — `renderCorner` recibe el tamaño de fuente como parámetro.** Cambiar la firma de `renderCorner(label, colorHex)` a `renderCorner(label, colorHex, fontSize)`, sustituyendo el `font-size="14"` fijo del `<text>` interno por `font-size="${fontSize}"`. Esta función es compartida por `renderNormalFace`, `renderAceFace` y `renderFigureFace`, así que cada una debe pasar ahora su propio tamaño.
- [x] **`src/core/svgTemplates.js` — `renderNormalFace` usa esquina `font-size="23"`.** Actualizar las dos llamadas a `renderCorner(label, colorHex)` dentro de `renderNormalFace` (esquina superior y esquina rotada 180°) para pasar `23` como tercer argumento (14 → 23, +65%). El símbolo central (`font-size="42"`) no cambia.
- [x] **`src/core/svgTemplates.js` — `renderAceFace` usa esquina `font-size="23"`.** Igual que en el punto anterior: las dos llamadas a `renderCorner` dentro de `renderAceFace` pasan `23`. El símbolo central del As (`font-size="74"`) no cambia — el As queda fuera del alcance de este cambio salvo por el tamaño de esquina, que sí sube igual que el resto de cartas numéricas según `description.md`.
- [x] **`src/core/svgTemplates.js` — `renderFigureFace` elimina la corona y agranda el símbolo central.** Quitar por completo el `<path d="M 30,65 L 30,53 L 40,60 L 50,46 L 60,60 L 70,53 L 70,65 Z" fill="${colorHex}"/>` y los tres `<circle>` (joyas de la corona) que le siguen. Cambiar el `<text>` del símbolo del palo de `font-size="32"` a `font-size="96"` (x3), y recentrar verticalmente: pasar de `x="50" y="105"` a `x="50" y="75"` (mismo centro vertical que usa `renderNormalFace` para su símbolo, `y="82"`, ajustado a `75` conforme al mockup validado, ya que con `font-size="96"` y `dominant-baseline="middle"` ese valor centra visualmente el símbolo en la carta). Mantener `text-anchor="middle"` y `dominant-baseline="middle"`.
- [x] **`src/core/svgTemplates.js` — `renderFigureFace` usa esquina `font-size="26"`.** Las dos llamadas a `renderCorner` dentro de `renderFigureFace` pasan `26` (mayor que el `23` general, para compensar que el centro ya no lleva letra). Sin cambios de color, trazo o fondo en la esquina: sigue siendo el mismo `<text>` con `fill="${colorHex}"`, sin contorno ni placa.

## (e) Verification

- [x] Generar el preset "Baraja Francesa" en modo edición y abrir/inspeccionar visualmente una carta numérica (p. ej. el 7 de corazones): el número de las dos esquinas se ve claramente más grande que antes (23 vs. 14 previos), en la misma posición, sin recortarse ni salirse del borde de la carta.
- [x] Inspeccionar visualmente el As de cualquier palo: la esquina también creció (23), y el símbolo central grande no cambió.
- [x] Inspeccionar visualmente una carta de figura (J, Q o K) de un palo negro y de un palo rojo: el centro de la carta ya no muestra la corona ni ninguna letra, solo el símbolo del palo en grande (aprox. 3 veces el tamaño anterior), en el color correspondiente al palo, bien centrado en la carta.
- [x] En esa misma carta de figura, comprobar que la letra (J/Q/K) sigue apareciendo en ambas esquinas, con un tamaño mayor que el de las cartas numéricas (26 vs. 23), dibujada como trazo negro/rojo sólido sin contorno ni fondo, igual estilo que el resto de la baraja.
- [x] Confirmar que el Joker y el reverso de las cartas no cambiaron visualmente.
