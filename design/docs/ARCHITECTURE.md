# Diseño técnico — Prototipo digital "Errantes"

## 1. Objetivo y restricciones

El prototipo digital debe:

- Funcionar en cualquier navegador moderno.
- Ser **portable**: el entregable es un único fichero HTML autocontenido (JS y CSS incrustados, cualquier librería externa embebida en el propio fichero). Debe poder abrirse con doble clic (`file://`), sin servidor ni instalación.
- No depender de Node.js ni de ninguna herramienta de build compleja: el proceso de generación del entregable usa PowerShell, ya disponible en Windows.

El código fuente, en cambio, se mantiene organizado en ficheros y capas separadas dentro de `/src` para facilitar el mantenimiento. Un script de build (`/scripts`) transforma ese código fuente en el fichero único de `/src/_output`.

## 2. Arquitectura por capas

```
core/    → estado de la aplicación, modelo de datos, bus de eventos
modes/   → modo juego (play) y modo edición (edit), cada uno con su propia carpeta
ui/      → elementos de interfaz reutilizables entre modos
data/    → persistencia (localStorage + import/export JSON)
main.js  → bootstrap: conecta las capas anteriores
```

Dependencias entre capas (flecha = "depende de"):

```
modes/* ──▶ ui/* ──▶ core/*
modes/* ──────────▶ core/*
main.js ──▶ data/*, ui/*, modes/*, core/*
```

`core` no depende de ninguna otra capa. `ui` solo depende de `core` (lee/escribe estado). `modes` compone `ui` y `core` para construir cada pantalla. `data` solo conoce la forma de los datos (lista de componentes), no el resto de capas. `main.js` es el único punto que conoce y conecta todas las capas.

Comunicación entre capas: el estado (`core/state.js`) es la única fuente de verdad; los cambios se notifican mediante un bus de eventos simple (`core/eventBus.js`, `emit`/`on`) para que la UI se vuelva a renderizar sin acoplar los módulos entre sí.

## 3. Modo juego vs modo edición

Ambos modos **comparten el mismo modelo de datos**: la lista de componentes en `core/state.js`. No hay dos modelos distintos para "editar" y "jugar" — el modo edición crea/modifica componentes con `core/component.js`, y el modo juego lee esos mismos componentes para mostrarlos/usarlos en la partida.

- `ui/editModeToggle.js` implementa un flujo de entrar/salir (no un selector de dos opciones) sobre `core/state.js` (`mode: 'play' | 'edit'`), con dos funciones: `renderEnterEditButton`, que en modo juego muestra el botón "Entrar en modo edición"; y `renderEditToolbar`, que en modo edición muestra una franja fija en la parte superior con el botón "Salir del modo edición". Ambas operan siempre sobre `setMode()` / evento `mode:changed` de `core/state.js`, sin cambios en esa capa.
- Al cambiar de modo se emite `mode:changed`, y `main.js` vuelve a renderizar la pantalla activa (`modes/play/playMode.js` o `modes/edit/editMode.js`).
- `modes/edit/editMode.js` ahora es funcional: renderiza una mesa infinita (pan/zoom) con los componentes dibujados directamente sobre ella (vía `ui/componentRenderer.js`, seleccionables con click para editar), y un panel lateral con el listado de componentes con acciones de alta/edición/borrado, y una modal de edición (`ui/componentModal.js`) para crear/modificar componentes. El botón "Editar" del listado, o hacer click sobre la representación de un componente en la mesa, abren la misma modal; el botón "Eliminar" del listado lo borra directamente (el borrado no está disponible haciendo click en la mesa); el botón "+ Añadir componente" abre la modal vacía para crear uno nuevo. `modes/play/playMode.js` renderiza la misma mesa infinita, con los componentes "cuadro-texto" dibujados sobre ella (sin interacción de selección), y ya no muestra ningún listado aparte.
- Cualquier alta/edición/borrado de un componente en modo edición emite `components:changed`; esto dispara tanto el refresco de la UI como el autoguardado en `localStorage`. Así, lo creado en modo edición está disponible inmediatamente en modo juego sin pasos adicionales.

## 4. Modelo de datos de componente

Modelo genérico y extensible, pensado para no requerir cambios estructurales cuando se definan los tipos concretos de componente (cartas, tokens, tablero, tracks...):

```js
{
  id: string,          // identificador único (generado con crypto.randomUUID(), pero ahora editable por el usuario en la modal)
  type: string,         // libre, p.ej. "carta", "token", "tablero", "cuadro-texto"
  name: string,
  properties: object,   // pares clave-valor libres, específicos de cada tipo
  image: string | null, // referencia a un recurso en /src/img, opcional
}
```

