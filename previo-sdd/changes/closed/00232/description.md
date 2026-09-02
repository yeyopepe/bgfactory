- **Name**: Insignias de estado (bloqueado / oculto / copia) mal posicionadas sobre cuadros de texto
- **Code**: 00232
- **Type**: fix
- **Creation date**: 2026-09-02

## Full description

En modo edición, sobre cada componente de la mesa se superponen unas pequeñas insignias que indican su estado: una insignia de candado cuando el componente está bloqueado, una insignia de "oculto" (icono de ojo tachado) cuando está marcado como oculto, y una insignia de "copia" (círculo rojo con icono de dos cuadrados) cuando el componente es una copia vinculada de otro. Existe además una insignia relacionada, la de "tiene copias" (píldora con el número de copias entre paréntesis), que se muestra sobre el componente original.

**Comportamiento actual (incorrecto).** En los componentes de tipo "cuadro de texto" (texto libre colocado directamente sobre la mesa) esas insignias no se pintan bien: aparecen despegadas del texto visible. La insignia de candado flota a la derecha, separada del final del texto; las insignias de "oculto" y de "copia" quedan por debajo o fuera del texto en lugar de pegadas a él. El resultado es que cuesta relacionar la insignia con el cuadro de texto al que pertenece, y en algún caso la insignia puede quedar parcialmente cortada. En el resto de tipos de componente (carta, tablero, dado, documento, mazo) estas mismas insignias sí se pintan correctamente, ancladas de forma clara a una esquina del componente.

**Por qué ocurre (en términos funcionales).** Un cuadro de texto no se dibuja dentro de una caja con fondo o borde visibles, a diferencia del resto de tipos, que siempre tienen una superficie rellena. El área real del cuadro de texto es mayor que las letras que se ven (incluye un margen interior y el espacio propio de la línea de texto) y se ajusta automáticamente al contenido. Al anclar las insignias a las esquinas de esa área "invisible", visualmente quedan separadas de las letras.

**Comportamiento esperado.** En un cuadro de texto, las insignias de bloqueado, oculto y copia deben verse claramente asociadas al elemento de texto: igual de legibles y "pegadas" a él que en el resto de tipos de componente, sin flotar en el vacío ni quedar recortadas. La insignia de "tiene copias" debe seguir el mismo criterio, por coherencia visual. El significado, los colores y las condiciones en las que aparece cada insignia no cambian; lo único que se corrige es su colocación sobre este tipo de componente.

## Technical notes

- Renderizado de las insignias: `src/ui/componentRenderer.js`, rama `component.type === 'texto'` de `renderComponentsOnTable` (aprox. líneas 659-690). Añade `createLockBadge()` / `createHiddenBadge()` / `createCopyBadge()` / `createHasCopiesBadge()` como hijos del elemento raíz `.text-box`, igual que hacen el resto de ramas por tipo.
- El elemento raíz `.text-box` recibe `position: absolute` inline (contexto de posicionamiento para las insignias), `padding: 0.5rem`, `overflow: hidden`, y `width`/`height` solo si `component.width`/`component.height` no son nulos (si lo son, la caja se autoajusta al contenido).
- CSS de las insignias: `src/styles/main.css`, `.component-lock-badge` (`top/right: 2px`), `.component-hidden-badge` (`bottom/right: 2px`), `.component-copy-badge` y `.component-has-copies-badge` (`bottom/left: 2px`), todas `position: absolute`, `pointer-events: none`, círculo de 18px (la de "tiene copias" es una píldora de alto 18px).
- `.text-box` en `main.css` (aprox. línea 866) no define fondo ni borde; solo `text-shadow` sutil. El resto de tipos (`.board`, `.carta`, `.dice`, etc.) sí tienen caja con relleno/sombra, por lo que la insignia en la esquina de la caja se lee como parte del componente.
- Existe una insignia comparable que **sí** se ancla fuera de la caja: `.component-id-label` / `attachComponentTitle` usan anclaje tipo `top: -1.6rem; left: 2px` (patrón "pegado a la esquina exterior"). Puede servir de referencia para el criterio de colocación en `.text-box`.
- `getComponentsBounds` (`src/ui/componentRenderer.js`, aprox. líneas 555-556) usa `MIN_TEXT_BOX_WIDTH`/`MIN_TEXT_BOX_HEIGHT` (40×24) como tamaño por defecto del cuadro de texto cuando no tiene `width`/`height`, mientras que el renderizado real deja que el navegador lo autoajuste al contenido. No es la causa del bug, pero conviene tenerlo presente si el arreglo toca el dimensionado del `.text-box`.
- Inconsistencia documentación vs. código a corregir en el plan:
  - `previo-sdd/design/docs/style/03-modales-menus.md` §12.3 ("Contorno de selección y etiqueta en rojo para copias", y los apartados de cada insignia) da por hecho que el overlay de insignias funciona de forma uniforme en los 6 tipos seleccionables, incluido `.text-box`, "sin nada específico por tipo".
  - `previo-sdd/design/docs/architecture/INDEX.md` §8 ("Menú contextual, candado de bloqueo, indicador de oculto") afirma que un tipo que use `renderComponentsOnTable` "obtiene automáticamente ... insignia de candado ... e insignia de Oculto ... sin nada específico por tipo".
  - El código real muestra que `.text-box`, al no tener caja visible, sí necesita un tratamiento propio de colocación de las insignias. La documentación debe reflejar esta excepción.
- Ámbito: cambio acotado a colocación visual de un overlay decorativo (`pointer-events: none`) en modo edición. Sin entrada de datos de usuario, sin cambio de contrato de funciones, sin red ni persistencia. Sin puntos de seguridad pendientes.
