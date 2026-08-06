- **Nombre**: Modal de edición de componentes con ancho dinámico (75% de pantalla)
- **Código**: 00178
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

modifica el ancho de la ventana de propiedades de elementos en modo edición: debe ser un 75% del ancho actual de la pantalla

## Descripción completa

Actualmente, la ventana de edición de propiedades de un componente (modal que se abre al editar un elemento en modo edición) tiene un ancho máximo fijo de 500px, sin adaptarse al tamaño real de la pantalla del usuario.

El cambio solicita que esta ventana sea más responsiva: el ancho debe ser **dinámico**, calculado como **el 75% del ancho actual de la pantalla**, permitiendo que la modal se adapte automáticamente a diferentes resoluciones.

**Comportamiento esperado:**

- **Ancho dinámico**: La modal ocupa el 75% del ancho disponible en la ventana del navegador.
- **Límites**: Ancho mínimo de 400px (para no quedar demasiado estrecha en pantallas pequeñas), máximo de min(1000px, 90vw) (para no abusar del espacio en pantallas muy anchas).
- **Recalculación automática**: Al redimensionar la ventana del navegador, el ancho de la modal se recalcula automáticamente y se adapta al nuevo tamaño.
- **Altura sin cambios**: Solo el ancho es afectado por este cambio; la altura mantiene su comportamiento actual (`max-height: 80vh`).
- **Sin persistencia**: El 75% es un valor calculado dinámicamente en cada sesión, no se guarda/persiste en el estado de la aplicación.

**Casos de uso:**

- Usuario en pantalla de escritorio (1920px de ancho): modal de ~1440px (75% de 1920, pero limitada a máximo 1000px, así que 1000px final).
- Usuario en pantalla pequeña (800px de ancho): modal de ~600px (75% de 800).
- Usuario en portátil antiguo (1024px): modal de ~768px (75% de 1024).

## Apuntes técnicos

- **Fichero principal**: `src/ui/componentModal.js` — crea la modal con `className = 'modal'`.
- **Estilos base**: `src/styles/main.css` — `.modal` define actualmente `max-width: 500px; width: 90%`.
- **Estrategia de implementación**: Crear una clase CSS nueva (p.ej. `.component-editor-modal`) que sobrescriba los valores de `max-width`/`width` heredados de `.modal`, sin modificar la clase base. Esto garantiza que otras modales del proyecto no se ven afectadas por este cambio.
- **Cálculo del ancho**: Usar CSS con `calc()` y `min()`/`max()` para expresar la lógica (75vw con límites), evitando lógica JavaScript innecesaria.
