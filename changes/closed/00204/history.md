# Historial de prompts — 00204

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-14 — sesión inicial

en la ventana de componentes:
- Los grupos deben tener un número de orden. Este número re-enumera todos los elementos internos a números consecutivos. Es decir, los números de orden de los diferentes elementos sí se actualizan para cada uno.
- hay que mostrar los elementos individuales que forman un grupo debajo del grupo, de manera que se vea que están agrupados (como si el grupo fuera una carpeta y los elementos su contenido).
- Los elementos individuales no  pueden modificar su número de orden si forman parte de un grupo, ya que es el número del grupo el que controla los demás.
