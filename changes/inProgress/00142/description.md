- **Nombre**: Selector de comportamiento del click derecho en Interacciones programadas
- **Código**: 00142
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

añade a la sección de interacciones programadas de las propiedades generales de los elementos otro selector para configurar el comportamiento del click derecho (incluyendo ninguno como valor por defecto)

## Descripción completa

En las propiedades generales de cualquier elemento del tablero (pestaña "Generales" de su ventana de edición), dentro de la sección "Interacciones programadas", se añade un nuevo selector para configurar qué hace el click derecho sobre ese elemento durante la partida.

El selector tiene dos opciones:

- **"Ninguno"** (valor por defecto para los elementos nuevos): el click derecho no produce ningún efecto sobre el elemento.
- **"Abrir menú contextual"**: el click derecho abre el menú que ya existe hoy sobre cualquier elemento (con la opción de bloquear/desbloquear el elemento, más las acciones propias de cada tipo — por ejemplo, barajar o ver el contenido de un mazo, o meter una carta en un mazo).

Este selector aparece siempre, para cualquier tipo de elemento (antes, esta sección solo se mostraba para dado, carta y mazo; ahora se muestra para todos los tipos, ya que el click derecho aplica a todos por igual).

Elegir "Ninguno" no afecta a ninguna otra interacción del elemento: se puede seguir arrastrando, y el click izquierdo y el doble click siguen funcionando como hasta ahora. Tampoco impide bloquear o desbloquear el elemento — esa acción sigue estando disponible desde el modo edición, en las propias propiedades del elemento.

**Elementos ya existentes al aplicar este cambio**: como hoy el click derecho siempre abre el menú contextual (no es opcional), los elementos que ya existieran antes de este cambio conservan ese comportamiento sin que el usuario tenga que hacer nada — se comportan como si tuvieran seleccionada la opción "Abrir menú contextual". El valor por defecto "Ninguno" solo aplica a los elementos que se creen a partir de ahora.

**Preguntas de alcance resueltas con el usuario**:

- ¿Qué hace exactamente "Ninguno"? → Desactiva el menú contextual entero (ni bloquear/desbloquear ni las acciones específicas del tipo), sin afectar al resto de interacciones del elemento.
- ¿Qué pasa con los elementos ya existentes, dado que el nuevo valor por defecto es "Ninguno"? → Conservan su comportamiento actual ("Abrir menú contextual"); solo los elementos nuevos nacen en "Ninguno".
- ¿Aplica a todos los tipos de elemento o solo a los que ya tenían esta sección? → A los seis tipos por igual, ya que el menú contextual de click derecho existe hoy en todos ellos.
- ¿Cambia algo en modo edición? → No, el click derecho no tiene comportamiento especial en modo edición, ni antes ni después de este cambio.
- ¿Se mantiene sincronizado entre un elemento y sus copias vinculadas? → Sí, igual que el resto de configuración general del elemento.

## Apuntes técnicos

- Comportamiento actual (fijo, no configurable) en `modes/play/playMode.js` → `onContextMenu`: siempre abre `ui/contextMenu.js` con fila general "Bloquear"/"Desbloquear" (sobre `component.bloqueado`) + `specificItems` por tipo (`'mazo'`: Barajar/Ver contenido; `'carta'`: Meter en mazo). `interactionsByType` en ese mismo fichero documenta la fila "Clic derecho" = "Abrir este menú" para los 6 tipos.
- Sección "Interacciones programadas" hoy en `core/interactions.js` (`TYPE_INTERACTIONS`, solo `dado`/`carta`/`mazo`) y renderizada condicionalmente en `ui/componentModal.js` (`typeInteractions.length > 0`) — esa condición debe ampliarse para que la sección se muestre siempre, ya que el nuevo selector de click derecho no depende del tipo.
- Nuevo campo general de componente propuesto: `accionClickDerecho: 'ninguno' | 'menuContextual'`, default `'ninguno'` en `createComponent()` (`core/component.js`).
- Migración de componentes preexistentes (sin el campo) a `'menuContextual'`: función tipo `migrateAccionClickDerecho`, mismo patrón que `migrateBloqueado` en `core/state.js`, invocada desde `loadComponents`.
- Sincronización con copias vinculadas: añadir el campo a la lista que propaga `syncCopyWithOriginal` en `core/component.js` (junto a `mostrarTooltip`, `subirAlMoverInteractuar`, `grupoIds`, `interaccionesDesactivadas`).
- Documentación técnica relevante: `ARCHITECTURE.md` sección 4 (modelo de datos de componente, campo `interaccionesDesactivadas`) y sección 3 (menú contextual de componente en modo juego, cambio 00088).
