- **Creation date**: 2026-08-19
- **Risk**: 1/10 — Riesgo mínimo

## (a) Functional notes

**Out of scope:** ningún otro tipo de componente (tableroSimple, tableroPersonalizado, carta, texto, documento, mazo) cambia de orden en su pestaña "Visuales" — solo Dado. No se añade, quita ni renombra ninguna propiedad ni comportamiento de los tres campos movidos (Color del cuerpo, Color de los números, Tipo de fuente): mismas etiquetas, mismos listeners, mismos valores por defecto.

**Doubts resolved with the user:** ninguna duda técnica pendiente — el diseño se resuelve directamente reutilizando el patrón `fieldset.modal__section` ya existente en el mismo fichero (`sizeSection`/`extrusionSection`).

## (b) Technical solution

- [x] **`src/ui/componentModal.js` — crear la sección "Estilo" (fieldset) junto a `sizeSection`/`extrusionSection`.** Entre el bloque que crea `sizeSection` (~línea 369-373) y su `appendChild` a `visualContent` (línea 638), declarar una nueva sección con el mismo patrón:
  ```js
  const dadoStyleSection = document.createElement('fieldset');
  dadoStyleSection.className = 'modal__section';
  const dadoStyleLegend = document.createElement('legend');
  dadoStyleLegend.className = 'modal__section-title';
  dadoStyleLegend.textContent = 'Estilo';
  dadoStyleSection.appendChild(dadoStyleLegend);
  ```
  Solo se crea y se appendea a `visualContent` cuando `workingComponent.type === 'dado'` (ver siguiente tarea) — no debe aparecer para otros tipos.
- [x] **`src/ui/componentModal.js` — insertar la sección "Estilo" en el DOM entre Tamaño y Extrusión, solo para Dado.** Justo después de `visualContent.appendChild(sizeSection);` (línea 638) y antes de la definición/append de `extrusionSection` (línea 644 en adelante), añadir:
  ```js
  if (workingComponent.type === 'dado') {
    visualContent.appendChild(dadoStyleSection);
  }
  ```
  Esto garantiza el orden en el DOM: Tamaño → (Estilo, si es Dado) → Extrusión.
- [x] **`src/ui/componentModal.js` — redirigir los tres campos de estilo del Dado a la nueva sección en vez de a `visualContainer`.** En `renderDadoSpecificFields(container, visualContainer)` (~línea 1345), sustituir los tres `visualContainer.appendChild(...)` que hoy appendean a la pestaña "Visuales" directamente:
  - `bodyColorField` (~línea 1368): `visualContainer.appendChild(bodyColorField)` → `dadoStyleSection.appendChild(bodyColorField)`.
  - `numColorField` (~línea 1383): `visualContainer.appendChild(numColorField)` → `dadoStyleSection.appendChild(numColorField)`.
  - `fontField` (~línea 1499): `visualContainer.appendChild(fontField)` → `dadoStyleSection.appendChild(fontField)`.
  `dadoStyleSection` es accesible desde `renderDadoSpecificFields` porque ambas están definidas en el mismo scope de función que construye la modal (closure), igual que ya ocurre con `visualContent`/`extrusionSection`/`sizeSection` — no hace falta pasarla como parámetro nuevo, pero si se prefiere explicitarla como parámetro adicional de `renderDadoSpecificFields` (en vez de depender de closure), es una decisión de estilo de implementación libre siempre que el resultado final sea el mismo.
  No tocar el resto del cuerpo de `renderDadoSpecificFields` (modo de caras, número máximo, lista de valores siguen apuntando a `container`, la pestaña "Específicas", sin cambios).

## (e) Verification

- [x] Abrir la modal de propiedades de un componente Dado ya existente en el tablero y entrar en la pestaña "Visuales": el orden visible de arriba a abajo es Tamaño, Estilo, Extrusión.
- [x] Dentro de la sección "Estilo" (con su propio recuadro y título "ESTILO"), aparecen en este orden: Color del cuerpo, Color de los números, Tipo de fuente (botón "Elegir tipografía" + nombre actual).
- [x] Editar el color del cuerpo, el color de los números y elegir una tipografía distinta desde la sección "Estilo": los tres campos siguen funcionando igual que antes (se reflejan en el dado al Aceptar).
- [x] Abrir la modal de propiedades de otros tipos de componente (tableroSimple, tableroPersonalizado, carta, texto, documento, mazo) y confirmar que su pestaña "Visuales" no cambia: mantienen el orden Tamaño → Extrusión → sus secciones específicas, sin ninguna sección "Estilo" nueva.
- [x] Crear un Dado nuevo (alta de componente) y comprobar que la pestaña "Visuales" muestra el mismo nuevo orden desde el primer momento.
