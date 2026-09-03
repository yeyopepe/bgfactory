# Datos — Glosario de traducción español → inglés

Definición funcional del vocabulario que la traducción al inglés debe respetar de forma consistente en toda la aplicación. **No** es una decisión técnica sobre cómo se almacenan los textos (eso lo resuelve `pv-how`): es la lista de equivalencias que fija el sentido de cada término de dominio, para que la traducción sea coherente y revisable término por término.

## Términos de dominio (juegos de mesa)

| Término (es) | Traducción fijada (en) | Notas de uso |
|---|---|---|
| mazo | deck | Colección de cartas apiladas. Siempre «deck», nunca «pile» ni «stack». |
| carta | card | Componente de tipo carta. La etiqueta compuesta actual «Carta/Ficha» pasa a «Card/Token». |
| ficha | token | Tipo antiguo, ya migrado a «carta», pero el término aún aparece en textos de importación/conversión. Siempre «token», nunca «piece» ni «counter». |
| tablero | board | Cubre «tablero simple» → «simple board» y «tablero personalizado» → «custom board». |
| dado | die (singular) / dice (plural) | «Lanzar el dado» → «Roll the die». «2 dados» → «2 dice». |
| etiqueta | tag | Sistema de agrupación por etiquetas. Nunca «label» (reservado para etiquetas de formulario). |
| grupo | group | Agrupación de componentes seleccionados juntos. |
| recurso | resource | Imágenes y tipografías de la galería. |
| componente | component | Cualquier elemento colocado en la mesa. |
| modo juego | play mode | |
| modo edición | edit mode | |
| «Modo Edición» (botón) | "Edit Mode" | Etiqueta del botón que entra en modo edición (antes «Entrar en modo edición»). Title Case, coherente con el par. |
| «Modo Juego» (botón) | "Play Mode" | Etiqueta del botón que vuelve al modo juego (antes «Salir del modo edición»). Title Case, coherente con el par. |
| «Configuración» (botón/panel) | "Settings" | Tooltip del botón de engranaje y título del panel. |
| «Importar» / «Exportar» | "Import" / "Export" | Botones de gestión de fichero. |
| «Ajustar zoom» | "Fit to view" o "Zoom to fit" | Tooltip del botón de encuadre. A fijar en la traducción respetando brevedad. |
| mesa | table | El lienzo infinito donde se colocan los componentes. «Mesa» del juego, no «desk». |
| cara (de una carta / tablero) | face | «Cara frontal» → «front face», «cara trasera» → «back face». |
| recurso semilla / por defecto | default resource | Recursos de ejemplo sembrados en una sesión nueva. |

## Convenciones de interfaz en inglés

| Aspecto | Regla |
|---|---|
| Registro | Etiquetas de botón cortas e imperativas («Aceptar» → «OK» o «Accept» según contexto de uso actual; «Cancelar» → «Cancel»; «Cerrar» → «Close»; «Eliminar» → «Delete»). |
| Mayúsculas | Coherente con el estilo actual del proyecto en botones y encabezados; no forzar Title Case donde el original español usa mayúscula solo inicial. |
| Plurales y cantidades | Formas naturales: «1 component» / «2 components», nunca «1 component(s)». La forma singular/plural la elige el sistema según la cantidad. |
| Textos con valores variables | La posición del valor dentro de la frase se adapta al inglés; puede no coincidir con el orden del español. Ejemplo: «Eliminar {n} componentes» → «Delete {n} components». |
| Traducción sensible al contexto | Un mismo término español con funciones distintas en la interfaz puede tener traducciones distintas (identificadores de texto separados). No se traduce palabra por palabra. |
| Marca y versión | «BG Factory» y el número de versión (p. ej. «v.00246») no se traducen nunca. |
| Contenido del usuario | Nunca se traduce (títulos libres, ids, contenido de componentes, nombres de recursos/etiquetas, tooltips configurables). |

## Idiomas de esta versión

| Idioma | Código | Rol |
|---|---|---|
| Español | es | Idioma actual y **referencia canónica**: su lista de textos siempre está completa; los demás idiomas usan el texto español cuando les falte una entrada. |
| Inglés | en | Traducción nueva y completa de todo el chrome en esta entrega. Puede quedar temporalmente incompleto durante el desarrollo sin causar fallos (cae a español). |
