- **Nombre**: Check "Mostrar tooltip" en propiedades generales de los componentes
- **Código**: 00034
- **Tipo**: change

## Prompt original del usuario

ms-new en las propiedades generales de todos los elementos, añade un check titulado "Mostrar tooltip" (desactivado por defecto). Si está activado: muestra el tooltipo en el modo juego. Si no lo están, no lo muestra. Esto solo afecta al modo juego

## Descripción completa

Se añade, en las propiedades generales de cualquier componente (aplica a los tres tipos existentes: cuadro de texto, tablero y dado), un nuevo check titulado **"Mostrar tooltip"**, desactivado por defecto.

Comportamiento:
- Si el check está **activado**, ese componente muestra su tooltip identificativo al pasar el ratón por encima, pero **solo en Modo Juego**.
- Si el check está **desactivado** (valor por defecto), ese componente no muestra ningún tooltip en Modo Juego.
- El Modo Edición no se ve afectado por este check en ningún caso: sigue identificando los componentes con etiquetas visibles, tal y como ya hace hoy.
- El contenido del tooltip no cambia respecto al que ya se genera actualmente (el identificador del componente); lo único que se añade es el control de si se muestra o no, por componente.

Cambio de comportamiento por defecto (confirmado con el usuario durante el análisis):
Hoy, en Modo Juego, todos los componentes muestran ya ese tooltip de forma fija, sin poder desactivarse. Tras este cambio, al ser el check nuevo y estar desactivado por defecto, ningún componente mostrará tooltip en Modo Juego salvo que el usuario lo active explícitamente en sus propiedades. Este cambio de comportamiento por defecto es intencionado, no un efecto colateral.

Alcance de los datos:
El valor del check se guarda como parte de los datos del propio componente, igual que el resto de sus propiedades generales, y persiste con el autoguardado del proyecto.

Quién puede usarlo:
Cualquier usuario en Modo Edición puede activar o desactivar este check para cualquier componente, de cualquiera de los tres tipos existentes.

Definición visual de alto nivel:
No se introduce ningún elemento visual nuevo más allá de un checkbox con su etiqueta "Mostrar tooltip", ubicado junto al resto de propiedades generales del componente. No se genera propuesta visual (`design_*.html`) adicional para este cambio.

## Apuntes técnicos

- El modal de edición de componente (`src/ui/componentModal.js`) tiene una pestaña "Generales" (`generalContent`) donde ya existe un checkbox equivalente, "Bloqueado" (`workingComponent.bloqueado`), que sirve de patrón directo a seguir para el nuevo checkbox (misma estructura `modal__field modal__field--checkbox`, mismo uso de `createHelpIcon`).
- El propio identificador que se muestra en el tooltip lo genera `formatComponentIdentifier(component)` en `src/ui/componentRenderer.js`.
- El renderer (`src/ui/componentRenderer.js`, función `renderComponentsOnTable`) recibe un parámetro `identifyMode` global (no por componente) que hoy vale `'tooltip'` en Modo Juego (`src/modes/play/playMode.js:12`) y `'label'` en Modo Edición (`src/modes/edit/editMode.js:151`). Las líneas que asignan `title = formatComponentIdentifier(component)` cuando `identifyMode === 'tooltip'` están en `componentRenderer.js:249` (texto), `:343` (tablero) y `:479` (dado) — estas tres deberán condicionarse también a la nueva propiedad del componente, no solo a `identifyMode`.
- No existe hoy ninguna propiedad general de componente aparte de `bloqueado`; la nueva debe seguir el mismo patrón de nombrado en español del resto de propiedades del proyecto (p.ej. `mostrarTooltip`).
