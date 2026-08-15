# Historial de prompts — 00213

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-15 — sesión inicial

en las ventanas de propiedades y otros sitios tenemos un icono interrogante con una ayuda en forma tooltip. Algunas aparecen solo con colocar el cursor y otras hace falta pulsar sobre el icono. Revisa toda la app y unifica el comportamiento: debe mostrarse el tooltip al colocarse encima, sin tener que pulsar.

### Aclaración durante el análisis

Al presentar el análisis de los 18 usos de `createHelpIcon` (8 en modal por texto largo/HTML, 10 en tooltip por texto corto), se preguntó qué hacer con los casos de texto largo/HTML al unificar hacia "siempre tooltip". Respuesta del usuario:

> Pues entonces quita el umbral pero el comportamiento debe ser siempre el de pulsar para que aparezca la modal de ayuda

Esto invertía la dirección de la petición inicial (de "siempre tooltip en hover" a "siempre click → modal"), así que se confirmó explícitamente con una pregunta directa. Respuesta del usuario:

> Siempre click → modal (tu última respuesta)

Sobre el contenido HTML (visualEditorModal.js:298), se preguntó si renderizarlo tal cual en el nuevo mecanismo o convertirlo a texto plano. Respuesta del usuario:

> Dejar como está por la respuesta anterior

(es decir, al confirmarse que el destino final es la ventana emergente ya existente, ese caso no cambia — sigue mostrándose tal cual ya se mostraba en modal).
