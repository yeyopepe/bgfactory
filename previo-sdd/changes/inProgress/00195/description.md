- **Name**: Patrón de círculos en tablero simple
- **Code**: 00195
- **Type**: change
- **Creation date**: 2026-08-08

## Full description

En el componente "Tablero simple", el fondo "Color y patrón" ya permite elegir la forma de las casillas de una rejilla (Cuadrada, Hexagonal vértices arriba/abajo, Hexagonal vértices izquierda/derecha). Se añade una cuarta forma: **Circular**, para dibujar un patrón de círculos en vez de líneas rectas. Solo aplica a Tablero simple — Tablero personalizado no se toca en este cambio.

Comportamiento:

- Al elegir la forma "Circular", dados un número de filas y columnas (mismos campos "Filas"/"Columnas" ya existentes, reutilizados), se dibuja una rejilla de círculos, cada uno al tamaño máximo posible dentro de su celda sin solaparse con los círculos vecinos, menos el margen configurado.
- Nuevo campo **"Margen"**: distancia de separación entre las siluetas vecinas de la rejilla (el hueco donde se ve el "Color de fondo" detrás). Rango 0–50, por defecto 0 (las siluetas se tocan, comportamiento idéntico al actual). Aplica a las **cuatro** formas de casilla, no solo a Circular:
  - **Circular**: separación entre círculos vecinos (ya descrita arriba).
  - **Cuadrada/Hexagonal**: encoge el cuadrado/hexágono de cada celda hacia su centro, dejando ver el "Color de fondo" en el hueco entre celdas vecinas — efecto "baldosas con junta". Con Margen = 0, el aspecto es exactamente el que ya tienen hoy (sin cambio visual para tableros existentes).
- El campo **"Grosor"** ya existente amplía su rango de 1–20 a **0–20**, para las cuatro formas de casilla: 0 significa "sin línea/contorno visible". En Cuadrada/Hexagonal esto permite, como efecto añadido, dejar la rejilla sin línea; en Circular es la forma de que el círculo se dibuje sin contorno.
- Nuevo campo **"Color del círculo"** (relleno del círculo), independiente de "Color del patrón": selector de color con checkbox "Transparente", mismo patrón que el campo "Color de fondo" ya existente en este mismo modal. Sin valor guardado → transparente (el círculo queda solo con contorno, si "Grosor" > 0). Solo visible/aplicable con forma "Circular" — Cuadrada/Hexagonal no tienen relleno propio, dibujan solo la línea de la rejilla (sin cambios respecto a hoy).
- El campo **"Color de fondo"** ya existente (con opción Transparente) se reutiliza tal cual como color del espacio entre siluetas vecinas (círculos, o el hueco que deja el margen en cuadrada/hexagonal) — sin cambios en su comportamiento actual.

Casos límite:

- Si "Grosor" es 0 y "Color del círculo" es transparente, el círculo no se dibuja (queda solo el color de fondo detrás) — combinación válida, no bloqueada por la interfaz.
- Si el margen, combinado con muchas filas/columnas, dejaría un tamaño de silueta (círculo, cuadrado o hexágono) igual o menor que cero, esa silueta simplemente no se dibuja (tamaño cero) — sin error ni bloqueo de interfaz. Aplica a las cuatro formas.
- Migración: no aplica para "Circular" — es una forma nueva, ningún tablero guardado antes de este cambio puede tenerla. Para Cuadrada/Hexagonal, tanto el rango ampliado de "Grosor" como el nuevo "Margen" no cambian el aspecto de ningún tablero ya guardado (su "Grosor" ya guardado sigue siendo ≥ 1, y sin valor guardado de "Margen" se asume 0, idéntico al comportamiento actual).

Convivencia con lo existente: cambio totalmente aditivo sobre el fondo "Color y patrón" ya existente en Tablero simple. No afecta a los fondos "Imagen" ni "Color", ni a Tablero personalizado.

Alcance de los datos: la configuración del patrón se guarda como el resto de propiedades de Tablero simple (localStorage/fichero de la partida), sin alcance especial de usuario o sesión — el proyecto no distingue usuarios.

Quién puede usarlo: mismo acceso que el resto de "Configurar fondo" — disponible en modo edición, sin restricción de rol (el proyecto no tiene roles).

### Definición visual de alto nivel

