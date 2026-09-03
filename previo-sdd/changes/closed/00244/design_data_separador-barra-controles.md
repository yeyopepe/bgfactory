# Datos — Separador de la barra de controles superior

Definición funcional del nuevo elemento **separador vertical** que se añade a la fila de controles de la cabecera. **No** es una decisión técnica sobre su implementación (clase CSS, marcado): es qué representa, dónde va y qué separa.

## Elemento

| Dato | Descripción funcional | Valores / detalle | Obligatorio |
|---|---|---|---|
| Separador de barra de controles | Línea vertical fina, meramente visual, sin interacción. Divide la fila de controles de la cabecera en dos bloques con propósito distinto. | Una línea vertical de 1 px, tono claro tenue sobre el fondo oscuro de la cabecera, de altura similar a la de un botón de la fila. Sin texto, sin acción, no recibe foco. | Sí, en la fila de controles de la cabecera cuando en ella coexisten el bloque de fichero y el bloque de acciones (modo juego). |
| Posición | Entre el **bloque de gestión de fichero** (Importar, Exportar) y el **bloque de acciones** (botón de modo, Ajustar zoom, Configuración). | Un único separador, a la derecha del último botón de fichero y a la izquierda del primer botón de acción. | — |
| Presencia por modo | Aparece cuando en la fila conviven los dos bloques. En modo edición, si la fila de la cabecera no incluye botones de fichero (Importar/Exportar quedan en la franja de herramientas de edición), el separador de la cabecera no se muestra; la franja de herramientas de edición conserva sus propios separadores actuales. | Depende de la disposición final que fije `pv-how`; el criterio funcional es "separador solo donde de verdad hay dos bloques que separar". | — |

## Qué separa (bloques)

| Bloque | Botones que contiene | Estilo | 
|---|---|---|
| Gestión de fichero | Importar, Exportar | Blanco sobre fondo oscuro (contorno claro), en ambos modos. |
| Acciones | Modo Edición / Modo Juego, Ajustar zoom, Configuración | Modo Edición / Modo Juego y Ajustar zoom: azul (acción primaria). Configuración: blanco/negro (contorno claro), para distinguirlo de las acciones azules. |

## Relación con lo existente

- La franja de herramientas de edición (segunda franja oscura, solo en modo edición) ya usa hoy separadores verticales del mismo tipo entre sus grupos. El separador nuevo replica ese lenguaje visual en la fila de la cabecera, donde hoy no existe ninguno.
