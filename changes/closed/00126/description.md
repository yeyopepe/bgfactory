- **Nombre**: Figura "Rectángulo redondeado" en el editor de cartas
- **Código**: 00126
- **Tipo**: change

## Prompt original del usuario

añade una figura geométrica más en el editor de cartas: el cuadrado/rectángulo con bordes redondeados

## Descripción completa

En el editor de cartas, al insertar una figura geométrica en una cara, hoy solo hay dos tipos disponibles en la ventana "Editar figura" (doble click sobre la figura): "Círculo / elipse" y "Cuadrado". Se añade un tercer tipo: "Rectángulo redondeado", seleccionable con un botón-icono adicional junto a los otros dos, dentro del mismo selector de tipo de figura.

- Convive con los dos tipos existentes, no sustituye a ninguno.
- Comparte todas las propiedades ya existentes de una figura (color de fondo, transparencia, color y grosor de borde, activar/desactivar borde) sin ningún campo nuevo.
- Es libremente redimensionable como rectángulo (ancho y alto independientes) — igual que el "Cuadrado" actual; no fuerza lados iguales al cambiar a este tipo (a diferencia del círculo, que sí lo hace).
- El radio de las esquinas redondeadas es fijo (mismo valor para todas las figuras de este tipo), sin control ni campo numérico en la ventana de edición — sigue el precedente ya existente en el proyecto para las esquinas redondeadas de las cartas, en vez de añadir un control de radio configurable.
- Al insertar una figura nueva, sigue creándose como círculo por defecto (comportamiento sin cambios); el usuario elige "Rectángulo redondeado" cambiando el tipo después, igual que ya hace hoy para elegir "Cuadrado".
- Aplica igual en ambas caras de la carta (frontal y trasera), sin restricciones de rol/modo (mismo alcance que las figuras existentes).

### Preguntas de alcance resueltas

- **¿Sustituye al cuadrado existente?** No, convive con él como tercera opción independiente.
- **¿Necesita un campo nuevo (radio de esquina configurable)?** No — el radio es fijo, siguiendo el precedente ya usado para las cartas, para mantener consistencia y no añadir un control nuevo.
- **¿Se fuerza a lado igual al cambiar a este tipo, como pasa con el círculo?** No — sigue siendo libremente redimensionable como rectángulo, igual que el "Cuadrado" actual.
- **¿El comportamiento de inserción por defecto cambia?** No — una figura nueva se sigue creando como círculo; el usuario cambia el tipo después desde la ventana de edición, como ya hace hoy.

## Apuntes técnicos

- **Selector de tipo de figura**: `src/ui/cardShapeModal.js`, array `SHAPE_TYPE_OPTIONS` (líneas ~36-47) — define hoy `'circular'` y `'cuadrada'` como botones-icono con label + SVG. Habría que añadir una tercera entrada (p.ej. `'redondeada'`) con su propio icono (rectángulo con esquinas curvas).
- **Renderizado en la carta final**: `src/ui/componentRenderer.js` línea ~309 — hoy `shapeEl.style.borderRadius = shape.tipo === 'circular' ? '50%' : '0';` (ternario binario). Habría que ampliarlo a un mapeo por tipo que incluya el nuevo radio fijo para `'redondeada'`.
- **Renderizado en el propio editor (preview en vivo)**: `src/ui/cardEditorModal.js` línea ~636 — mismo patrón ternario `shape.tipo === 'circular' ? '50%' : '0'`, misma ampliación necesaria para mantener editor y render final sincronizados.
- **Precedente de radio fijo a reutilizar**: `src/core/cardProportions.js` línea ~54 — `esquinasRedondeadas ? '8px' : '0'`, usado hoy para el redondeo de esquinas de la carta completa (no de una figura individual). No hay documentación en `ARCHITECTURE.md` sobre el catálogo de tipos de figura del editor de cartas; no se detectó ninguna incongruencia entre documentación y código en este punto.
- **Inserción de figura nueva**: `src/ui/cardEditorModal.js` líneas ~440-455, `onAddShape` — crea siempre `tipo: 'circular'` por defecto; no requiere cambios ya que el usuario cambia el tipo después.
