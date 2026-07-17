# Diseño técnico — Prototipo digital "Errantes"

## 1. Objetivo y restricciones

El prototipo digital debe:

- Funcionar en cualquier navegador moderno.
- Ser **portable**: el entregable es un único fichero HTML autocontenido (JS y CSS
  incrustados, cualquier librería externa embebida en el propio fichero). Debe poder
  abrirse con doble clic (`file://`), sin servidor ni instalación.
- No depender de Node.js ni de ninguna herramienta de build compleja: el proceso de
  generación del entregable usa PowerShell, ya disponible en Windows.

El código fuente, en cambio, se mantiene organizado en ficheros y capas separadas
dentro de `/src` para facilitar el mantenimiento. Un script de build (`/scripts`)
transforma ese código fuente en el fichero único de `/src/_output`.

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

`core` no depende de ninguna otra capa. `ui` solo depende de `core` (lee/escribe
estado). `modes` compone `ui` y `core` para construir cada pantalla. `data` solo
conoce la forma de los datos (lista de componentes), no el resto de capas. `main.js`
es el único punto que conoce y conecta todas las capas.

Comunicación entre capas: el estado (`core/state.js`) es la única fuente de verdad;
los cambios se notifican mediante un bus de eventos simple (`core/eventBus.js`,
`emit`/`on`) para que la UI se vuelva a renderizar sin acoplar los módulos entre sí.

## 3. Modo juego vs modo edición

Ambos modos **comparten el mismo modelo de datos**: la lista de componentes en
`core/state.js`. No hay dos modelos distintos para "editar" y "jugar" — el modo
edición crea/modifica componentes con `core/component.js`, y el modo juego lee esos
mismos componentes para mostrarlos/usarlos en la partida.

- `ui/modeSwitcher.js` permite alternar el modo activo (`core/state.js` guarda
  `mode: 'play' | 'edit'`).
- Al cambiar de modo se emite `mode:changed`, y `main.js` vuelve a renderizar la
  pantalla activa (`modes/play/playMode.js` o `modes/edit/editMode.js`).
- Cualquier alta/edición/borrado de un componente en modo edición emite
  `components:changed`; esto dispara tanto el refresco de la UI como el autoguardado
  en `localStorage`. Así, lo creado en modo edición está disponible inmediatamente
  en modo juego sin pasos adicionales.

## 4. Modelo de datos de componente

Modelo genérico y extensible, pensado para no requerir cambios estructurales cuando
se definan los tipos concretos de componente (cartas, tokens, tablero, tracks...):

```js
{
  id: string,          // identificador único (crypto.randomUUID())
  type: string,         // libre, p.ej. "carta", "token", "tablero"
  name: string,
  properties: object,   // pares clave-valor libres, específicos de cada tipo
  image: string | null, // referencia a un recurso en /src/img, opcional
}
```

`core/component.js` expone `createComponent()` y `updateComponent()` como única vía
para construir/modificar componentes, evitando que cada capa maneje la forma del
objeto directamente. Cuando el juego necesite tipos con reglas propias, se puede
añadir validación/esquema por `type` sin romper componentes existentes.

## 5. Persistencia

- **Autoguardado**: cada cambio en la lista de componentes se guarda automáticamente
  en `localStorage` (`data/persistence.js`, `saveToLocalStorage`/
  `loadFromLocalStorage`). Al arrancar la aplicación, si hay datos guardados se
  cargan automáticamente.
- **Exportar/Importar JSON**: `exportToJsonFile` descarga el estado como fichero
  `.json`; `importFromJsonFile` permite cargar un fichero exportado previamente.
  Sirve para compartir configuraciones de componentes entre máquinas o hacer copias
  de seguridad manuales, dado que `localStorage` es local al navegador.

## 6. Flujo de desarrollo y build

- **Desarrollo**: se abre `src/index.html` (no es el entregable) con un servidor
  estático local — por ejemplo la extensión "Live Server" de VSCode — porque los
  módulos ES nativos (`<script type="module">`) no cargan correctamente vía
  `file://`. Este fichero referencia los módulos de `/src` directamente.
- **Build**: `scripts/build.ps1` recorre el grafo de `import`/`export` a partir de
  `src/main.js`, transforma cada módulo a un pequeño sistema `require`/
  `module.exports` en tiempo de ejecución (sin depender de bundlers ni de Node.js),
  e inserta el resultado junto con el CSS de `src/styles/main.css` dentro de una
  copia de `src/index.html`. El resultado, un único fichero autocontenido, se
  escribe en `src/_output/index.html` — ese es el entregable portable.

## 7. Convenciones de código

- Módulos ES (`import`/`export`) organizados por capa/responsabilidad, un fichero
  por módulo funcional.
- Sin dependencias externas por defecto. Si en el futuro se necesita una librería
  (por ejemplo, para el editor visual), solo se incorpora si su bundle puede
  embeberse íntegramente en el HTML final (sin llamadas a CDN en tiempo de
  ejecución ni instalación adicional para el usuario final).
- Los recursos gráficos van en `/src/img`, organizados por tipo de componente a
  medida que se definan.