`core/component.js` expone `createComponent()` y `updateComponent()` como única vía para construir/modificar componentes, evitando que cada capa maneje la forma del objeto directamente. El `id` sigue siendo generado por `createComponent()`, pero ahora puede ser editado por el usuario desde `ui/componentModal.js` con validación de no-vacío y unicidad (la validación se hace en la capa UI, no en `core/component.js`, siguiendo la separación de responsabilidades). Cuando el juego necesite tipos con reglas propias, se puede añadir validación/esquema por `type` sin romper componentes existentes.

### Tipos de componente implementados

- **`'cuadro-texto'`**: primer tipo concreto. Propiedades específicas en la modal:
  - `contenido` (string): texto que se muestra
  - `tamañoFuente` (number): tamaño en píxeles
  - `colorTexto` (string, color hex): color del texto (negro por defecto)
  - `colorFondo` (string, color hex o vacío): color de fondo, transparente si vacío (por defecto)

## 5. Capa UI — módulos reutilizables

Módulos de UI que se reutilizan entre modos (`modes/play` y `modes/edit`) sin conocimiento directo del modelo de datos:

- **`ui/table.js`**: mesa infinita con capacidad de pan (arrastrar) y zoom (rueda del ratón). Crea una estructura con dos elementos: `el` (la superficie completa a insertar en el DOM) y `worldEl` (contenedor interior donde cada modo añade su contenido). Completamente genérico — no conoce componentes, solo proporciona una superficie interactiva. La posición y zoom son puramente visuales, no persistidos.
- **`ui/componentRenderer.js`**: a diferencia de `ui/table.js`, sí conoce el modelo de componente. Expone `renderComponentsOnTable(worldEl, components, { onSelect } = {})`, que dibuja cada componente soportado (de momento solo `'cuadro-texto'`) sobre el `worldEl` de la mesa; si se pasa `onSelect`, la representación se vuelve clicable (invoca `onSelect(component)`, usado en modo edición para abrir la modal). Reutilizado por `modes/play/playMode.js` (sin `onSelect`) y `modes/edit/editMode.js` (con `onSelect`).
- **`ui/componentModal.js`**: modal de creación/edición de componentes con dos tabs ("Generales" y "Específicas"). Tab "Generales": campo `id` editable con validación en vivo (no-vacío y único). Tab "Específicas": contenido que varía según `component.type` — para `'cuadro-texto'` muestra campos para contenido, tamaño de fuente, color de texto y color de fondo. Pie con botones "Cancelar" y "Aceptar" (deshabilitado si el id no es válido). Reutilizable para alta y edición.
- **`ui/editModeToggle.js`**: proporciona los botones de entrada/salida de modo edición sin conocer detalles de cómo se implementa cada modo.
- **`ui/componentList.js`**: listado de componentes, reutilizable en modo edición (con acciones configurable de edición/borrado). Ya no se usa en modo juego (ver sección 3).

## 6. Persistencia

- **Autoguardado**: cada cambio en la lista de componentes se guarda automáticamente en `localStorage` (`data/persistence.js`, `saveToLocalStorage`/`loadFromLocalStorage`). Al arrancar la aplicación, si hay datos guardados se cargan automáticamente.
- **Exportar/Importar JSON**: `exportToJsonFile` descarga el estado como fichero `.json`; `importFromJsonFile` permite cargar un fichero exportado previamente. Sirve para compartir configuraciones de componentes entre máquinas o hacer copias de seguridad manuales, dado que `localStorage` es local al navegador.

## 7. Flujo de desarrollo y build

- **Desarrollo**: se abre `src/index.html` (no es el entregable) con un servidor estático local — por ejemplo la extensión "Live Server" de VSCode — porque los módulos ES nativos (`<script type="module">`) no cargan correctamente vía `file://`. Este fichero referencia los módulos de `/src` directamente.
- **Build**: `scripts/build.py` recorre el grafo de `import`/`export` a partir de `src/main.js`, transforma cada módulo a un pequeño sistema `require`/`module.exports` en tiempo de ejecución (sin depender de bundlers ni de Node.js, solo de Python), e inserta el resultado junto con el CSS de `src/styles/main.css` dentro de una copia de `src/index.html`. El resultado, un único fichero autocontenido, se escribe en `src/_output/index.html` — ese es el entregable portable.

## 8. Convenciones de código

- Módulos ES (`import`/`export`) organizados por capa/responsabilidad, un fichero por módulo funcional.
- Sin dependencias externas por defecto. Si en el futuro se necesita una librería (por ejemplo, para el editor visual), solo se incorpora si su bundle puede embeberse íntegramente en el HTML final (sin llamadas a CDN en tiempo de ejecución ni instalación adicional para el usuario final).
- Los recursos gráficos van en `/src/img`, organizados por tipo de componente a medida que se definan.
