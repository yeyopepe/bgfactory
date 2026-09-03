# Datos — texto libre de la mesa

Este cambio introduce un único dato nuevo: el texto libre que el usuario escribe en Configuración y que se muestra en la esquina inferior derecha de la mesa. Es una preferencia global de la aplicación en ese navegador/perfil, análoga al idioma y al título de la app.

| Dato | Descripción funcional | Tipo | Valor por defecto | Obligatorio | Notas |
|---|---|---|---|---|---|
| Texto de la mesa | Texto libre, de una o varias líneas, que el usuario introduce en el panel de Configuración para mostrarlo en la esquina inferior derecha de la mesa, encima del nombre/versión y del enlace a GitHub, separado de esas dos líneas fijas por una fina línea horizontal. | Texto (cadena de caracteres, puede contener saltos de línea) | Vacío (sin texto) | No | Solo texto plano: nunca se interpreta como HTML, Markdown ni ningún otro código. La línea separadora solo se muestra cuando este dato tiene contenido. Sin límite de longitud impuesto por reglas de negocio (a lo sumo un tope amplio en el propio control para no romper el diseño). |

## Alcance y persistencia (funcional)

| Aspecto | Comportamiento |
|---|---|
| Dónde vive | Preferencia global de la aplicación en el navegador/perfil actual. |
| Persistencia | Se conserva al recargar la página. Se pierde al abrir la aplicación en otro navegador o perfil (vuelve a estar vacío). |
| Relación con la partida | Independiente del juego: **no** se incluye al exportar un juego y **no** se ve afectado al importar uno. |
| Compatibilidad | Un estado guardado con una versión anterior a este cambio simplemente no tiene este dato; al cargarlo se asume vacío, sin ningún paso de migración ni aviso. |
| Valores no válidos | Si el dato guardado no es un texto (estado manipulado), se trata como vacío. |
