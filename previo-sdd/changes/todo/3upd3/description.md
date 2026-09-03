# Idea: 3upd3

## Idea
Convertir copias en originales

## Code
3upd3

## Creation date
2026-09-03

## Notes

Esta idea se degradó desde el cambio/fix `00194` (originalmente de tipo `change`) el 2026-09-03 por haber sido despriorizado. Se conserva todo el material de análisis que tenía.

### Descripción funcional completa (copiada del cambio 00194)

Hoy, cada "Copia" de un componente queda permanentemente vinculada a su original: se sincroniza automáticamente con él (tipo, nombre, imagen, tamaño, etc.) mientras ambos existan, y solo puede desvincularse de esa sincronización en vivo campo a campo (checkbox "Sincronizado", que solo afecta a "Bloqueado"/"Oculto"). No existe ninguna forma de romper del todo el vínculo y convertir una copia en un elemento completamente independiente ("original").

Este cambio añade esa posibilidad, en dos sitios:

**1. Conversión masiva, desde el componente Original.** En la pestaña "Copias" de la modal de configuración de un componente que tiene copias vinculadas, un nuevo botón **"Convertir copias en originales"** (situado justo debajo del ya existente "Sincronizar todas las copias", antes de la sección "Desincronizar todas las copias"). Al pulsarlo, pide confirmación explícita indicando cuántas copias se van a convertir y dejando claro que la acción es permanente (p. ej. *"¿Convertir las N copias de "X" en elementos originales independientes? Esta acción no se puede deshacer."*). Al confirmar, todas las copias vinculadas a ese original quedan convertidas de golpe en elementos completamente independientes (ver "Qué implica convertir" más abajo). Tras la conversión, la pestaña se actualiza al instante para reflejar que el componente ya no tiene copias ("Este objeto no tiene copias."), sin cerrar la modal — igual que ya hacen hoy "Sincronizar"/"Desincronizar todas las copias".

**2. Conversión individual, desde la propia copia.** La modal reducida que se abre al editar un componente que es en sí mismo una Copia incluye una nueva sección con su propio botón **"Convertir en original"**. Al pulsarlo, pide la misma confirmación (adaptada a un único elemento, p. ej. *"¿Convertir "X" en un elemento original independiente? Esta acción no se puede deshacer."*). Al confirmar, esa copia concreta queda convertida en un elemento independiente.

**Qué implica convertir una copia en original:**
- Deja de estar vinculada a su original: no se sincroniza nunca más con él, y desaparece de su pestaña "Copias" y de su listado "Ver copias vinculadas...".
- Conserva tal cual todos los valores que tenía en el momento de la conversión (los que ya estaban sincronizados con el original, más cualquier valor propio de "Bloqueado"/"Oculto" si estaba desincronizada) — no hay ningún reseteo ni recálculo de propiedades al convertir, solo se rompe el vínculo.
- Recibe un **id nuevo**, calculado igual que al "Clonar" un componente: se parte del id del elemento **original** (quitándole cualquier sufijo `(n)` que ya tuviera, no del id propio de la copia, que tiene formato `id-COPY-XXX`) y se le añade `(n)` con el siguiente entero libre de esa familia — compartiendo numeración con los clones que ya existan de ese mismo original (p. ej. si ya existe un clon "abc(1)", la primera copia convertida de "abc" sería "abc(2)"). En la conversión masiva, cada copia convertida calcula su propio siguiente número libre según se van convirtiendo, para que ninguna de las nuevas coincida con otra del mismo lote.
- Pasa a comportarse como cualquier otro componente normal: aparece en el panel de Componentes con todas las acciones disponibles (Editar/Clonar/Copiar/Eliminar), no solo Editar/Eliminar como una copia.

**Fuera de alcance de este cambio**: la modal de solo lectura "Ver copias vinculadas..." (tabla con columnas Id/Sincronizada, abierta desde "Ver copias vinculadas..." en la pestaña "Copias") no incorpora ninguna acción de conversión por fila — se mantiene tal cual, sin cambios.

#### Caso límite pendiente de resolver en la planificación técnica

Si la copia que se convierte está en ese momento guardada dentro de un mazo (referenciada por su id desde ese mazo), su id cambia al convertirse — queda pendiente decidir en `pv-how` si la referencia del mazo se actualiza automáticamente al nuevo id, o si la carta se saca del mazo como parte de la conversión.

### Material preservado

- **`original-change-description.md`** — la entrada original del cambio 00194 completa, incluida su sección "Technical notes" (incongruencia documentación/código en `05-ui-layer.md`/`01-component-model.md` sobre la 3ª pestaña "Copias", mecanismo `nextCloneId`/`cloneComponent` en `core/component.js` a reutilizar para el id, ausencia de mecanismo de desvinculación de `copyOf`, campos sincronizables en vivo, y referencia potencialmente rota en `properties.cartaIds` de un `'mazo'`).
- **`plan.md`** — el plan técnico que se había elaborado para el cambio.
- **`original-change-history.md`** — el historial de prompts del cambio.
- **`design_modal-copia-convertir.html`** — mockup de la modal reducida de la copia con el botón "Convertir en original".
- **`design_pestana-copias-original.html`** — mockup de la pestaña "Copias" del original con el botón "Convertir copias en originales".