- El modal "Configurar fondo — Color y patrón" reorganiza su sección "Color" en dos secciones separadas, para las cuatro formas de casilla:
  - **"Patrón"** (renombrada de "Color"): "Margen" (nuevo, ver más abajo), "Color del patrón" + "Grosor" (ya existentes; "Grosor" amplía su rango a 0–20). Con la forma "Circular" seleccionada, se le suma un campo más, solo visible/aplicable para esa forma: "Color del círculo" (selector de color + checkbox "Transparente").
  - **"Fondo"**: el campo "Color de fondo" (con checkbox "Transparente") ya existente, ahora en su propia sección — sin cambios de comportamiento.
  - La sección "Configuración" (Forma de casilla, Filas, Columnas) no cambia.
  - "Margen" y el rango ampliado de "Grosor" están presentes y aplican en las **cuatro** formas, no solo Circular — a diferencia de "Color del círculo", que sigue siendo exclusivo de Circular.
- Sobre el tablero renderizado en la mesa: en vez de líneas rectas tocándose, cualquiera de las cuatro formas puede mostrar sus siluetas (círculos, cuadrados o hexágonos) separadas por el margen configurado, dejando ver el color de fondo en el hueco.

### Preguntas de alcance resueltas

- ¿Se integra como una forma más del modal ya existente, o como un sistema aparte? → Cuarta forma en el mismo desplegable "Forma de casilla".
- ¿Los círculos son solo contorno o pueden rellenarse? → Configurable por separado: relleno del círculo (transparente o color sólido) y contorno del círculo (color/grosor reutilizados de "Color del patrón"/"Grosor").
- ¿Qué controla el campo "Grosor" para círculos? → Sigue siendo el grosor de la línea del contorno; el tamaño del círculo no es configurable directamente, se calcula automáticamente para ocupar el máximo espacio posible sin solapar, menos el margen.
- ¿El color de relleno del círculo comparte campo con el color del borde? → No, campo independiente ("Color del círculo"), para poder combinar libremente (p.ej. círculo rojo con borde negro).
- ¿El espacio entre círculos usa un campo nuevo o el "Color de fondo" ya existente? → Reutiliza el "Color de fondo" ya existente, sin cambios.
- ¿Aplica también a Tablero personalizado? → No, solo a Tablero simple.
- ¿Cómo se decide si el círculo tiene contorno o no? → Sin checkbox aparte: "Grosor" pasa a admitir 0 (sin contorno), en vez de un checkbox "Activar borde" independiente — decisión tomada tras revisar la maqueta de combinaciones y ver que el checkbox era redundante con lo que ya expresa "Grosor". Este rango ampliado (0–20 en vez de 1–20) aplica al campo compartido por las cuatro formas, no solo a Circular.
- ¿"Margen" es exclusivo de Circular o también aplica a Cuadrada/Hexagonal? → También aplica a las otras tres formas: encoge la silueta de cada celda (cuadrado/hexágono) hacia su centro, mismo criterio que en Circular, dejando ver el "Color de fondo" en el hueco entre celdas vecinas.
- Valores por defecto: "Color del círculo" transparente; "Margen" en rango 0–50, por defecto 0 (mismo aspecto que hoy en las cuatro formas); "Grosor" mantiene su valor por defecto actual (no es 0), así que un tablero recién creado nace con contorno visible.

## Technical notes

- Sistema existente relevante: `src/ui/boardPatternModal.js` (modal de configuración "Configurar fondo — Color y patrón"), `src/ui/componentModal.js` (líneas ~1062-1122, integración del tipo de fondo `fondoTipo: 'colorPatron'`), `src/ui/componentRenderer.js` (líneas ~757-813, render del patrón).
- La rejilla hexagonal ya se renderiza vía SVG (`renderHexGrid`) en `componentRenderer.js` — buen precedente para el render de círculos, que también necesitará SVG en vez del `background-image` con gradientes lineales que usa hoy el patrón cuadrado.
- El campo "Margen" ahora aplica también a Cuadrada/Hexagonal, no solo a Circular: el patrón cuadrado actual se dibuja con `background-image`/`linear-gradient` (líneas, sin noción de "silueta" individual por celda) y el hexagonal con `renderHexGrid` (SVG, si dibuja polígono por celda). Soportar "encoger la silueta" en cuadrada probablemente obligue a migrar también su render a SVG (un `<rect>`/`<polygon>` por celda, como ya hace el hexagonal) en vez de sostener el truco de `linear-gradient` — a valorar en el plan técnico.
- Ningún desajuste entre documentación técnica (`design/docs/features/018-componente-tablero-simple.md`, `design/docs/style/01-tokens-visual.md`) y código detectado durante el análisis.
