- **Fecha creación**: 2026-08-14

## (a) Anotaciones funcionales

**Fuera de alcance:** los sliders que no son de rotación (zoom, opacidad/transparencia) no se tocan. No se añade ningún control de sentido separado del propio slider (el signo del valor ya lo expresa).

**Dudas resueltas con el usuario:**
- ¿Un único slider con signo, o selector de sentido + slider de magnitud? → Un único slider con signo (-360..360).
- ¿Las marcas magnéticas se reflejan también en el lado negativo? → Sí, simétricas.
- ¿El atajo "Girar 90°" del menú contextual queda fuera de alcance al no ser un slider? → No, también se amplía a dos direcciones.
- ¿Cómo se comporta "Girar 90°" al llegar a un extremo del rango (360º en horario, -360º en antihorario)? → Da la vuelta al otro extremo (360º + 90º horario → -270º; -360º - 90º antihorario → 270º), preservando el carácter cíclico que ya tiene hoy.

## (b) Solución técnica

- [x] **`src/ui/rotationSlider.js` — ampliar rango y marcas magnéticas del widget compartido.** Cambiar `SNAP_MARKS` de `[0, 90, 180, 270, 360]` a `[-360, -270, -180, -90, 0, 90, 180, 270, 360]`. Cambiar `slider.min = 0` a `slider.min = -360` (mantener `slider.max = 360`, `slider.step = 1`). En `commitTextInput()`, cambiar `clamp(parsed, 0, 360)` por `clamp(parsed, -360, 360)`. No hace falta tocar `closestMark`, `refreshActiveMark`, el listener `input` del slider, ni la generación de `labelsEl`/`markEls`: ya iteran sobre `SNAP_MARKS`, por lo que heredan el nuevo rango automáticamente. Tampoco hace falta tocar el CSS de `.rotation-slider__marks`/`.rotation-slider__labels` (`src/styles/main.css`, bloque de `rotation-slider__*`): al usar `flex; justify-content: space-between` con marcas equiespaciadas en valor (paso 90º en ambos casos, 5 antes y 9 ahora), la alineación visual con la pista del `<input type="range">` sigue siendo correcta sin cálculo por valor.
- [x] **`src/ui/imageAdjustModal.js`, `src/ui/cardShapeModal.js`, `src/ui/cardTextBoxModal.js` — sin cambios de código.** Los tres consumen `createRotationSliderField({ value, onChange })` pasando directamente `rotation`/`working.rotation` sin clamps ni validación propia (confirmado en `imageAdjustModal.js:270-277`, `cardShapeModal.js:323-328`, `cardTextBoxModal.js:481-486`); al no reimplementar ningún límite, heredan el nuevo rango solo con el cambio del punto anterior. No se toca nada en estos ficheros — se deja anotado aquí para que quien verifique no dé por hecho que falta algo.
- [x] **`src/ui/visualEditorModal.js` — añadir función `wrapRotation` y aplicarla al atajo "Girar 90°".** Junto a `createRotateIcon()` (línea ~95), añadir una función de módulo:
  ```js
  function wrapRotation(value) {
    if (value > 360) return value - 720;
    if (value < -360) return value + 720;
    return value;
  }
  ```
  (720 = tamaño del rango -360..360; envuelve al extremo opuesto en vez de cortar, preservando el carácter cíclico ya documentado en el style bible §12.12).
- [x] **`src/ui/visualEditorModal.js` — renombrar el ítem existente y añadir el nuevo, en el bloque de `generalItems` (líneas ~607-617).** Renombrar `label: 'Girar 90°'` a `label: 'Girar 90° (horario)'`, y cambiar su `onClick` para usar `element.rotation = wrapRotation((element.rotation ?? 0) + 90)` en vez de `% 360`. Justo después, añadir un segundo ítem hermano con la misma estructura: `label: 'Girar 90° (antihorario)'`, `onClick` con `element.rotation = wrapRotation((element.rotation ?? 0) - 90)`, mismo `renderFaces()` al final. Reutilizar el mismo icono (`createRotateIcon()`) para ambos — no hace falta un icono espejo nuevo, el icono ya es genérico (flecha de giro), y no hay precedente en el proyecto de iconos direccionales para esta acción.
- [x] **`design/docs/architecture/02-component-types.md` — actualizar el tipo documentado de `rotation`.** Cambiar `rotation: number (0-360) | undefined` por `rotation: number (-360-360) | undefined` en las dos apariciones (línea 116, tipo `Forma`; línea 140, tipo `TextBox`).
- [x] **`design/docs/style/03-modales-menus.md` — actualizar la sección 12.12 y la referencia cruzada en 12.8.** En 12.12, donde describe las marcas imantadas y menciona el atajo "Girar 90°" como "incrementando +90° cíclicamente" (línea ~298), reflejar que ahora son dos atajos (horario/antihorario, ±90°) y que el rango del slider es -360..360 con marcas simétricas. No hace falta tocar la sección 12.8 en sí (patrón genérico del menú contextual, no depende del número de ítems).

## (c) Cambios de arquitectura

No aplica: esta solución no modifica capas, dependencias entre módulos ni el modelo genérico de componente — solo el rango de un campo (`rotation`) ya existente y un widget/atajo de UI.

## (d) Cambios en estilo

Ver tareas de `design/docs/style/03-modales-menus.md` en (b) — sección 12.12 (y su mención cruzada del atajo del menú contextual) se actualiza para reflejar el nuevo rango simétrico y los dos atajos horario/antihorario.

## (e) Verificación

- [x] En el modal de ajuste de imagen de fondo, el slider de rotación va de -360º a 360º, con 0º aproximadamente en el centro de la pista, y el valor puede arrastrarse o escribirse (campo de texto) tanto en positivo como en negativo.
- [x] Las marcas magnéticas del slider están en -360, -270, -180, -90, 0, 90, 180, 270 y 360, y el valor se ajusta a la marca más cercana al soltar el arrastre dentro del umbral de 8º, igual que hoy pero también en el lado negativo.
- [x] El mismo comportamiento (rango, marcas, campo de texto) se observa igual en el modal de forma de tarjeta y en el modal de caja de texto.
- [x] Un elemento (forma, caja de texto o imagen de fondo) con rotación negativa gira visualmente en sentido antihorario en la mesa/carta, y con rotación positiva en sentido horario.
- [x] Un componente ya guardado con rotación entre 0º y 360º se sigue abriendo, mostrando y editando con normalidad, sin ningún error ni migración visible.
- [x] El menú contextual de una forma o caja de texto muestra dos ítems distintos, "Girar 90° (horario)" y "Girar 90° (antihorario)", cada uno girando el elemento 90º en su sentido al pulsarlo.
- [x] Pulsando "Girar 90° (horario)" repetidamente desde un valor cercano a 360º, al superar el límite el valor salta al extremo opuesto (p. ej. de 360º a -270º) en vez de detenerse o dar error; simétricamente para "Girar 90° (antihorario)" cerca de -360º.
