- **Name**: Interruptores de formato (negrita/cursiva/subrayado) en el título de componente
- **Code**: 00216
- **Type**: change
- **Creation date**: 2026-08-15

## Full description

En la ventana "Editar título de componente" (abierta desde "Ayuda jugador" en las propiedades de un componente), el campo "Contenido" permite escribir el texto de la etiqueta que se muestra en Modo Juego.

Se añaden tres interruptores — **Negrita**, **Cursiva** y **Subrayado** — junto a ese campo, que aplican el formato correspondiente a todo el texto del título de una vez (no a una parte seleccionada): cada interruptor se activa/desactiva de forma independiente y pueden combinarse entre sí (p. ej. negrita y subrayado a la vez), pero no afectan solo a una palabra o fragmento suelto del título.

Es el mismo mecanismo que ya existe hoy para el texto de un "Cuadro de texto" dentro de una Carta — interruptores independientes y combinables, mismo aspecto visual.

No se añade ningún control de tamaño de texto — se descartó explícitamente al confirmar el alcance. Tampoco se modifica el campo "Ayuda"/tooltip de un componente ni la forma en que se escribe hoy su formato — este cambio afecta únicamente al título.

### Preguntas de alcance resueltas

- **¿Botones que insertan etiquetas HTML por selección, o interruptores que aplican el formato a todo el título?** → Interruptores de todo el título, reutilizando el mecanismo ya existente para el texto de un Cuadro de texto de Carta — más simple, sin mecanismo nuevo, aunque no permite mezclar formatos dentro de un mismo título.
- **¿Se añade también un control de tamaño de texto?** → No, descartado explícitamente por el usuario.

## Technical notes

- Precedente exacto a reutilizar: `src/ui/cardTextBoxModal.js`, bloque de interruptores "Negrita/Cursiva/Subrayado" de un `TextBox` de carta — propiedades booleanas independientes (`negrita`, `cursiva`, `subrayado`), marcado `.align-group`/`.align-group__btn` (clase `active` por interruptor encendido, sin exclusión mutua entre ellos), iconos SVG inline ya definidos ahí (`STYLE_TOGGLE_OPTIONS`). Catalogado en `design/docs/style/03-modales-menus.md` §12.10 ("Interruptores independientes y combinables") como el ejemplo de referencia de este patrón — cita textualmente este mismo caso de uso (Negrita/Cursiva/Subrayado).
- `src/ui/componentTitleModal.js`: añadir el mismo bloque de interruptores debajo del `<textarea>` del campo "Contenido" (confirmado con maqueta), con tres propiedades nuevas del título (p. ej. `tituloNegrita`/`tituloCursiva`/`tituloSubrayado`, booleanas, `false` por defecto) en el objeto `working` (junto a `texto`, `colorTexto`, `colorFondo`, `fondoTransparencia`) y en `onAccept`.
- `src/ui/componentModal.js`: el objeto `titulo` pasado a `openComponentTitleModal` y los campos leídos/escritos en `onAccept` (~líneas 581-593) deben incluir las tres propiedades nuevas, igual que las ya existentes.
- Persistencia y modelo de datos del componente (`core/component.js`, ver `design/docs/architecture/01-component-model.md`/`INDEX.md` §8 "Persistencia y guardado a fichero"): las tres propiedades nuevas del título viven junto a `tituloTexto`/`tituloColorTexto`/`tituloColorFondo`/`tituloFondoTransparencia` — mismo campo `properties`/nivel del componente, revisar que sigan el mismo camino de copiado en `copyOf` (`01-component-model.md`) y sincronización de copias vinculadas (`005-elementos-tipo-copia-vinculados-y-sincronizados-con-un-original.md`).
- Renderizado (`src/ui/componentRenderer.js`, `attachComponentTitle`, línea ~287): aplicar `font-weight`/`font-style`/`text-decoration` inline en `label.style`, igual criterio que ya usa esa función para `color`/`backgroundColor` (dato de usuario aplicado inline, no vía clase CSS — la Style Bible ya documenta esa excepción para color de texto/fondo del título).
- No se toca `TOOLTIP_ALLOWED_TAGS`/`sanitizeBasicTooltipHtml` (ya no hace falta añadir `<u>`, al no insertarse etiquetas HTML) ni el campo "Ayuda"/tooltip de `src/ui/componentModal.js`.
- Revisar si "Copiar estilo"/"Pegar estilo" (disponible en "Carta", `design/docs/features/035-titulo-de-componente.md`: "el bloque completo del título" se incluye) debe incorporar las tres propiedades nuevas igual que el resto del bloque del título.
